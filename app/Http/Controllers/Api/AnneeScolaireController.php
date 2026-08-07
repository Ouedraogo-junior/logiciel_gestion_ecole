<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnneeScolaire;
use Illuminate\Http\Request;

class AnneeScolaireController extends Controller
{
    public function index()
    {
        return response()->json(['data' => AnneeScolaire::orderByDesc('date_debut')->get()]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'libelle' => 'required|string|max:50',
            'date_debut' => 'required|date',
            'date_fin' => 'required|date|after:date_debut',
            'is_active' => 'sometimes|boolean',
        ]);

        if (!empty($validated['is_active'])) {
            AnneeScolaire::where('is_active', true)->update(['is_active' => false]);
        }

        $annee = AnneeScolaire::create($validated);

        return response()->json(['data' => $annee, 'message' => 'Année scolaire créée.'], 201);
    }

    public function show(AnneeScolaire $anneeScolaire)
    {
        return response()->json(['data' => $anneeScolaire->load('periodes')]);
    }

    public function update(Request $request, AnneeScolaire $anneeScolaire)
    {
        $validated = $request->validate([
            'libelle' => 'sometimes|required|string|max:50',
            'date_debut' => 'sometimes|required|date',
            'date_fin' => 'sometimes|required|date|after:date_debut',
            'is_active' => 'sometimes|boolean',
        ]);

        if (!empty($validated['is_active'])) {
            AnneeScolaire::where('id', '!=', $anneeScolaire->id)->update(['is_active' => false]);
        }

        $anneeScolaire->update($validated);

        return response()->json(['data' => $anneeScolaire, 'message' => 'Année scolaire mise à jour.']);
    }

    public function destroy(AnneeScolaire $anneeScolaire)
    {
        $anneeScolaire->delete();
        return response()->json(['message' => 'Année scolaire supprimée.']);
    }
}