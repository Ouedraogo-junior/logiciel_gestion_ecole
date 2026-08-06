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
        Schema::create('depenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('categorie_depense_id')->constrained('categories_depenses')->cascadeOnDelete();
            $table->decimal('montant', 10, 2);
            $table->date('date_depense');
            $table->string('description');
            $table->string('justificatif_path')->nullable();
            $table->foreignId('saisi_par')->constrained('users');
            $table->enum('statut', ['valide', 'annule'])->default('valide');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('depenses');
    }
};
