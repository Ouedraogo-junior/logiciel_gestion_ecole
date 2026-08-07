<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Presence extends Model
{
    protected $fillable = [
        'eleve_id', 'classe_id', 'date', 'statut',
        'motif', 'justificatif_path', 'saisi_par', 'mode_saisie', 'saisi_le',
    ];

    protected $casts = ['date' => 'date', 'saisi_le' => 'datetime'];

    public function eleve() { return $this->belongsTo(Eleve::class); }
    public function classe() { return $this->belongsTo(Classe::class); }
    public function saisiPar() { return $this->belongsTo(User::class, 'saisi_par'); }
}