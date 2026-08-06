<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnneeScolaire;
use App\Models\Depense;
use App\Models\Paiement;
use App\Models\Periode;
use Illuminate\Http\Request;

class RapportFinancierController extends Controller
{
    public function show(Request $request)
    {
        $validated = $request->validate([
            'periode_id' => 'nullable|exists:periodes,id',
            'annee_scolaire_id' => 'nullable|exists:annees_scolaires,id',
        ]);

        if (empty($validated['periode_id']) && empty($validated['annee_scolaire_id'])) {
            return response()->json(['message' => 'Précise une période ou une année scolaire.'], 422);
        }

        if (!empty($validated['periode_id'])) {
            $periode = Periode::findOrFail($validated['periode_id']);
            $dateDebut = $periode->date_debut;
            $dateFin = $periode->date_fin;
            $libelle = $periode->nom;
        } else {
            $annee = AnneeScolaire::findOrFail($validated['annee_scolaire_id']);
            $dateDebut = $annee->date_debut;
            $dateFin = $annee->date_fin;
            $libelle = $annee->libelle.' (année complète)';
        }

        $totalRecettes = Paiement::where('statut', 'valide')
            ->whereBetween('date_paiement', [$dateDebut, $dateFin])
            ->sum('montant');

        $totalDepenses = Depense::where('statut', 'valide')
            ->whereBetween('date_depense', [$dateDebut, $dateFin])
            ->sum('montant');

        return response()->json(['data' => [
            'periode' => $libelle,
            'total_recettes' => (float) $totalRecettes,
            'total_depenses' => (float) $totalDepenses,
            'solde_net' => (float) $totalRecettes - (float) $totalDepenses,
        ]]);
    }
}