<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CategorieDepense;
use Illuminate\Http\Request;

class CategorieDepenseController extends Controller
{
    public function index(Request $request)
    {
        $query = CategorieDepense::query();
        if ($request->filled('annee_scolaire_id')) $query->where('annee_scolaire_id', $request->annee_scolaire_id);
        return response()->json(['data' => $query->get()]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'annee_scolaire_id' => 'required|exists:annees_scolaires,id',
            'nom' => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
        ]);

        $categorie = CategorieDepense::create($validated);
        return response()->json(['data' => $categorie, 'message' => 'Catégorie de dépense créée.'], 201);
    }

    public function update(Request $request, CategorieDepense $categorieDepense)
    {
        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:100',
            'description' => 'nullable|string|max:255',
        ]);

        $categorieDepense->update($validated);
        return response()->json(['data' => $categorieDepense, 'message' => 'Catégorie mise à jour.']);
    }

    public function destroy(CategorieDepense $categorieDepense)
    {
        $categorieDepense->delete();
        return response()->json(['message' => 'Catégorie supprimée.']);
    }
}