<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Paiement extends Model
{
    protected $fillable = [
        'eleve_id', 'echeance_id', 'montant', 'date_paiement',
        'moyen_paiement', 'reference', 'numero_recu', 'saisi_par', 'statut', 'notes',
    ];

    protected $casts = ['date_paiement' => 'date'];

    public static function genererNumeroRecu(string $datePaiement): string
    {
        $annee = substr($datePaiement, 0, 4);

        $dernier = self::where('numero_recu', 'like', "REC-{$annee}-%")
            ->orderByDesc('numero_recu')
            ->value('numero_recu');

        $sequence = $dernier ? ((int) substr($dernier, -4)) + 1 : 1;

        return "REC-{$annee}-".str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }

    public function eleve() { return $this->belongsTo(Eleve::class); }
    public function echeance() { return $this->belongsTo(Echeance::class); }
    public function saisiPar() { return $this->belongsTo(User::class, 'saisi_par'); }
}