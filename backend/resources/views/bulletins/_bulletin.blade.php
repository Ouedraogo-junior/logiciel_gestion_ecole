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
            <p class="annee-scolaire">Année scolaire {{ $anneeScolaire->libelle }}</p>
        </td>
    </tr>
</table>

<div class="bandeau-titre">BULLETIN DE NOTES</div>
<p class="periode-titre">{{ $periode->nom }}</p>

<table class="info-eleve-table">
    <tr>
        <td class="lbl">Élève</td>
        <td class="val">{{ $eleve->prenom }} {{ $eleve->nom }}</td>
        <td class="lbl">Matricule</td>
        <td class="val">{{ $eleve->matricule }}</td>
    </tr>
    <tr>
        <td class="lbl">Classe</td>
        <td class="val">{{ $classe->nom }}</td>
        <td class="lbl">Effectif</td>
        <td class="val">{{ $effectif }} élève(s)</td>
    </tr>
</table>

<table class="notes-table">
    <thead>
        <tr>
            <th>Matière</th>
            <th class="centre">Moyenne / {{ $echelle }}</th>
            <th class="centre">Coeff.</th>
            <th class="centre">Moy. coeff.</th>
            <th>Appréciation</th>
        </tr>
    </thead>
    <tbody>
        @foreach($lignesMatieres as $ligne)
        <tr>
            <td>{{ $ligne['nom'] }}</td>
            <td class="centre">{{ $ligne['moyenne'] !== null ? number_format($ligne['moyenne'], 2) : '—' }}</td>
            <td class="centre">{{ $ligne['coefficient'] }}</td>
            <td class="centre">{{ $ligne['moyenne_ponderee'] !== null ? number_format($ligne['moyenne_ponderee'], 2) : '—' }}</td>
            <td style="color: {{ $ligne['appreciation_couleur'] }}; font-weight: bold;">{{ $ligne['appreciation_label'] }}</td>
        </tr>
        @endforeach
        <tr class="ligne-totale">
            <td>MOYENNE GÉNÉRALE</td>
            <td class="centre">{{ $moyenneGenerale !== null ? number_format($moyenneGenerale, 2) : '—' }} / {{ $echelle }}</td>
            <td class="centre">—</td>
            <td class="centre">—</td>
            <td style="color: {{ $appreciationGeneraleCouleur }};">{{ $appreciationGeneraleLabel }}</td>
        </tr>
    </tbody>
</table>

<table class="blocs-table">
    <tr>
        <td class="bloc-cell">
            <div class="bloc-titre">Résultats de la classe</div>
            <div class="bloc-contenu">
                <table class="bloc-ligne">
                    <tr><td class="lbl">Rang de l'élève</td><td class="val">{{ $rang ?? '—' }}{{ $rang ? ' / '.$rangSur : '' }}</td></tr>
                    <tr><td class="lbl">Moyenne de la classe</td><td class="val">{{ $moyenneClasse !== null ? number_format($moyenneClasse, 2) : '—' }} / {{ $echelle }}</td></tr>
                    <tr><td class="lbl">Moyenne la plus forte</td><td class="val">{{ $moyenneMax !== null ? number_format($moyenneMax, 2) : '—' }} / {{ $echelle }}</td></tr>
                    <tr><td class="lbl">Moyenne la plus faible</td><td class="val">{{ $moyenneMin !== null ? number_format($moyenneMin, 2) : '—' }} / {{ $echelle }}</td></tr>
                </table>
            </div>
        </td>
        <td class="bloc-cell" style="padding-right:0; padding-left:8px;">
            <div class="bloc-titre">Assiduité sur la période</div>
            <div class="bloc-contenu">
                <table class="bloc-ligne">
                    <tr><td class="lbl">Absences</td><td class="val">{{ $absences }}</td></tr>
                    <tr><td class="lbl">Retards</td><td class="val">{{ $retards }}</td></tr>
                </table>
            </div>
        </td>
    </tr>
</table>

<div class="bloc-titre">Observations du conseil de classe</div>
<div class="observation-box">&nbsp;</div>

<table class="signature-table">
    <tr>
        <td class="signature-espace"></td>
        <td class="signature-espace"></td>
        <td class="signature-espace"></td>
    </tr>
    <tr>
        <td class="signature-ligne-cell">Titulaire</td>
        <td class="signature-ligne-cell">Direction</td>
        <td class="signature-ligne-cell">Parent</td>
    </tr>
</table>

<div class="footer">
    Bulletin généré automatiquement par le logiciel de gestion de {{ $nomEcole }}.
</div>