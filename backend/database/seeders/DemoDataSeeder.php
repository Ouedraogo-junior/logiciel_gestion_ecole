<?php

namespace Database\Seeders;

use App\Models\AnneeScolaire;
use App\Models\Periode;
use App\Models\Classe;
use App\Models\Matiere;
use App\Models\Eleve;
use App\Models\Affectation;
use App\Models\TypeEvaluation;
use App\Models\Note;
use App\Models\Presence;
use App\Models\TypeFrais;
use App\Models\Echeance;
use App\Models\Paiement;
use App\Models\CategorieDepense;
use App\Models\Depense;
use App\Models\ExamenNational;
use App\Models\ParametreEcole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        ParametreEcole::create(['cle' => 'nom_ecole', 'valeur' => 'École Primaire Démo']);
        ParametreEcole::create(['cle' => 'echelle_notation', 'valeur' => '20']);
        ParametreEcole::create(['cle' => 'moyenne_passage', 'valeur' => '10']);

        $anneeActive = AnneeScolaire::create([
            'libelle' => now()->year . '-' . (now()->year + 1),
            'date_debut' => now()->subMonth()->format('Y-m-d'),
            'date_fin' => now()->addMonths(9)->format('Y-m-d'),
            'is_active' => true,
        ]);

        $dateMilieu = Carbon::parse($anneeActive->date_debut)->addDays(15);

        $periode1 = Periode::create([
            'annee_scolaire_id' => $anneeActive->id, 'nom' => 'Trimestre 1',
            'ordre' => 1, 'date_debut' => $anneeActive->date_debut, 'date_fin' => $dateMilieu->format('Y-m-d'),
        ]);

        $direction = User::create([
            'nom' => 'Démo', 'prenom' => 'Direction', 'pseudo' => 'demo.direction',
            'password' => Hash::make('demo1234'), 'role' => 'direction', 'actif' => true,
        ]);

        $titulaireCE1 = User::create([
            'nom' => 'Démo', 'prenom' => 'Enseignant', 'pseudo' => 'demo.enseignant',
            'password' => Hash::make('demo1234'), 'role' => 'enseignant', 'actif' => true,
        ]);

        $specialiste = User::create([
            'nom' => 'Compaoré', 'prenom' => 'Issa', 'pseudo' => 'demo.specialiste',
            'password' => Hash::make('demo1234'), 'role' => 'enseignant', 'actif' => true,
        ]);

        $matMaths = Matiere::create(['nom' => 'Mathématiques', 'niveau' => null]);
        $matFrancais = Matiere::create(['nom' => 'Français', 'niveau' => null]);
        $matSport = Matiere::create(['nom' => 'Éducation Physique', 'niveau' => null]);

        $classeCE1 = Classe::create([
            'annee_scolaire_id' => $anneeActive->id, 'nom' => 'CE1 A', 'niveau' => 'CE1',
            'effectif_max' => 40, 'enseignant_titulaire_id' => $titulaireCE1->id,
        ]);
        $classeCM2 = Classe::create([
            'annee_scolaire_id' => $anneeActive->id, 'nom' => 'CM2 A', 'niveau' => 'CM2',
            'effectif_max' => 40, 'enseignant_titulaire_id' => null,
        ]);

        Affectation::create(['classe_id' => $classeCE1->id, 'matiere_id' => $matSport->id, 'enseignant_id' => $specialiste->id, 'coefficient' => 1]);

        $typeFraisScolarite = TypeFrais::create(['annee_scolaire_id' => $anneeActive->id, 'nom' => 'Frais de scolarité', 'niveau' => null]);
        $echeance1 = Echeance::create(['type_frais_id' => $typeFraisScolarite->id, 'nom' => 'Tranche 1', 'montant' => 15000, 'ordre' => 1]);
        Echeance::create(['type_frais_id' => $typeFraisScolarite->id, 'nom' => 'Tranche 2', 'montant' => 15000, 'ordre' => 2]);

        $typeEvaluation = TypeEvaluation::create(['nom' => 'Devoir 1', 'note_maximale' => 20, 'ponderation' => 1]);

        $prenoms = ['Awa', 'Boureima', 'Fatoumata', 'Idrissa', 'Mariam', 'Rasmané', 'Aminata', 'Seydou'];
        $noms = ['Traoré', 'Ouédraogo', 'Kaboré', 'Zongo', 'Compaoré', 'Nikiéma', 'Sawadogo', 'Sana'];

        foreach (range(0, 7) as $i) {
            $classe = $i < 5 ? $classeCE1 : $classeCM2;

            $eleve = Eleve::create([
                'nom' => $noms[$i], 'prenom' => $prenoms[$i],
                'date_naissance' => now()->subYears(9 + ($i % 3))->format('Y-m-d'),
                'sexe' => $i % 2 === 0 ? 'M' : 'F',
            ]);

            $eleve->inscriptions()->create([
                'classe_id' => $classe->id, 'annee_scolaire_id' => $anneeActive->id,
                'statut' => 'inscrit', 'date_inscription' => $anneeActive->date_debut,
            ]);

            if ($classe->id === $classeCE1->id) {
                Note::create([
                    'eleve_id' => $eleve->id, 'classe_id' => $classe->id, 'matiere_id' => $matMaths->id,
                    'periode_id' => $periode1->id, 'type_evaluation_id' => $typeEvaluation->id,
                    'valeur' => rand(8, 20), 'saisi_par' => $titulaireCE1->id, 'saisi_le' => $dateMilieu, 'verrouille' => false,
                ]);
                Note::create([
                    'eleve_id' => $eleve->id, 'classe_id' => $classe->id, 'matiere_id' => $matFrancais->id,
                    'periode_id' => $periode1->id, 'type_evaluation_id' => $typeEvaluation->id,
                    'valeur' => rand(8, 20), 'saisi_par' => $titulaireCE1->id, 'saisi_le' => $dateMilieu, 'verrouille' => false,
                ]);
            }

            // Un élève sur trois paie tout, un sur trois paie partiellement, le dernier ne paie rien — dashboard réaliste
            if ($i % 3 !== 2) {
                Paiement::create([
                    'eleve_id' => $eleve->id, 'echeance_id' => $echeance1->id,
                    'montant' => $i % 3 === 0 ? 15000 : 7000,
                    'date_paiement' => $dateMilieu->format('Y-m-d'), 'moyen_paiement' => 'especes',
                    'numero_recu' => Paiement::genererNumeroRecu($dateMilieu->format('Y-m-d')),
                    'saisi_par' => $direction->id, 'statut' => 'valide',
                ]);
            }

            if ($i === 1) {
                Presence::create(['eleve_id' => $eleve->id, 'classe_id' => $classe->id, 'date' => $dateMilieu->format('Y-m-d'), 'statut' => 'absent', 'motif' => 'Maladie']);
            }

            if ($classe->id === $classeCM2->id && $i === 5) {
                ExamenNational::create([
                    'eleve_id' => $eleve->id, 'annee_scolaire_id' => $anneeActive->id, 'type_examen' => 'CEP',
                    'statut_inscription' => 'inscrit', 'resultat' => 'en_attente', 'saisi_par' => $direction->id,
                ]);
            }
        }

        $categorieDepense = CategorieDepense::create(['annee_scolaire_id' => $anneeActive->id, 'nom' => 'Fournitures']);
        Depense::create([
            'categorie_depense_id' => $categorieDepense->id, 'montant' => 25000,
            'date_depense' => $dateMilieu->format('Y-m-d'), 'description' => 'Craies et cahiers', 'statut' => 'valide',
        ]);
    }
}