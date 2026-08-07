<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Matiere;
use Illuminate\Http\Request;

class MatiereController extends Controller
{
    public function index(Request $request)
    {
        $query = Matiere::query();

        if ($request->filled('niveau')) {
            $query->where('niveau', $request->niveau);
        }

        return response()->json(['data' => $query->orderBy('nom')->get()]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:100',
            'niveau' => 'nullable|string|max:20',
        ]);

        $matiere = Matiere::create($validated);

        return response()->json(['data' => $matiere, 'message' => 'Matière créée.'], 201);
    }

    public function show(Matiere $matiere)
    {
        return response()->json(['data' => $matiere]);
    }

    public function update(Request $request, Matiere $matiere)
    {
        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:100',
            'niveau' => 'nullable|string|max:20',
        ]);

        $matiere->update($validated);

        return response()->json(['data' => $matiere, 'message' => 'Matière mise à jour.']);
    }

    public function destroy(Matiere $matiere)
    {
        $matiere->delete();
        return response()->json(['message' => 'Matière supprimée.']);
    }
}