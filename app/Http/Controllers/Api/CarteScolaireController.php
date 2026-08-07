<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Classe;
use App\Models\Eleve;
use App\Models\Inscription;
use App\Models\ParametreEcole;
use App\Services\PdfGenerator;
use Illuminate\Http\Request;

class CarteScolaireController extends Controller
{
    public function generer(Eleve $eleve)
    {
        $inscription = $eleve->inscriptionActuelle()->with('classe', 'anneeScolaire')->first();

        if (!$inscription) {
            return response()->json(['message' => "Cet élève n'a pas d'inscription active."], 422);
        }
        if (!$eleve->photo_path) {
            return response()->json(['message' => "La photo de l'élève est requise pour générer la carte."], 422);
        }

        $nomEcole = ParametreEcole::where('cle', 'nom_ecole')->value('valeur') ?? 'École';

        $mpdf = PdfGenerator::depuisVue('cartes.eleve', [
            'eleve' => $eleve,
            'classe' => $inscription->classe,
            'anneeScolaire' => $inscription->anneeScolaire,
            'nomEcole' => $nomEcole,
        ], ['format' => 'A4']);

        $eleve->update(['carte_generee_le' => now()]);

        return response($mpdf->Output("carte-{$eleve->matricule}.pdf", 'S'), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="carte-'.$eleve->matricule.'.pdf"',
        ]);
    }

    public function genererClasse(Classe $classe)
    {
        $inscriptions = Inscription::where('classe_id', $classe->id)
            ->whereHas('anneeScolaire', fn ($q) => $q->where('is_active', true))
            ->with(['eleve', 'classe', 'anneeScolaire'])
            ->get();

        $sansPhoto = $inscriptions->filter(fn ($i) => !$i->eleve->photo_path);
        if ($sansPhoto->isNotEmpty()) {
            return response()->json([
                'message' => 'Certains élèves n\'ont pas de photo, génération bloquée.',
                'eleves_sans_photo' => $sansPhoto->map(fn ($i) => [
                    'matricule' => $i->eleve->matricule,
                    'nom' => $i->eleve->nom,
                    'prenom' => $i->eleve->prenom,
                ])->values(),
            ], 422);
        }

        $nomEcole = ParametreEcole::where('cle', 'nom_ecole')->value('valeur') ?? 'École';

        $cartes = $inscriptions->map(fn ($i) => [
            'eleve' => $i->eleve,
            'classe' => $i->classe,
            'anneeScolaire' => $i->anneeScolaire,
        ]);

        $mpdf = PdfGenerator::depuisVue('cartes.classe', ['cartes' => $cartes, 'nomEcole' => $nomEcole], ['format' => 'A4']);

        Eleve::whereIn('id', $inscriptions->pluck('eleve_id'))->update(['carte_generee_le' => now()]);

        return response($mpdf->Output("cartes-{$classe->nom}.pdf", 'S'), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="cartes-'.$classe->nom.'.pdf"',
        ]);
    }
}