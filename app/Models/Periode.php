<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Periode extends Model
{
    protected $fillable = ['annee_scolaire_id', 'nom', 'ordre', 'date_debut', 'date_fin'];

    public function anneeScolaire()
    {
        return $this->belongsTo(AnneeScolaire::class);
    }
}
