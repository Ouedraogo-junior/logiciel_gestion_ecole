<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Classe;
use App\Models\Eleve;
use App\Models\Inscription;
use App\Models\Presence;
use Illuminate\Http\Request;

class PresenceController extends Controller
{
    public function index(Request $request)
    {
        $query = Presence::with('eleve:id,nom,prenom');

        if ($request->filled('classe_id')) $query->where('classe_id', $request->classe_id);
        if ($request->filled('date')) $query->whereDate('date', $request->date);
        if ($request->filled('eleve_id')) $query->where('eleve_id', $request->eleve_id);

        return response()->json(['data' => $query->orderByDesc('date')->get()]);
    }

    public function appel(Request $request)
    {
        $validated = $request->validate([
            'classe_id' => 'required|exists:classes,id',
            'date' => 'required|date',
            'absents' => 'sometimes|array',
            'absents.*.eleve_id' => 'required_with:absents|exists:eleves,id',
            'absents.*.statut' => 'required_with:absents|in:absent,retard',
            'absents.*.motif' => 'nullable|string|max:255',
        ]);

        $user = $request->user();
        $classe = Classe::findOrFail($validated['classe_id']);

        if ($user->role === 'enseignant' && $classe->enseignant_titulaire_id !== $user->id) {
            return response()->json(['message' => "Vous n'êtes pas l'enseignant titulaire de cette classe."], 403);
        }

        $modeSaisie = $user->role === 'enseignant' ? 'temps_reel' : 'differe';

        $elevesInscrits = Inscription::where('classe_id', $classe->id)
            ->whereHas('anneeScolaire', fn ($q) => $q->where('is_active', true))
            ->pluck('eleve_id');

        $absentsParEleve = collect($validated['absents'] ?? [])->keyBy('eleve_id');
        $resultats = [];

        foreach ($elevesInscrits as $eleveId) {
            $entree = $absentsParEleve->get($eleveId);

            $resultats[] = Presence::updateOrCreate(
                ['eleve_id' => $eleveId, 'date' => $validated['date']],
                [
                    'classe_id' => $classe->id,
                    'statut' => $entree['statut'] ?? 'present',
                    'motif' => $entree['motif'] ?? null,
                    'saisi_par' => $user->id,
                    'mode_saisie' => $modeSaisie,
                    'saisi_le' => now(),
                ]
            );
        }

        return response()->json([
            'data' => $resultats,
            'message' => count($resultats)." présence(s) enregistrée(s) ({$modeSaisie}).",
        ]);
    }

    public function assiduite(Request $request, Eleve $eleve)
    {
        $validated = $request->validate([
            'date_debut' => 'required|date',
            'date_fin' => 'required|date|after_or_equal:date_debut',
        ]);

        $presences = Presence::where('eleve_id', $eleve->id)
            ->whereBetween('date', [$validated['date_debut'], $validated['date_fin']])
            ->get();

        $nbJours = $presences->count();
        $nbPresences = $presences->where('statut', 'present')->count();
        $nbAbsences = $presences->where('statut', 'absent')->count();
        $nbRetards = $presences->where('statut', 'retard')->count();

        return response()->json(['data' => [
            'nb_jours_enregistres' => $nbJours,
            'nb_presences' => $nbPresences,
            'nb_absences' => $nbAbsences,
            'nb_retards' => $nbRetards,
            'taux_presence' => $nbJours > 0 ? round(($nbJours - $nbAbsences) / $nbJours * 100, 1) : null,
        ]]);
    }
}