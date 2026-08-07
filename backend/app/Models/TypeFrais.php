<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TypeFrais extends Model
{
    protected $table = 'types_frais';
    protected $fillable = ['annee_scolaire_id', 'nom', 'niveau', 'description'];

    public function anneeScolaire() { return $this->belongsTo(AnneeScolaire::class); }
    public function echeances() { return $this->hasMany(Echeance::class); }
}