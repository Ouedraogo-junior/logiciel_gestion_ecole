<?php

namespace App\Console\Commands;

use Database\Seeders\DemoDataSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ResetDemoData extends Command
{
    protected $signature = 'demo:reset';
    protected $description = 'Réinitialise complètement les données de démonstration (irréversible, uniquement en mode démo).';

    public function handle(): int
    {
        if (!config('app.demo_mode')) {
            $this->error('Refusé : cette commande ne peut tourner que sur une instance avec APP_DEMO_MODE=true.');
            return self::FAILURE;
        }

        $this->info('Réinitialisation des données de démonstration...');

        Schema::disableForeignKeyConstraints();

        foreach ([
            'notes', 'presences', 'paiements', 'depenses', 'categories_depenses',
            'examens_nationaux', 'emplois_du_temps', 'classe_matiere_enseignant',
            'inscriptions', 'eleve_contacts', 'eleves', 'echeances', 'types_frais',
            'types_evaluation', 'periodes', 'classes', 'matieres', 'parametres_ecole',
            'annees_scolaires', 'users',
        ] as $table) {
            DB::table($table)->truncate();
        }

        Schema::enableForeignKeyConstraints();

        (new DemoDataSeeder())->run();

        $this->info('Données de démonstration réinitialisées avec succès.');
        return self::SUCCESS;
    }
}