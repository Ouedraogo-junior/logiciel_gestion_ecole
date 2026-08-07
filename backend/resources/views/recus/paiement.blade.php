<!DOCTYPE html>
<html>
<head>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: dejavusans; font-size: 8px; color: #3C3229; }

    .page-wrapper { width: 100%; border-collapse: collapse; }
    .page-wrapper td.interieur { padding: 6px; }

    .sep-double { border-top: 1.5px solid #2E4A63; margin: 4px 0; }
    .sep-single { border-top: 1px solid #e8e2da; margin: 3px 0; }
    .sep-pointille { border-top: 1px dashed #8FA372; margin: 3px 0; }

    .entete-table { width: 100%; margin-bottom: 4px; }
    .logo-cell { width: 14mm; vertical-align: middle; }
    .logo-image { width: 12mm; height: 12mm; }
    .logo-placeholder { width: 12mm; height: 12mm; background: #2E4A63; color: #FBF8F2; text-align: center; line-height: 12mm; font-size: 11px; font-weight: bold; }
    .info-ecole-cell { text-align: right; vertical-align: middle; }
    .nom-ecole { font-size: 11px; font-weight: bold; color: #2E4A63; margin: 0; }
    .annee-scolaire { font-size: 7px; color: #7a6e66; margin: 2px 0 0; }

    .bandeau-titre { background: #2E4A63; color: #FBF8F2; text-align: center; font-size: 9px; font-weight: bold; letter-spacing: 1px; padding: 4px 0; margin: 4px 0; }
    .numero-recu { font-size: 7.5px; text-align: center; color: #3C3229; margin: 3px 0 0; }
    .date-impression { font-size: 6.5px; text-align: center; color: #7a6e66; margin: 1px 0 0; }

    .section-label { font-size: 6.5px; text-transform: uppercase; color: #7a6e66; margin-bottom: 2px; }

    .info-table { width: 100%; border-collapse: collapse; }
    .info-table td { font-size: 8px; padding: 2px 0; vertical-align: top; }
    .info-table td.lbl { width: 40%; color: #7a6e66; }
    .info-table td.val { width: 60%; font-weight: bold; color: #3C3229; }

    .detail-paiement-table { width: 100%; border-collapse: collapse; margin: 2px 0; }
    .detail-paiement-table th { font-size: 6.5px; text-transform: uppercase; border-bottom: 1px solid #2E4A63; padding: 2px 1px; font-weight: bold; color: #2E4A63; }
    .detail-paiement-table th.droite { text-align: right; }
    .detail-paiement-table td { font-size: 8px; padding: 3px 1px; border-bottom: 1px dashed #e8e2da; vertical-align: top; }
    .detail-paiement-table td.droite { text-align: right; font-weight: bold; font-size: 10px; color: #2F5233; }

    .totaux-table { width: 100%; border-collapse: collapse; }
    .totaux-table td { font-size: 8px; padding: 2px 0; }
    .totaux-table td.t-lbl { text-align: left; width: 60%; }
    .totaux-table td.t-val { text-align: right; width: 40%; font-weight: bold; }
    .totaux-table tr.total-echeance td { color: #7a6e66; }
    .totaux-table tr.total-paye td { color: #2F5233; }
    .totaux-table tr.solde-restant td { color: #C1502E; font-weight: bold; font-size: 9px; }
    .totaux-table tr.solde-nul td { color: #2F5233; font-weight: bold; font-size: 9px; }

    .signature-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    .signature-table td { width: 50%; text-align: center; font-size: 6.5px; color: #7a6e66; }
    .signature-espace { height: 14px; }
    .signature-ligne-cell { border-top: 1px solid #3C3229; padding-top: 2px; }

    .footer { text-align: center; margin-top: 4px; }
    .remerciement { font-size: 7px; font-weight: bold; color: #2E4A63; }
    .footer-petit { font-size: 6px; color: #7a6e66; margin-top: 2px; }
</style>
</head>
<body>
<table class="page-wrapper">
<tr><td class="interieur">

    <table class="entete-table">
        <tr>
            <td class="logo-cell">
                @if($logoPath)
                    @php
                        $cheminComplet = storage_path('app/public/'.$logoPath);
                        $logoBase64 = null;
                        if (file_exists($cheminComplet)) {
                            $extension = strtolower(pathinfo($cheminComplet, PATHINFO_EXTENSION));
                            $mimeMap = ['png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg'];
                            $mime = $mimeMap[$extension] ?? 'image/png';
                            $logoBase64 = 'data:'.$mime.';base64,'.base64_encode(file_get_contents($cheminComplet));
                        }
                    @endphp
                    @if($logoBase64)
                        <img src="{{ $logoBase64 }}" class="logo-image">
                    @else
                        <div class="logo-placeholder">{{ mb_strtoupper(mb_substr($nomEcole, 0, 1)) }}</div>
                    @endif
                @else
                    <div class="logo-placeholder">{{ mb_strtoupper(mb_substr($nomEcole, 0, 1)) }}</div>
                @endif
            </td>
            <td class="info-ecole-cell">
                <p class="nom-ecole">{{ $nomEcole }}</p>
                <p class="annee-scolaire">Année scolaire {{ $anneeScolaire }}</p>
            </td>
        </tr>
    </table>

    <div class="bandeau-titre">REÇU DE PAIEMENT</div>
    <p class="numero-recu">N° {{ $paiement->numero_recu ?? '—' }}</p>
    <p class="date-impression">Imprimé le {{ now()->format('d/m/Y à H:i') }}</p>

    <div class="sep-pointille"></div>

    <div class="section-label">Élève</div>
    <table class="info-table">
        <tr>
            <td class="lbl">Nom</td>
            <td class="val">{{ $paiement->eleve->prenom }} {{ $paiement->eleve->nom }}</td>
        </tr>
        <tr>
            <td class="lbl">Matricule</td>
            <td class="val">{{ $paiement->eleve->matricule }}</td>
        </tr>
        <tr>
            <td class="lbl">Classe</td>
            <td class="val">{{ $paiement->eleve->inscriptionActuelle?->classe?->nom ?? '—' }}</td>
        </tr>
    </table>

    <div class="sep-double"></div>

    <table class="detail-paiement-table">
        <thead>
            <tr>
                <th>Type de frais</th>
                <th class="droite">Montant versé</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>
                    {{ $paiement->echeance->typeFrais->nom }}
                    <div style="font-size:6.5px; color:#7a6e66;">{{ $paiement->echeance->nom }}</div>
                </td>
                <td class="droite">{{ number_format($paiement->montant, 0, ',', ' ') }} F</td>
            </tr>
        </tbody>
    </table>

    <div class="sep-single"></div>

    <table class="totaux-table">
        <tr class="total-echeance">
            <td class="t-lbl">Montant de l'échéance</td>
            <td class="t-val">{{ number_format($paiement->echeance->montant, 0, ',', ' ') }} F</td>
        </tr>
        <tr class="total-paye">
            <td class="t-lbl">Total payé (cumulé)</td>
            <td class="t-val">{{ number_format($totalPayeEcheance, 0, ',', ' ') }} F</td>
        </tr>
        <tr class="{{ $soldeRestantEcheance > 0 ? 'solde-restant' : 'solde-nul' }}">
            <td class="t-lbl">{{ $soldeRestantEcheance > 0 ? 'Solde restant' : 'Échéance soldée' }}</td>
            <td class="t-val">{{ $soldeRestantEcheance > 0 ? number_format($soldeRestantEcheance, 0, ',', ' ').' F' : '0 F' }}</td>
        </tr>
    </table>

    <div class="sep-pointille"></div>

    <div class="section-label">Ce paiement</div>
    <table class="info-table">
        <tr>
            <td class="lbl">Date de paiement</td>
            <td class="val">{{ $paiement->date_paiement->format('d/m/Y') }}</td>
        </tr>
        <tr>
            <td class="lbl">Moyen</td>
            <td class="val">{{ ucfirst(str_replace('_', ' ', $paiement->moyen_paiement)) }}</td>
        </tr>
        @if($paiement->reference)
        <tr>
            <td class="lbl">Référence</td>
            <td class="val">{{ $paiement->reference }}</td>
        </tr>
        @endif
        @if($paiement->saisiPar)
        <tr>
            <td class="lbl">Enregistré par</td>
            <td class="val">{{ $paiement->saisiPar->prenom }} {{ $paiement->saisiPar->nom }}</td>
        </tr>
        @endif
    </table>

    <table class="signature-table">
        <tr>
            <td class="signature-espace"></td>
            <td class="signature-espace"></td>
        </tr>
        <tr>
            <td class="signature-ligne-cell">Parent</td>
            <td class="signature-ligne-cell">Direction</td>
        </tr>
    </table>

    <div class="sep-double"></div>
    <div class="footer">
        {{-- <div class="remerciement">Merci pour votre confiance</div> --}}
        {{-- <div class="footer-petit">Reçu généré automatiquement — à conserver comme preuve de paiement</div> --}}
    </div>

</td></tr>
</table>
</body>
</html>