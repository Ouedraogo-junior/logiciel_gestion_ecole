<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Echeance;
use App\Models\Paiement;
use Illuminate\Http\Request;

class EcheanceController extends Controller
{
    public function index(Request $request)
    {
        $query = Echeance::query();
        if ($request->filled('type_frais_id')) $query->where('type_frais_id', $request->type_frais_id);

        $echeances = $query->orderBy('ordre')->get();

        if ($request->filled('eleve_id')) {
            $payes = Paiement::whereIn('echeance_id', $echeances->pluck('id'))
                ->where('eleve_id', $request->eleve_id)
                ->where('statut', 'valide')
                ->groupBy('echeance_id')
                ->selectRaw('echeance_id, SUM(montant) as total_paye')
                ->pluck('total_paye', 'echeance_id');

            $echeances = $echeances->map(function ($e) use ($payes) {
                $paye = (float) ($payes[$e->id] ?? 0);
                $e->montant_paye = $paye;
                $e->solde_restant = max(0, (float) $e->montant - $paye);
                return $e;
            });
        }

        return response()->json(['data' => $echeances]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type_frais_id' => 'required|exists:types_frais,id',
            'nom' => 'required|string|max:100',
            'montant' => 'required|numeric|min:0',
            'date_echeance' => 'nullable|date',
            'ordre' => 'sometimes|integer',
        ]);

        $echeance = Echeance::create($validated);
        return response()->json(['data' => $echeance, 'message' => 'Échéance créée.'], 201);
    }

    public function show(Echeance $echeance)
    {
        return response()->json(['data' => $echeance]);
    }

    public function update(Request $request, Echeance $echeance)
    {
        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:100',
            'montant' => 'sometimes|required|numeric|min:0',
            'date_echeance' => 'nullable|date',
            'ordre' => 'sometimes|integer',
        ]);

        if (array_key_exists('montant', $validated) && (float) $validated['montant'] !== (float) $echeance->montant) {
            $existeDesPaiements = Paiement::where('echeance_id', $echeance->id)
                ->where('statut', 'valide')
                ->exists();

            if ($existeDesPaiements) {
                return response()->json([
                    'message' => "Impossible de modifier le montant : des paiements existent déjà sur cette échéance. Crée une nouvelle échéance à la place, pour ne pas fausser l'historique.",
                ], 422);
            }
        }

        $echeance->update($validated);
        return response()->json(['data' => $echeance, 'message' => 'Échéance mise à jour.']);
    }

    public function destroy(Echeance $echeance)
    {
        $existeDesPaiements = Paiement::where('echeance_id', $echeance->id)->exists();

        if ($existeDesPaiements) {
            return response()->json([
                'message' => 'Impossible de supprimer cette échéance : des paiements y sont rattachés. Les supprimer entraînerait la perte de cet historique.',
            ], 422);
        }

        $echeance->delete();
        return response()->json(['message' => 'Échéance supprimée.']);
    }
}