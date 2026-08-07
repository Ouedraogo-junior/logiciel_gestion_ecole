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
        Schema::create('examens_nationaux', function (Blueprint $table) {
            $table->id();
            $table->foreignId('eleve_id')->constrained('eleves')->cascadeOnDelete();
            $table->foreignId('annee_scolaire_id')->constrained('annees_scolaires')->cascadeOnDelete();
            $table->string('type_examen')->default('CEP');
            $table->enum('statut_inscription', ['non_inscrit', 'inscrit'])->default('inscrit');
            $table->string('numero_candidat')->nullable();
            $table->string('centre_examen')->nullable();
            $table->date('date_examen')->nullable();
            $table->enum('resultat', ['en_attente', 'admis', 'ajourne'])->default('en_attente');
            $table->string('mention')->nullable();
            $table->date('date_publication_resultat')->nullable();
            $table->foreignId('saisi_par')->constrained('users');
            $table->timestamps();

            $table->unique(['eleve_id', 'annee_scolaire_id'], 'examen_national_eleve_annee_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('examens_nationaux');
    }
};
