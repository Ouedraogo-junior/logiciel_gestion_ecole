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
        Schema::create('inscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('eleve_id')->constrained('eleves')->cascadeOnDelete();
            $table->foreignId('classe_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('annee_scolaire_id')->constrained('annees_scolaires')->cascadeOnDelete();
            $table->enum('statut', ['inscrit', 'reinscrit', 'redouble', 'transfere', 'abandon'])->default('inscrit');
            $table->date('date_inscription');
            $table->timestamps();

            $table->unique(['eleve_id', 'annee_scolaire_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inscriptions');
    }
};
