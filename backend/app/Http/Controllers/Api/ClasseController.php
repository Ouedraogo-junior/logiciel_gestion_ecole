<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Classe;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ClasseController extends Controller
{
    public function index(Request $request)
    {
        $query = Classe::with('enseignantTitulaire:id,nom,prenom');

        if ($request->filled('annee_scolaire_id')) {
            $query->where('annee_scolaire_id', $request->annee_scolaire_id);
        }

        return response()->json(['data' => $query->orderBy('niveau')->get()]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:50',
            'niveau' => 'required|string|max:20',
            'annee_scolaire_id' => 'required|exists:annees_scolaires,id',
            'enseignant_titulaire_id' => ['nullable', Rule::exists('users', 'id')->where(fn ($q) => $q->where('role', 'enseignant'))],
            'effectif_max' => 'nullable|integer|min:1',
        ]);

        if (!empty($validated['enseignant_titulaire_id'])) {
            $dejaTitulaire = Classe::where('annee_scolaire_id', $validated['annee_scolaire_id'])
                ->where('enseignant_titulaire_id', $validated['enseignant_titulaire_id'])
                ->first();

            if ($dejaTitulaire) {
                return response()->json([
                    'message' => "Cet enseignant est déjà titulaire de {$dejaTitulaire->nom} pour cette année scolaire.",
                ], 422);
            }
        }

        $classe = Classe::create($validated);

        return response()->json(['data' => $classe, 'message' => 'Classe créée.'], 201);
    }

    public function show(Classe $classe)
    {
        return response()->json(['data' => $classe->load('enseignantTitulaire:id,nom,prenom')]);
    }

    public function update(Request $request, Classe $classe)
    {
        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:50',
            'niveau' => 'sometimes|required|string|max:20',
            'enseignant_titulaire_id' => ['nullable', Rule::exists('users', 'id')->where(fn ($q) => $q->where('role', 'enseignant'))],
            'effectif_max' => 'nullable|integer|min:1',
        ]);

        if (array_key_exists('enseignant_titulaire_id', $validated) && $validated['enseignant_titulaire_id']) {
            $dejaTitulaire = Classe::where('annee_scolaire_id', $classe->annee_scolaire_id)
                ->where('enseignant_titulaire_id', $validated['enseignant_titulaire_id'])
                ->where('id', '!=', $classe->id)
                ->first();

            if ($dejaTitulaire) {
                return response()->json([
                    'message' => "Cet enseignant est déjà titulaire de {$dejaTitulaire->nom} pour cette année scolaire.",
                ], 422);
            }
        }

        $classe->update($validated);

        return response()->json(['data' => $classe, 'message' => 'Classe mise à jour.']);
    }

    public function dupliquer(Request $request)
    {
        $validated = $request->validate([
            'annee_source_id' => 'required|exists:annees_scolaires,id',
            'annee_cible_id' => 'required|exists:annees_scolaires,id|different:annee_source_id',
        ]);

        $classesSource = Classe::where('annee_scolaire_id', $validated['annee_source_id'])->get();
        $nomsExistants = Classe::where('annee_scolaire_id', $validated['annee_cible_id'])->pluck('nom')->all();

        $creees = [];
        $ignorees = [];

        foreach ($classesSource as $classeSource) {
            if (in_array($classeSource->nom, $nomsExistants)) {
                $ignorees[] = $classeSource->nom;
                continue;
            }

            $creees[] = Classe::create([
                'nom' => $classeSource->nom,
                'niveau' => $classeSource->niveau,
                'annee_scolaire_id' => $validated['annee_cible_id'],
                'effectif_max' => $classeSource->effectif_max,
                'enseignant_titulaire_id' => null,
            ]);
        }

        return response()->json([
            'data' => $creees,
            'ignorees' => $ignorees,
            'message' => count($creees).' classe(s) créée(s)'.(count($ignorees) > 0 ? ', '.count($ignorees).' déjà existante(s) ignorée(s).' : '.'),
        ], 201);
    }

    public function destroy(Classe $classe)
    {
        $classe->delete();
        return response()->json(['message' => 'Classe supprimée.']);
    }
}