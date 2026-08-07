<style>
    .carte-table { width: 85mm; border-collapse: collapse; border: 2px solid #2E4A63; }
    .entete-cell { background: #2E4A63; color: #FBF8F2; padding: 4px 6px; font-size: 10px; font-weight: bold; }
    .corps-cell { background: #FBF8F2; padding: 6px; }
    .corps-table { width: 100%; border-collapse: collapse; }
    .corps-table td { vertical-align: top; padding: 0; border: none; }
    .col-photo { width: 27mm; }
    .infos { font-size: 9px; color: #3C3229; padding-left: 8px; }
    .infos strong { color: #2E4A63; }
    .footer-cell { background: #FBF8F2; font-size: 7px; color: #3C3229; border-top: 1px solid #8FA372; padding: 2px 6px; }
</style>

<table class="carte-table">
    <tr>
        <td class="entete-cell">{{ $nomEcole }}</td>
    </tr>
    <tr>
        <td class="corps-cell">
            <table class="corps-table">
                <tr>
                    <td class="col-photo">
                        <img src="{{ public_path('storage/'.$eleve->photo_path) }}"
                             width="25mm" height="30mm" style="border:1px solid #3C3229;">
                    </td>
                    <td class="infos">
                        <strong>{{ $eleve->nom }} {{ $eleve->prenom }}</strong><br>
                        Matricule : {{ $eleve->matricule }}<br>
                        Classe : {{ $classe->nom }}<br>
                        Né(e) le : {{ $eleve->date_naissance->format('d/m/Y') }}<br>
                        Année : {{ $anneeScolaire->libelle }}
                    </td>
                </tr>
            </table>
        </td>
    </tr>
    <tr>
        <td class="footer-cell">Carte scolaire officielle — {{ $anneeScolaire->libelle }}</td>
    </tr>
</table>