<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TypeFrais;
use Illuminate\Http\Request;

class TypeFraisController extends Controller
{
    public function index(Request $request)
    {
        $query = TypeFrais::with('echeances');
        if ($request->filled('annee_scolaire_id')) $query->where('annee_scolaire_id', $request->annee_scolaire_id);
        if ($request->filled('niveau')) {
            $query->where(function ($q) use ($request) {
                $q->whereNull('niveau')->orWhere('niveau', $request->niveau);
            });
        }
        return response()->json(['data' => $query->get()]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'annee_scolaire_id' => 'required|exists:annees_scolaires,id',
            'nom' => 'required|string|max:100',
            'niveau' => 'nullable|string|max:20',
            'description' => 'nullable|string|max:255',
        ]);

        $typeFrais = TypeFrais::create($validated);
        return response()->json(['data' => $typeFrais, 'message' => 'Type de frais créé.'], 201);
    }

    public function show(TypeFrais $typeFrais)
    {
        return response()->json(['data' => $typeFrais->load('echeances')]);
    }

    public function update(Request $request, TypeFrais $typeFrais)
    {
        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:100',
            'niveau' => 'nullable|string|max:20',
            'description' => 'nullable|string|max:255',
        ]);

        $typeFrais->update($validated);
        return response()->json(['data' => $typeFrais, 'message' => 'Type de frais mis à jour.']);
    }

    public function destroy(TypeFrais $typeFrais)
    {
        $typeFrais->delete();
        return response()->json(['message' => 'Type de frais supprimé.']);
    }
}