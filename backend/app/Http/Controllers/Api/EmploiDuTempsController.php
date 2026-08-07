<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Affectation;
use App\Models\Classe;
use App\Models\EmploiDuTemps;
use App\Models\ParametreEcole;
use App\Services\PdfGenerator;
use Illuminate\Http\Request;

class EmploiDuTempsController extends Controller
{
    public function index(Request $request)
    {
        $query = EmploiDuTemps::with(['classe', 'matiere', 'enseignant:id,nom,prenom']);

        if ($request->user()->role === 'enseignant' && !$request->filled('classe_id')) {
            $query->where('enseignant_id', $request->user()->id);
        }
        if ($request->filled('classe_id')) $query->where('classe_id', $request->classe_id);

        $creneaux = $query->get()->sortBy([
            fn ($a, $b) => array_search($a->jour_semaine, ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'])
                <=> array_search($b->jour_semaine, ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']),
            fn ($a, $b) => $a->heure_debut <=> $b->heure_debut,
        ])->values();

        return response()->json(['data' => $creneaux]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'classe_id' => 'required|exists:classes,id',
            'matiere_id' => 'required|exists:matieres,id',
            'jour_semaine' => 'required|in:lundi,mardi,mercredi,jeudi,vendredi,samedi',
            'heure_debut' => 'required|date_format:H:i',
            'heure_fin' => 'required|date_format:H:i|after:heure_debut',
        ]);

        $enseignantId = $this->deduireEnseignant($validated['classe_id'], $validated['matiere_id']);

        if (!$enseignantId) {
            return response()->json([
                'message' => "Aucun enseignant assigné à cette classe pour cette matière. Désigne d'abord un titulaire (fiche classe) ou une affectation (fiche enseignant).",
            ], 422);
        }

        $donnees = array_merge($validated, ['enseignant_id' => $enseignantId]);

        $conflit = $this->detecterConflit($donnees);
        if ($conflit) {
            return response()->json(['message' => $conflit], 422);
        }

        $creneau = EmploiDuTemps::create($donnees);

        return response()->json([
            'data' => $creneau->load(['classe', 'matiere', 'enseignant:id,nom,prenom']),
            'message' => 'Créneau ajouté.',
        ], 201);
    }

    public function update(Request $request, EmploiDuTemps $emploiDuTemps)
    {
        $validated = $request->validate([
            'classe_id' => 'sometimes|required|exists:classes,id',
            'matiere_id' => 'sometimes|required|exists:matieres,id',
            'jour_semaine' => 'sometimes|required|in:lundi,mardi,mercredi,jeudi,vendredi,samedi',
            'heure_debut' => 'sometimes|required|date_format:H:i',
            'heure_fin' => 'sometimes|required|date_format:H:i|after:heure_debut',
        ]);

        $classeId = $validated['classe_id'] ?? $emploiDuTemps->classe_id;
        $matiereId = $validated['matiere_id'] ?? $emploiDuTemps->matiere_id;

        $enseignantId = $this->deduireEnseignant($classeId, $matiereId);

        if (!$enseignantId) {
            return response()->json([
                'message' => "Aucun enseignant assigné à cette classe pour cette matière. Désigne d'abord un titulaire (fiche classe) ou une affectation (fiche enseignant).",
            ], 422);
        }

        $donneesCompletes = [
            'classe_id' => $classeId,
            'matiere_id' => $matiereId,
            'enseignant_id' => $enseignantId,
            'jour_semaine' => $validated['jour_semaine'] ?? $emploiDuTemps->jour_semaine,
            'heure_debut' => $validated['heure_debut'] ?? $emploiDuTemps->heure_debut,
            'heure_fin' => $validated['heure_fin'] ?? $emploiDuTemps->heure_fin,
        ];

        $conflit = $this->detecterConflit($donneesCompletes, $emploiDuTemps->id);
        if ($conflit) {
            return response()->json(['message' => $conflit], 422);
        }

        $emploiDuTemps->update(array_merge($validated, ['enseignant_id' => $enseignantId]));

        return response()->json([
            'data' => $emploiDuTemps->load(['classe', 'matiere', 'enseignant:id,nom,prenom']),
            'message' => 'Créneau mis à jour.',
        ]);
    }

    public function destroy(EmploiDuTemps $emploiDuTemps)
    {
        $emploiDuTemps->delete();
        return response()->json(['message' => 'Créneau supprimé.']);
    }

    public function genererPdf(Classe $classe)
    {
        $classe->load(['enseignantTitulaire:id,nom,prenom', 'anneeScolaire']);

        $creneaux = EmploiDuTemps::where('classe_id', $classe->id)
            ->with(['matiere'])
            ->get()
            ->groupBy('jour_semaine');

        $joursLabels = [
            'lundi' => 'Lundi', 'mardi' => 'Mardi', 'mercredi' => 'Mercredi',
            'jeudi' => 'Jeudi', 'vendredi' => 'Vendredi', 'samedi' => 'Samedi',
        ];

        $grille = [];
        foreach ($joursLabels as $jour => $label) {
            $grille[$jour] = ($creneaux->get($jour) ?? collect())->sortBy('heure_debut')->values();
        }

        $nomEcole = ParametreEcole::where('cle', 'nom_ecole')->value('valeur') ?? 'École';
        $logoPath = ParametreEcole::where('cle', 'logo_path')->value('valeur');

        $mpdf = PdfGenerator::depuisVue('emplois_du_temps.grille', [
            'classe' => $classe,
            'grille' => $grille,
            'joursLabels' => $joursLabels,
            'nomEcole' => $nomEcole,
            'logoPath' => $logoPath,
            'titulaire' => $classe->enseignantTitulaire,
            'anneeScolaire' => $classe->anneeScolaire,
        ], [
            'format' => 'A4-L',
            'margin_left' => 10, 'margin_right' => 10, 'margin_top' => 10, 'margin_bottom' => 10,
        ]);

        return response($mpdf->Output("emploi-du-temps-{$classe->nom}.pdf", 'S'), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="emploi-du-temps-'.$classe->nom.'.pdf"',
        ]);
    }

    private function deduireEnseignant(int $classeId, int $matiereId): ?int
    {
        return Affectation::enseignantResponsable($classeId, $matiereId);
    }

    private function detecterConflit(array $donnees, ?int $ignorerId = null): ?string
    {
        $conflitClasse = EmploiDuTemps::where('classe_id', $donnees['classe_id'])
            ->where('jour_semaine', $donnees['jour_semaine'])
            ->when($ignorerId, fn ($q) => $q->where('id', '!=', $ignorerId))
            ->where('heure_debut', '<', $donnees['heure_fin'])
            ->where('heure_fin', '>', $donnees['heure_debut'])
            ->exists();

        if ($conflitClasse) {
            return "Cette classe a déjà un créneau sur ce jour à cette heure.";
        }

        $conflitEnseignant = EmploiDuTemps::where('enseignant_id', $donnees['enseignant_id'])
            ->where('jour_semaine', $donnees['jour_semaine'])
            ->when($ignorerId, fn ($q) => $q->where('id', '!=', $ignorerId))
            ->where('heure_debut', '<', $donnees['heure_fin'])
            ->where('heure_fin', '>', $donnees['heure_debut'])
            ->exists();

        if ($conflitEnseignant) {
            return "L'enseignant assigné à cette matière a déjà un créneau sur ce jour à cette heure, pour une autre classe.";
        }

        return null;
    }
}