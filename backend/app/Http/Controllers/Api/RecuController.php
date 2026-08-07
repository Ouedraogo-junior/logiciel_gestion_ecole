<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ParametreEcole;
use App\Models\Paiement;
use App\Services\PdfGenerator;

class RecuController extends Controller
{
    public function generer(Paiement $paiement)
    {
        $paiement->load(['eleve.inscriptionActuelle.classe', 'echeance.typeFrais.anneeScolaire', 'saisiPar']);

        $nomEcole = ParametreEcole::where('cle', 'nom_ecole')->value('valeur') ?? 'École';
        $logoPath = ParametreEcole::where('cle', 'logo_path')->value('valeur');
        $anneeScolaire = $paiement->echeance->typeFrais->anneeScolaire->libelle ?? '—';

        $totalPayeEcheance = Paiement::where('eleve_id', $paiement->eleve_id)
            ->where('echeance_id', $paiement->echeance_id)
            ->where('statut', 'valide')
            ->sum('montant');

        $soldeRestantEcheance = max(0, (float) $paiement->echeance->montant - (float) $totalPayeEcheance);

        $donnees = [
            'paiement' => $paiement,
            'nomEcole' => $nomEcole,
            'logoPath' => $logoPath,
            'anneeScolaire' => $anneeScolaire,
            'totalPayeEcheance' => (float) $totalPayeEcheance,
            'soldeRestantEcheance' => $soldeRestantEcheance,
        ];

        $largeur = 80; // mm — format standard imprimante thermique
        $margesCommunes = [
            'margin_left' => 4, 'margin_right' => 4, 'margin_top' => 4, 'margin_bottom' => 4,
            'margin_header' => 0, 'margin_footer' => 0,
        ];

        // 1er rendu sur une page volontairement très haute, uniquement pour mesurer
        // la position réelle où le contenu s'arrête (technique standard mPDF pour
        // les documents à hauteur variable, faute de support natif de "auto").
        $mpdfMesure = PdfGenerator::depuisVue('recus.paiement', $donnees, array_merge($margesCommunes, [
            'format' => [$largeur, 1000],
        ]));
        $hauteurReelle = $mpdfMesure->y + 6; // + petite marge de sécurité en bas

        // 2e rendu, cette fois à la hauteur exacte du contenu — plus d'espace vide
        $mpdf = PdfGenerator::depuisVue('recus.paiement', $donnees, array_merge($margesCommunes, [
            'format' => [$largeur, $hauteurReelle],
        ]));

        return response($mpdf->Output("recu-{$paiement->numero_recu}.pdf", 'S'), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="recu-'.$paiement->numero_recu.'.pdf"',
        ]);
    }
}