<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Echeance extends Model
{
    protected $fillable = ['type_frais_id', 'nom', 'montant', 'date_echeance', 'ordre'];
    protected $casts = ['date_echeance' => 'date'];

    public function typeFrais() { return $this->belongsTo(TypeFrais::class); }
    public function paiements() { return $this->hasMany(Paiement::class); }
}
