<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnneeScolaire;
use App\Models\Echeance;
use App\Models\Eleve;
use App\Models\Inscription;
use App\Models\Paiement;
use Illuminate\Http\Request;

class PaiementController extends Controller
{
    public function index(Request $request)
    {
        $query = Paiement::with(['echeance.typeFrais', 'eleve:id,nom,prenom,matricule']);

        if ($request->filled('eleve_id')) $query->where('eleve_id', $request->eleve_id);
        if ($request->filled('echeance_id')) $query->where('echeance_id', $request->echeance_id);
        if ($request->filled('statut')) $query->where('statut', $request->statut);
        if ($request->filled('annee_scolaire_id')) {
            $query->whereHas('echeance.typeFrais', fn ($q) => $q->where('annee_scolaire_id', $request->annee_scolaire_id));
        }

        return response()->json(['data' => $query->orderByDesc('date_paiement')->get()]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'eleve_id' => 'required|exists:eleves,id',
            'echeance_id' => 'required|exists:echeances,id',
            'montant' => 'required|numeric|min:0.01',
            'date_paiement' => 'required|date',
            'moyen_paiement' => 'required|in:especes,mobile_money,cheque,autre',
            'reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ]);

        $echeance = Echeance::with('typeFrais')->findOrFail($validated['echeance_id']);
        $eleve = Eleve::findOrFail($validated['eleve_id']);
        $niveauEleve = $eleve->inscriptionActuelle()->with('classe')->first()?->classe?->niveau;

        if ($echeance->typeFrais->niveau && $echeance->typeFrais->niveau !== $niveauEleve) {
            return response()->json([
                'message' => "Cette échéance concerne le niveau {$echeance->typeFrais->niveau}, incompatible avec le niveau de cet élève ({$niveauEleve}).",
            ], 422);
        }

        $dejaPaye = Paiement::where('eleve_id', $validated['eleve_id'])
            ->where('echeance_id', $echeance->id)
            ->where('statut', 'valide')
            ->sum('montant');

        $soldeRestant = (float) $echeance->montant - (float) $dejaPaye;

        if ($validated['montant'] > $soldeRestant) {
            return response()->json([
                'message' => "Le montant dépasse le solde restant sur cette échéance ({$soldeRestant} FCFA restants sur un tarif de {$echeance->montant} FCFA).",
            ], 422);
        }

        $paiement = Paiement::create($validated + [
            'numero_recu' => Paiement::genererNumeroRecu($validated['date_paiement']),
            'saisi_par' => $request->user()->id,
            'statut' => 'valide',
        ]);

        return response()->json(['data' => $paiement->load('echeance.typeFrais'), 'message' => 'Paiement enregistré.'], 201);
    }

    public function show(Paiement $paiement)
    {
        return response()->json(['data' => $paiement->load(['echeance.typeFrais', 'eleve'])]);
    }

    public function annuler(Paiement $paiement)
    {
        $paiement->update(['statut' => 'annule']);
        return response()->json(['data' => $paiement, 'message' => 'Paiement annulé.']);
    }

    private function echeancesPourNiveau(int $anneeScolaireId, ?string $niveau)
    {
        return Echeance::whereHas('typeFrais', function ($q) use ($anneeScolaireId, $niveau) {
            $q->where('annee_scolaire_id', $anneeScolaireId)
              ->where(function ($q2) use ($niveau) {
                  $q2->whereNull('niveau');
                  if ($niveau) $q2->orWhere('niveau', $niveau);
              });
        })->get();
    }

    public function solde(Request $request, Eleve $eleve)
    {
        $anneeActive = AnneeScolaire::where('is_active', true)->firstOrFail();
        $niveau = $eleve->inscriptionActuelle()->with('classe')->first()?->classe?->niveau;

        $echeances = $this->echeancesPourNiveau($anneeActive->id, $niveau);

        $paiementsParEcheance = Paiement::where('eleve_id', $eleve->id)
            ->whereIn('echeance_id', $echeances->pluck('id'))
            ->where('statut', 'valide')
            ->groupBy('echeance_id')
            ->selectRaw('echeance_id, SUM(montant) as total_paye')
            ->pluck('total_paye', 'echeance_id');

        $totalDu = (float) $echeances->sum('montant');
        $totalPaye = (float) $paiementsParEcheance->sum();
        $soldeRestant = (float) $echeances->sum(function ($e) use ($paiementsParEcheance) {
            return max(0, $e->montant - (float) ($paiementsParEcheance[$e->id] ?? 0));
        });

        return response()->json(['data' => [
            'total_du' => $totalDu,
            'total_paye' => $totalPaye,
            'solde_restant' => $soldeRestant,
        ]]);
    }

    public function soldes(Request $request)
    {
        $anneeActive = AnneeScolaire::where('is_active', true)->firstOrFail();

        $query = Inscription::whereHas('anneeScolaire', fn ($q) => $q->where('is_active', true))->with('classe:id,niveau');
        if ($request->filled('classe_id')) {
            $query->where('classe_id', $request->classe_id);
        }
        $inscriptions = $query->get();

        $echeancesParNiveau = [];
        foreach ($inscriptions->pluck('classe.niveau')->unique() as $niveau) {
            $echeancesParNiveau[$niveau ?? ''] = $this->echeancesPourNiveau($anneeActive->id, $niveau)->pluck('montant', 'id');
        }

        $eleveIds = $inscriptions->pluck('eleve_id');

        $paiementsParEleveEcheance = Paiement::whereIn('eleve_id', $eleveIds)
            ->where('statut', 'valide')
            ->groupBy('eleve_id', 'echeance_id')
            ->selectRaw('eleve_id, echeance_id, SUM(montant) as total_paye')
            ->get()
            ->groupBy('eleve_id');

        $resultat = $inscriptions->map(function ($inscription) use ($echeancesParNiveau, $paiementsParEleveEcheance) {
            $echeances = $echeancesParNiveau[$inscription->classe->niveau ?? ''] ?? collect();
            $paiementsEleve = $paiementsParEleveEcheance->get($inscription->eleve_id, collect())->pluck('total_paye', 'echeance_id');

            $soldeRestant = $echeances->sum(function ($montantEcheance, $echeanceId) use ($paiementsEleve) {
                $paye = (float) ($paiementsEleve[$echeanceId] ?? 0);
                return max(0, $montantEcheance - $paye);
            });

            return ['eleve_id' => $inscription->eleve_id, 'solde_restant' => $soldeRestant];
        });

        return response()->json(['data' => $resultat]);
    }

    public function retards(Request $request)
    {
        $anneeActive = AnneeScolaire::where('is_active', true)->firstOrFail();

        $elevesInscrits = Inscription::whereHas('anneeScolaire', fn ($q) => $q->where('is_active', true))
            ->with(['eleve:id,nom,prenom,matricule', 'classe:id,niveau'])
            ->get();

        $resultat = [];

        foreach ($elevesInscrits->groupBy(fn ($i) => $i->classe->niveau ?? '') as $niveauBrut => $inscriptionsNiveau) {
            $niveau = $niveauBrut ?: null;

            $echeancesEnRetard = $this->echeancesPourNiveau($anneeActive->id, $niveau)
                ->filter(fn ($e) => $e->date_echeance && $e->date_echeance->isPast());

            foreach ($echeancesEnRetard as $echeance) {
                $totauxPayes = Paiement::where('echeance_id', $echeance->id)
                    ->where('statut', 'valide')
                    ->groupBy('eleve_id')
                    ->selectRaw('eleve_id, SUM(montant) as total_paye')
                    ->pluck('total_paye', 'eleve_id');

                foreach ($inscriptionsNiveau as $inscription) {
                    $paye = (float) ($totauxPayes[$inscription->eleve_id] ?? 0);
                    if ($paye < $echeance->montant) {
                        $resultat[] = ['eleve' => $inscription->eleve, 'echeance' => $echeance];
                    }
                }
            }
        }

        return response()->json(['data' => $resultat]);
    }
}