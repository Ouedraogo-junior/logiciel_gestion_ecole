<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Classe;
use App\Models\Eleve;
use App\Models\Inscription;
use App\Models\Matiere;
use App\Models\Note;
use App\Models\ParametreEcole;
use App\Models\Periode;
use App\Models\Presence;
use App\Services\PdfGenerator;
use Illuminate\Http\Request;

class BulletinController extends Controller
{
    public function generer(Request $request, Eleve $eleve)
    {
        $validated = $request->validate(['periode_id' => 'required|exists:periodes,id']);
        $periode = Periode::findOrFail($validated['periode_id']);

        $inscription = $eleve->inscriptionActuelle()->with('classe', 'anneeScolaire')->first();

        if (!$inscription) {
            return response()->json(['message' => "Cet élève n'a pas d'inscription active."], 422);
        }

        $classementData = Note::classementPourClasse($inscription->classe_id, $periode->id);
        $nomEcole = ParametreEcole::where('cle', 'nom_ecole')->value('valeur') ?? 'École';
        $logoPath = ParametreEcole::where('cle', 'logo_path')->value('valeur');

        $donnees = $this->donneesBulletinPourEleve(
            $eleve, $inscription->classe, $inscription->anneeScolaire, $periode, $classementData, $nomEcole, $logoPath
        );

        if ($donnees === null) {
            return response()->json(['message' => "Aucune note saisie pour cet élève sur cette période."], 422);
        }

        $mpdf = PdfGenerator::depuisVue('bulletins.bulletin', $donnees, ['format' => 'A4']);

        return response($mpdf->Output("bulletin-{$eleve->matricule}.pdf", 'S'), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="bulletin-'.$eleve->matricule.'.pdf"',
        ]);
    }

    public function genererClasse(Request $request, Classe $classe)
    {
        $validated = $request->validate(['periode_id' => 'required|exists:periodes,id']);
        $periode = Periode::findOrFail($validated['periode_id']);

        $inscriptions = Inscription::where('classe_id', $classe->id)
            ->whereHas('anneeScolaire', fn ($q) => $q->where('is_active', true))
            ->with('eleve', 'anneeScolaire')
            ->get();

        if ($inscriptions->isEmpty()) {
            return response()->json(['message' => "Aucun élève inscrit dans cette classe."], 422);
        }

        $classementData = Note::classementPourClasse($classe->id, $periode->id);
        $nomEcole = ParametreEcole::where('cle', 'nom_ecole')->value('valeur') ?? 'École';
        $logoPath = ParametreEcole::where('cle', 'logo_path')->value('valeur');

        $bulletins = [];

        foreach ($inscriptions as $inscription) {
            $donnees = $this->donneesBulletinPourEleve(
                $inscription->eleve, $classe, $inscription->anneeScolaire, $periode, $classementData, $nomEcole, $logoPath
            );

            if ($donnees !== null) {
                $bulletins[] = $donnees;
            }
        }

        if (empty($bulletins)) {
            return response()->json(['message' => "Aucun élève de cette classe n'a de note sur cette période."], 422);
        }

        $mpdf = PdfGenerator::depuisVue('bulletins.classe', ['bulletins' => $bulletins], ['format' => 'A4']);

        return response($mpdf->Output("bulletins-{$classe->nom}.pdf", 'S'), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="bulletins-'.$classe->nom.'.pdf"',
        ]);
    }

    private function donneesBulletinPourEleve(Eleve $eleve, Classe $classe, $anneeScolaire, Periode $periode, array $classementData, string $nomEcole, ?string $logoPath): ?array
    {
        $resultat = Note::moyennesPourEleve($eleve->id, $periode->id);

        if (empty($resultat['par_matiere'])) {
            return null;
        }

        $matieresIds = collect($resultat['par_matiere'])->pluck('matiere_id');
        $matieres = Matiere::whereIn('id', $matieresIds)->pluck('nom', 'id');

        $lignesMatieres = collect($resultat['par_matiere'])->map(function ($m) use ($matieres, $resultat) {
            $coefficient = $resultat['coefficients'][$m['matiere_id']] ?? 1;
            $appreciation = $this->appreciation($m['moyenne'], $resultat['echelle']);
            return [
                'nom' => $matieres[$m['matiere_id']] ?? '—',
                'moyenne' => $m['moyenne'],
                'coefficient' => $coefficient,
                'moyenne_ponderee' => $m['moyenne'] !== null ? round($m['moyenne'] * $coefficient, 2) : null,
                'appreciation_label' => $appreciation['label'],
                'appreciation_couleur' => $appreciation['couleur'],
            ];
        })->sortBy('nom')->values();

        $classement = collect($classementData['classement']);
        $rangIndex = $classement->search(fn ($c) => $c['eleve_id'] === $eleve->id);
        $moyennesClasse = $classement->pluck('moyenne_generale');

        $absences = Presence::where('eleve_id', $eleve->id)
            ->whereBetween('date', [$periode->date_debut, $periode->date_fin])
            ->where('statut', 'absent')->count();
        $retards = Presence::where('eleve_id', $eleve->id)
            ->whereBetween('date', [$periode->date_debut, $periode->date_fin])
            ->where('statut', 'retard')->count();

        $appreciationGenerale = $this->appreciation($resultat['moyenne_generale'], $resultat['echelle']);

        return [
            'eleve' => $eleve,
            'classe' => $classe,
            'anneeScolaire' => $anneeScolaire,
            'periode' => $periode,
            'lignesMatieres' => $lignesMatieres,
            'moyenneGenerale' => $resultat['moyenne_generale'],
            'echelle' => $resultat['echelle'],
            'rang' => $rangIndex !== false ? $rangIndex + 1 : null,
            'rangSur' => $classement->count(),
            'effectif' => $classementData['effectif_total'],
            'moyenneClasse' => $moyennesClasse->count() > 0 ? round($moyennesClasse->avg(), 2) : null,
            'moyenneMax' => $moyennesClasse->max(),
            'moyenneMin' => $moyennesClasse->min(),
            'absences' => $absences,
            'retards' => $retards,
            'nomEcole' => $nomEcole,
            'logoPath' => $logoPath,
            'appreciationGeneraleLabel' => $appreciationGenerale['label'],
            'appreciationGeneraleCouleur' => $appreciationGenerale['couleur'],
        ];
    }

    private function appreciation(?float $valeur, float $echelle): array
    {
        if ($valeur === null) return ['label' => '—', 'couleur' => '#7a6e66'];
        $ratio = $valeur / $echelle;
        if ($ratio >= 0.8) return ['label' => 'Très bien', 'couleur' => '#2F5233'];
        if ($ratio >= 0.7) return ['label' => 'Bien', 'couleur' => '#2F5233'];
        if ($ratio >= 0.5) return ['label' => 'Passable', 'couleur' => '#2E4A63'];
        return ['label' => 'Insuffisant', 'couleur' => '#C1502E'];
    }
}