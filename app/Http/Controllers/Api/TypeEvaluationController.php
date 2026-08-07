<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TypeEvaluation;
use Illuminate\Http\Request;

class TypeEvaluationController extends Controller
{
    public function index()
    {
        return response()->json(['data' => TypeEvaluation::orderBy('nom')->get()]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:50',
            'ponderation' => 'sometimes|numeric|min:0.1|max:10',
            'note_maximale' => 'sometimes|numeric|min:1|max:1000',
        ]);

        $type = TypeEvaluation::create($validated);

        return response()->json(['data' => $type, 'message' => "Type d'évaluation créé."], 201);
    }

    public function show(TypeEvaluation $typeEvaluation)
    {
        return response()->json(['data' => $typeEvaluation]);
    }

    public function update(Request $request, TypeEvaluation $typeEvaluation)
    {
        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:50',
            'ponderation' => 'sometimes|numeric|min:0.1|max:10',
            'note_maximale' => 'sometimes|numeric|min:1|max:1000',
        ]);

        $typeEvaluation->update($validated);

        return response()->json(['data' => $typeEvaluation, 'message' => "Type d'évaluation mis à jour."]);
    }

    public function destroy(TypeEvaluation $typeEvaluation)
    {
        $typeEvaluation->delete();
        return response()->json(['message' => "Type d'évaluation supprimé."]);
    }
}