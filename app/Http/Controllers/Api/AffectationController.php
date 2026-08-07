<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Affectation;
use Illuminate\Http\Request;

class AffectationController extends Controller
{
    public function index(Request $request)
    {
        $query = Affectation::with(['classe', 'matiere', 'enseignant:id,nom,prenom']);

        if ($request->filled('classe_id')) {
            $query->where('classe_id', $request->classe_id);
        }
        if ($request->filled('enseignant_id')) {
            $query->where('enseignant_id', $request->enseignant_id);
        }

        return response()->json(['data' => $query->get()]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'classe_id' => 'required|exists:classes,id',
            'matiere_id' => 'required|exists:matieres,id',
            'enseignant_id' => 'required|exists:users,id',
            'coefficient' => 'sometimes|numeric|min:0.5|max:10',
        ]);

        $existante = Affectation::with('enseignant:id,nom,prenom')
            ->where('classe_id', $validated['classe_id'])
            ->where('matiere_id', $validated['matiere_id'])
            ->first();

        if ($existante) {
            return response()->json([
                'message' => "Cette classe et matière sont déjà affectées à {$existante->enseignant->prenom} {$existante->enseignant->nom}. Retire d'abord cette affectation avant d'en créer une nouvelle.",
            ], 422);
        }

        $affectation = Affectation::create($validated);

        return response()->json([
            'data' => $affectation->load(['classe', 'matiere', 'enseignant:id,nom,prenom']),
            'message' => 'Affectation créée.',
        ], 201);
    }

    public function destroy(Affectation $affectation)
    {
        $affectation->delete();
        return response()->json(['message' => 'Affectation supprimée.']);
    }
}