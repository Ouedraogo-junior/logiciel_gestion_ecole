<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Periode;
use Illuminate\Http\Request;

class PeriodeController extends Controller
{
    public function index(Request $request)
    {
        $query = Periode::query();

        if ($request->filled('annee_scolaire_id')) {
            $query->where('annee_scolaire_id', $request->annee_scolaire_id);
        }

        return response()->json(['data' => $query->orderBy('ordre')->get()]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'annee_scolaire_id' => 'required|exists:annees_scolaires,id',
            'nom' => 'required|string|max:50',
            'ordre' => 'sometimes|integer',
            'date_debut' => 'required|date',
            'date_fin' => 'required|date|after:date_debut',
        ]);

        $periode = Periode::create($validated);

        return response()->json(['data' => $periode, 'message' => 'Période créée.'], 201);
    }

    public function show(Periode $periode)
    {
        return response()->json(['data' => $periode]);
    }

    public function update(Request $request, Periode $periode)
    {
        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:50',
            'ordre' => 'sometimes|integer',
            'date_debut' => 'sometimes|required|date',
            'date_fin' => 'sometimes|required|date|after:date_debut',
        ]);

        $periode->update($validated);

        return response()->json(['data' => $periode, 'message' => 'Période mise à jour.']);
    }

    public function destroy(Periode $periode)
    {
        $periode->delete();
        return response()->json(['message' => 'Période supprimée.']);
    }
}