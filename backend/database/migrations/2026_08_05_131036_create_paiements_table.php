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
        Schema::create('paiements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('eleve_id')->constrained('eleves')->cascadeOnDelete();
            $table->foreignId('echeance_id')->constrained('echeances')->cascadeOnDelete();
            $table->decimal('montant', 10, 2);
            $table->date('date_paiement');
            $table->enum('moyen_paiement', ['especes', 'mobile_money', 'cheque', 'autre']);
            $table->string('reference')->nullable();
            $table->foreignId('saisi_par')->constrained('users');
            $table->enum('statut', ['valide', 'annule'])->default('valide');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('paiements');
    }
};
