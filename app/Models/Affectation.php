<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Affectation extends Model
{
    protected $table = 'classe_matiere_enseignant';

    protected $fillable = ['classe_id', 'matiere_id', 'enseignant_id', 'coefficient'];

    public function classe() { return $this->belongsTo(Classe::class); }
    public function matiere() { return $this->belongsTo(Matiere::class); }
    public function enseignant() { return $this->belongsTo(User::class, 'enseignant_id'); }
}