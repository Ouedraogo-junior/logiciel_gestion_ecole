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
        Schema::create('presences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('eleve_id')->constrained('eleves')->cascadeOnDelete();
            $table->foreignId('classe_id')->constrained('classes')->cascadeOnDelete();
            $table->date('date');
            $table->enum('statut', ['present', 'absent', 'retard']);
            $table->string('motif')->nullable();
            $table->string('justificatif_path')->nullable();
            $table->foreignId('saisi_par')->constrained('users');
            $table->enum('mode_saisie', ['temps_reel', 'differe']);
            $table->timestamp('saisi_le')->useCurrent();
            $table->timestamps();

            $table->unique(['eleve_id', 'date'], 'presence_unique_jour');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('presences');
    }
};
