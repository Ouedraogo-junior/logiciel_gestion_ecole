<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Note extends Model
{
    protected $fillable = [
        'eleve_id', 'classe_id', 'matiere_id', 'periode_id',
        'type_evaluation_id', 'valeur', 'saisi_par', 'saisi_le', 'verrouille',
    ];

    protected $casts = ['saisi_le' => 'datetime'];

    public function eleve() { return $this->belongsTo(Eleve::class); }
    public function classe() { return $this->belongsTo(Classe::class); }
    public function matiere() { return $this->belongsTo(Matiere::class); }
    public function periode() { return $this->belongsTo(Periode::class); }
    public function typeEvaluation() { return $this->belongsTo(TypeEvaluation::class); }
    public function saisiPar() { return $this->belongsTo(User::class, 'saisi_par'); }
}