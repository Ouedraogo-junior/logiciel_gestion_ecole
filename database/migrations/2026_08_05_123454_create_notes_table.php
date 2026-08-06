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
        Schema::create('notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('eleve_id')->constrained('eleves')->cascadeOnDelete();
            $table->foreignId('classe_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('matiere_id')->constrained('matieres')->cascadeOnDelete();
            $table->foreignId('periode_id')->constrained('periodes')->cascadeOnDelete();
            $table->foreignId('type_evaluation_id')->constrained('types_evaluation')->cascadeOnDelete();
            $table->decimal('valeur', 5, 2);
            $table->foreignId('saisi_par')->constrained('users');
            $table->timestamp('saisi_le')->useCurrent();
            $table->boolean('verrouille')->default(false);
            $table->timestamps();

            $table->unique(['eleve_id', 'matiere_id', 'periode_id', 'type_evaluation_id'], 'note_unique_eval');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notes');
    }
};
