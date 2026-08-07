<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Classe;
use App\Models\Inscription;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class InscriptionController extends Controller
{
    public function index(Request $request)
    {
        $query = Inscription::with(['eleve', 'classe']);

        if ($request->filled('annee_scolaire_id')) {
            $query->where('annee_scolaire_id', $request->annee_scolaire_id);
        }

        return response()->json(['data' => $query->get()]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'eleve_id' => 'required|exists:eleves,id',
            'classe_id' => 'required|exists:classes,id',
            'statut' => 'required|in:inscrit,reinscrit,redouble,transfere,abandon',
            'date_inscription' => 'required|date',
        ]);

        $classe = Classe::findOrFail($validated['classe_id']);

        $dejaInscrit = Inscription::where('eleve_id', $validated['eleve_id'])
            ->where('annee_scolaire_id', $classe->annee_scolaire_id)
            ->exists();

        if ($dejaInscrit) {
            throw ValidationException::withMessages([
                'eleve_id' => ['Cet élève est déjà inscrit pour cette année scolaire.'],
            ]);
        }

        $inscription = Inscription::create([
            'eleve_id' => $validated['eleve_id'],
            'classe_id' => $classe->id,
            'annee_scolaire_id' => $classe->annee_scolaire_id,
            'statut' => $validated['statut'],
            'date_inscription' => $validated['date_inscription'],
        ]);

        return response()->json(['data' => $inscription->load(['eleve', 'classe']), 'message' => 'Réinscription enregistrée.'], 201);
    }

    public function promotionMasse(Request $request)
    {
        $validated = $request->validate([
            'classe_source_id' => 'required|exists:classes,id',
            'classe_cible_promotion_id' => 'nullable|exists:classes,id',
            'classe_cible_redoublement_id' => 'nullable|exists:classes,id',
            'decisions' => 'required|array|min:1',
            'decisions.*.eleve_id' => 'required|exists:eleves,id',
            'decisions.*.action' => 'required|in:promouvoir,redoubler,aucune',
        ]);

        $resultats = [];
        $erreurs = [];

        foreach ($validated['decisions'] as $decision) {
            if ($decision['action'] === 'aucune') {
                continue;
            }

            if ($decision['action'] === 'promouvoir') {
                if (empty($validated['classe_cible_promotion_id'])) {
                    $erreurs[] = ['eleve_id' => $decision['eleve_id'], 'erreur' => 'Aucune classe de promotion sélectionnée.'];
                    continue;
                }
                $classeCible = Classe::find($validated['classe_cible_promotion_id']);
                $statut = 'reinscrit';
            } else {
                if (empty($validated['classe_cible_redoublement_id'])) {
                    $erreurs[] = ['eleve_id' => $decision['eleve_id'], 'erreur' => 'Aucune classe de redoublement sélectionnée.'];
                    continue;
                }
                $classeCible = Classe::find($validated['classe_cible_redoublement_id']);
                $statut = 'redouble';
            }

            $dejaInscrit = Inscription::where('eleve_id', $decision['eleve_id'])
                ->where('annee_scolaire_id', $classeCible->annee_scolaire_id)
                ->exists();

            if ($dejaInscrit) {
                $erreurs[] = ['eleve_id' => $decision['eleve_id'], 'erreur' => 'Déjà inscrit pour cette année scolaire.'];
                continue;
            }

            $resultats[] = Inscription::create([
                'eleve_id' => $decision['eleve_id'],
                'classe_id' => $classeCible->id,
                'annee_scolaire_id' => $classeCible->annee_scolaire_id,
                'statut' => $statut,
                'date_inscription' => now(),
            ]);
        }

        return response()->json([
            'data' => $resultats,
            'erreurs' => $erreurs,
            'message' => count($resultats).' élève(s) inscrit(s) pour la nouvelle année'.(count($erreurs) > 0 ? ', '.count($erreurs).' erreur(s).' : '.'),
        ], 201);
    }
}