<!DOCTYPE html>
<html>
<head>
<style>
    body { font-family: dejavusans; font-size: 10px; color: #3C3229; }
    .entete-table { width: 100%; margin-bottom: 10px; }
    .logo-cell { width: 22mm; vertical-align: middle; }
    .logo-image { width: 20mm; height: 20mm; }
    .logo-placeholder { width: 20mm; height: 20mm; background: #2E4A63; color: #FBF8F2; text-align: center; line-height: 20mm; font-size: 16px; font-weight: bold; }
    .info-ecole-cell { text-align: right; vertical-align: middle; }
    .nom-ecole { font-size: 15px; font-weight: bold; color: #2E4A63; margin: 0; }
    .sous-titre { font-size: 10px; color: #7a6e66; margin: 3px 0 0; }
    .bandeau-titre { background: #2E4A63; color: #FBF8F2; text-align: center; font-size: 13px; font-weight: bold; letter-spacing: 1px; padding: 8px 0; margin: 10px 0; }
    .liste-table { width: 100%; border-collapse: collapse; }
    .liste-table th { background: #2E4A63; color: #FBF8F2; font-size: 9px; text-transform: uppercase; padding: 6px 8px; text-align: left; }
    .liste-table th.centre { text-align: center; }
    .liste-table td { font-size: 10px; padding: 6px 8px; border-bottom: 1px solid #e8e2da; }
    .liste-table td.centre { text-align: center; }
    .liste-table tr:nth-child(even) td { background: #fdfcfa; }
    .footer { text-align: center; margin-top: 12px; font-size: 8px; color: #7a6e66; border-top: 1px solid #8FA372; padding-top: 6px; }
</style>
</head>
<body>

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
            <p class="sous-titre">Année scolaire {{ $anneeScolaire->libelle ?? '—' }}</p>
        </td>
    </tr>
</table>

<div class="bandeau-titre">LISTE DE CLASSE — {{ strtoupper($classe->nom) }}</div>

<table class="liste-table">
    <thead>
        <tr>
            <th class="centre" style="width:8%;">N°</th>
            <th>Nom et prénoms</th>
            <th style="width:20%;">Matricule</th>
            <th class="centre" style="width:10%;">Sexe</th>
            <th style="width:20%;">Date de naissance</th>
        </tr>
    </thead>
    <tbody>
        @foreach($inscriptions as $index => $inscription)
        <tr>
            <td class="centre">{{ $index + 1 }}</td>
            <td>{{ $inscription->eleve->nom }} {{ $inscription->eleve->prenom }}</td>
            <td>{{ $inscription->eleve->matricule }}</td>
            <td class="centre">{{ $inscription->eleve->sexe }}</td>
            <td>{{ \Carbon\Carbon::parse($inscription->eleve->date_naissance)->format('d/m/Y') }}</td>
        </tr>
        @endforeach
    </tbody>
</table>

<p style="margin-top:10px; font-size:9px; color:#7a6e66;">Effectif total : {{ $inscriptions->count() }} élève(s)</p>

<div class="footer">
    Liste générée automatiquement par le logiciel de gestion de {{ $nomEcole }}.
</div>

</body>
</html>