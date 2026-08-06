<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inscription extends Model
{
    protected $table = 'inscriptions';

    protected $fillable = ['eleve_id', 'classe_id', 'annee_scolaire_id', 'statut', 'date_inscription'];

    public function eleve()
    {
        return $this->belongsTo(Eleve::class);
    }

    public function classe()
    {
        return $this->belongsTo(Classe::class);
    }

    public function anneeScolaire()
    {
        return $this->belongsTo(AnneeScolaire::class);
    }
}