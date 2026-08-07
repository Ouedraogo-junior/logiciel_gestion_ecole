<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('classe_matiere_enseignant', function (Blueprint $table) {
            $table->unique(['classe_id', 'matiere_id'], 'affectation_classe_matiere_unique');
        });

        Schema::table('classe_matiere_enseignant', function (Blueprint $table) {
            $table->dropUnique('affectation_unique');
        });
    }

    public function down(): void
    {
        Schema::table('classe_matiere_enseignant', function (Blueprint $table) {
            $table->unique(['classe_id', 'matiere_id', 'enseignant_id'], 'affectation_unique');
        });

        Schema::table('classe_matiere_enseignant', function (Blueprint $table) {
            $table->dropUnique('affectation_classe_matiere_unique');
        });
    }
};
