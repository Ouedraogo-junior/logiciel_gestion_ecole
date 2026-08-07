<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmploiDuTemps extends Model
{
    protected $table = 'emplois_du_temps';

    protected $fillable = ['classe_id', 'matiere_id', 'enseignant_id', 'jour_semaine', 'heure_debut', 'heure_fin'];

    public function classe() { return $this->belongsTo(Classe::class); }
    public function matiere() { return $this->belongsTo(Matiere::class); }
    public function enseignant() { return $this->belongsTo(User::class, 'enseignant_id'); }
}