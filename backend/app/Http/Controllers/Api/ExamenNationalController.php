<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnneeScolaire;
use App\Models\Eleve;
use App\Models\ExamenNational;
use App\Models\Inscription;
use Illuminate\Http\Request;

class ExamenNationalController extends Controller
{
    public function index(Request $request)
    {
        $anneeActive = AnneeScolaire::where('is_active', true)->first();

        if (!$anneeActive) {
            return response()->json(['data' => []]);
        }

        $inscriptions = Inscription::whereHas('classe', fn ($q) => $q->where('niveau', 'CM2'))
            ->where('annee_scolaire_id', $anneeActive->id)
            ->with(['eleve:id,nom,prenom,matricule', 'classe:id,nom'])
            ->get();

        $examens = ExamenNational::whereIn('eleve_id', $inscriptions->pluck('eleve_id'))
            ->where('annee_scolaire_id', $anneeActive->id)
            ->get()
            ->keyBy('eleve_id');

        $resultat = $inscriptions->map(fn ($inscription) => [
            'eleve' => $inscription->eleve,
            'classe' => $inscription->classe,
            'examen' => $examens->get($inscription->eleve_id),
        ]);

        return response()->json(['data' => $resultat]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'eleve_id' => 'required|exists:eleves,id',
            'type_examen' => 'nullable|string|max:50',
        ]);

        $eleve = Eleve::findOrFail($validated['eleve_id']);
        $inscription = $eleve->inscriptionActuelle()->with('classe')->first();

        if (!$inscription || $inscription->classe->niveau !== 'CM2') {
            return response()->json(['message' => "Seuls les élèves de CM2 peuvent être inscrits à l'examen national."], 422);
        }

        $existant = ExamenNational::where('eleve_id', $eleve->id)
            ->where('annee_scolaire_id', $inscription->annee_scolaire_id)
            ->first();

        if ($existant) {
            return response()->json(['message' => "Cet élève est déjà inscrit à l'examen national pour cette année."], 422);
        }

        $examen = ExamenNational::create([
            'eleve_id' => $eleve->id,
            'annee_scolaire_id' => $inscription->annee_scolaire_id,
            'type_examen' => $validated['type_examen'] ?? 'CEP',
            'statut_inscription' => 'inscrit',
            'resultat' => 'en_attente',
            'saisi_par' => $request->user()->id,
        ]);

        return response()->json(['data' => $examen, 'message' => "Élève inscrit à l'examen national."], 201);
    }

    public function inscriptionMasse(Request $request)
    {
        $validated = $request->validate([
            'eleve_ids' => 'required|array|min:1',
            'eleve_ids.*' => 'required|exists:eleves,id',
            'type_examen' => 'nullable|string|max:50',
        ]);

        $resultats = [];
        $erreurs = [];

        foreach ($validated['eleve_ids'] as $eleveId) {
            $eleve = Eleve::find($eleveId);
            $inscription = $eleve->inscriptionActuelle()->with('classe')->first();

            if (!$inscription || $inscription->classe->niveau !== 'CM2') {
                $erreurs[] = ['eleve_id' => $eleveId, 'erreur' => "N'est pas en CM2."];
                continue;
            }

            $existant = ExamenNational::where('eleve_id', $eleveId)
                ->where('annee_scolaire_id', $inscription->annee_scolaire_id)
                ->first();

            if ($existant) {
                $erreurs[] = ['eleve_id' => $eleveId, 'erreur' => 'Déjà inscrit.'];
                continue;
            }

            $resultats[] = ExamenNational::create([
                'eleve_id' => $eleveId,
                'annee_scolaire_id' => $inscription->annee_scolaire_id,
                'type_examen' => $validated['type_examen'] ?? 'CEP',
                'statut_inscription' => 'inscrit',
                'resultat' => 'en_attente',
                'saisi_par' => $request->user()->id,
            ]);
        }

        return response()->json([
            'data' => $resultats,
            'erreurs' => $erreurs,
            'message' => count($resultats).' élève(s) inscrit(s)'.(count($erreurs) > 0 ? ', '.count($erreurs).' ignoré(s).' : '.'),
        ], 201);
    }

    public function update(Request $request, ExamenNational $examenNational)
    {
        $validated = $request->validate([
            'statut_inscription' => 'sometimes|in:non_inscrit,inscrit',
            'numero_candidat' => 'nullable|string|max:50',
            'centre_examen' => 'nullable|string|max:150',
            'date_examen' => 'nullable|date',
            'resultat' => 'sometimes|in:en_attente,admis,ajourne',
            'mention' => 'nullable|string|max:50',
            'date_publication_resultat' => 'nullable|date',
        ]);

        $examenNational->update($validated);

        return response()->json(['data' => $examenNational, 'message' => 'Mise à jour enregistrée.']);
    }
}