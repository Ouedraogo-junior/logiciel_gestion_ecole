<!DOCTYPE html>
<html>
<head>
<style>
    body { font-family: dejavusans; font-size: 12px; color: #3C3229; }

    .entete-table { width: 100%; margin-bottom: 10px; }
    .logo-cell { width: 26mm; vertical-align: middle; }
    .logo-image { width: 24mm; height: 24mm; }
    .logo-placeholder { width: 24mm; height: 24mm; background: #2E4A63; color: #FBF8F2; text-align: center; line-height: 24mm; font-size: 19px; font-weight: bold; }
    .info-ecole-cell { text-align: right; vertical-align: middle; }
    .nom-ecole { font-size: 18px; font-weight: bold; color: #2E4A63; margin: 0; }
    .annee-scolaire { font-size: 11px; color: #7a6e66; margin: 3px 0 0; }

    .bandeau-titre { background: #2E4A63; color: #FBF8F2; text-align: center; font-size: 16px; font-weight: bold; letter-spacing: 1px; padding: 9px 0; margin: 8px 0; }
    .periode-titre { text-align: center; font-size: 12px; color: #3C3229; margin-bottom: 10px; }

    .info-eleve-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; background: #FBF8F2; border: 1px solid #e8e2da; }
    .info-eleve-table td { padding: 8px 10px; font-size: 11.5px; }
    .info-eleve-table td.lbl { color: #7a6e66; width: 20%; }
    .info-eleve-table td.val { color: #3C3229; font-weight: bold; width: 30%; }

    .notes-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
    .notes-table th { background: #2E4A63; color: #FBF8F2; font-size: 10px; text-transform: uppercase; padding: 8px 8px; text-align: left; }
    .notes-table th.centre { text-align: center; }
    .notes-table td { font-size: 11.5px; padding: 8px 8px; border-bottom: 1px solid #e8e2da; }
    .notes-table td.centre { text-align: center; }
    .notes-table tr.ligne-totale td { background: #e6efe7; font-weight: bold; font-size: 12.5px; border-top: 2px solid #2E4A63; border-bottom: none; padding: 9px 8px; }

    .blocs-table { width: 100%; margin-bottom: 14px; }
    .bloc-cell { width: 50%; vertical-align: top; padding-right: 8px; }
    .bloc-titre { font-size: 10px; text-transform: uppercase; color: #7a6e66; margin-bottom: 5px; font-weight: bold; }
    .bloc-contenu { background: #FBF8F2; border: 1px solid #e8e2da; padding: 10px; }
    .bloc-ligne { width: 100%; }
    .bloc-ligne td { font-size: 11.5px; padding: 4px 0; }
    .bloc-ligne td.lbl { color: #7a6e66; }
    .bloc-ligne td.val { text-align: right; font-weight: bold; color: #3C3229; }

    .observation-box { border: 1px solid #e8e2da; background: #FBF8F2; height: 30mm; padding: 8px; }

    .signature-table { width: 100%; margin-top: 26px; }
    .signature-table td { width: 33.33%; text-align: center; font-size: 10.5px; color: #7a6e66; }
    .signature-espace { height: 40px; }
    .signature-ligne-cell { border-top: 1px solid #3C3229; padding-top: 4px; }

    .footer { text-align: center; margin-top: 14px; font-size: 8.5px; color: #7a6e66; border-top: 1px solid #8FA372; padding-top: 6px; }
</style>
</head>
<body>
@include('bulletins._bulletin', [
    'eleve' => $eleve, 'classe' => $classe, 'anneeScolaire' => $anneeScolaire, 'periode' => $periode,
    'lignesMatieres' => $lignesMatieres, 'moyenneGenerale' => $moyenneGenerale, 'echelle' => $echelle,
    'rang' => $rang, 'rangSur' => $rangSur, 'effectif' => $effectif, 'moyenneClasse' => $moyenneClasse,
    'moyenneMax' => $moyenneMax, 'moyenneMin' => $moyenneMin, 'absences' => $absences, 'retards' => $retards,
    'nomEcole' => $nomEcole, 'logoPath' => $logoPath,
    'appreciationGeneraleLabel' => $appreciationGeneraleLabel, 'appreciationGeneraleCouleur' => $appreciationGeneraleCouleur,
])
</body>
</html>