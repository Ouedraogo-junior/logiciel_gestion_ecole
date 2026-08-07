<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Classe extends Model
{
    protected $fillable = ['nom', 'niveau', 'annee_scolaire_id', 'enseignant_titulaire_id', 'effectif_max'];

    public function anneeScolaire()
    {
        return $this->belongsTo(AnneeScolaire::class);
    }

    public function enseignantTitulaire()
    {
        return $this->belongsTo(User::class, 'enseignant_titulaire_id');
    }

    public function eleves()
    {
        return $this->hasManyThrough(
            Eleve::class,
            Inscription::class,
            'classe_id',   // clé étrangère sur inscriptions
            'id',          // clé locale sur eleves
            'id',          // clé locale sur classes
            'eleve_id'     // clé étrangère correspondante sur inscriptions
        );
    }

    public function inscriptions()
    {
        return $this->hasMany(Inscription::class);
    }

}
