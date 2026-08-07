<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Depense;
use Illuminate\Http\Request;

class DepenseController extends Controller
{
    public function index(Request $request)
    {
        $query = Depense::with('categorie');
        if ($request->filled('categorie_depense_id')) $query->where('categorie_depense_id', $request->categorie_depense_id);
        if ($request->filled('statut')) $query->where('statut', $request->statut);
        return response()->json(['data' => $query->orderByDesc('date_depense')->get()]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'categorie_depense_id' => 'required|exists:categories_depenses,id',
            'montant' => 'required|numeric|min:0.01',
            'date_depense' => 'required|date',
            'description' => 'required|string|max:255',
            'justificatif_path' => 'nullable|string',
        ]);

        $depense = Depense::create($validated + [
            'saisi_par' => $request->user()->id,
            'statut' => 'valide',
        ]);

        return response()->json(['data' => $depense->load('categorie'), 'message' => 'Dépense enregistrée.'], 201);
    }

    public function annuler(Depense $depense)
    {
        $depense->update(['statut' => 'annule']);
        return response()->json(['data' => $depense, 'message' => 'Dépense annulée.']);
    }
}