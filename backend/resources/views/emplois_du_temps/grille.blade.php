<!DOCTYPE html>
<html>
<head>
<style>
    body { font-family: dejavusans; font-size: 9px; color: #3C3229; }

    .entete-table { width: 100%; margin-bottom: 12px; }
    .logo-cell { width: 20mm; vertical-align: middle; }
    .logo-image { width: 18mm; height: 18mm; }
    .logo-placeholder { width: 18mm; height: 18mm; background: #2E4A63; color: #FBF8F2; text-align: center; line-height: 18mm; font-size: 14px; font-weight: bold; }
    .info-ecole-cell { text-align: right; vertical-align: middle; }
    .nom-ecole { font-size: 14px; font-weight: bold; color: #2E4A63; margin: 0; }
    .sous-titre { font-size: 10px; color: #7a6e66; margin: 3px 0 0; }
    .info-complementaire { font-size: 9px; color: #3C3229; margin: 2px 0 0; }

    .bandeau-titre { background: #2E4A63; color: #FBF8F2; text-align: center; font-size: 14px; font-weight: bold; letter-spacing: 1px; padding: 8px 0; margin: 10px 0; }

    .grille-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .grille-table td.jour-cell { width: 16.6%; vertical-align: top; padding: 0 4px; }
    .jour-entete { background: #2E4A63; color: #FBF8F2; text-align: center; font-size: 10px; font-weight: bold; padding: 7px 0; margin-bottom: 6px; }
    .jour-corps { border: 1px solid #e8e2da; min-height: 95mm; padding: 6px; }

    .creneau-bloc { background: #FBF8F2; border-left: 3px solid #C1502E; padding: 6px 8px; margin-bottom: 8px; }
    .creneau-heure { font-size: 8.5px; font-weight: bold; color: #2E4A63; margin: 0; }
    .creneau-matiere { font-size: 9.5px; color: #3C3229; margin: 3px 0 0; }

    .vide { font-size: 8px; color: #b5aca5; text-align: center; padding: 10px 0; }

    .footer { text-align: center; margin-top: 12px; font-size: 7px; color: #7a6e66; border-top: 1px solid #8FA372; padding-top: 6px; }
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
            <p class="sous-titre">Emploi du temps — {{ $classe->nom }}</p>
            <p class="info-complementaire">Enseignant : {{ $titulaire ? $titulaire->prenom.' '.$titulaire->nom : 'Non désigné' }}</p>
            <p class="info-complementaire">Année scolaire : {{ $anneeScolaire->libelle ?? '—' }}</p>
        </td>
    </tr>
</table>

<div class="bandeau-titre">EMPLOI DU TEMPS — {{ strtoupper($classe->nom) }}</div>

<table class="grille-table">
    <tr>
        @foreach($joursLabels as $jour => $label)
        <td class="jour-cell">
            <div class="jour-entete">{{ $label }}</div>
            <div class="jour-corps">
                @forelse($grille[$jour] as $creneau)
                    <div class="creneau-bloc">
                        <p class="creneau-heure">{{ substr($creneau->heure_debut, 0, 5) }} – {{ substr($creneau->heure_fin, 0, 5) }}</p>
                        <p class="creneau-matiere">{{ $creneau->matiere->nom }}</p>
                    </div>
                @empty
                    <p class="vide">—</p>
                @endforelse
            </div>
        </td>
        @endforeach
    </tr>
</table>

<div class="footer">
    Emploi du temps généré automatiquement par le logiciel de gestion de {{ $nomEcole }}.
</div>

</body>
</html>