<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExamenNational extends Model
{
    protected $table = 'examens_nationaux';

    protected $fillable = [
        'eleve_id', 'annee_scolaire_id', 'type_examen', 'statut_inscription',
        'numero_candidat', 'centre_examen', 'date_examen', 'resultat', 'mention',
        'date_publication_resultat', 'saisi_par',
    ];

    protected $casts = [
        'date_examen' => 'date',
        'date_publication_resultat' => 'date',
    ];

    public function eleve() { return $this->belongsTo(Eleve::class); }
    public function anneeScolaire() { return $this->belongsTo(AnneeScolaire::class); }
    public function saisiPar() { return $this->belongsTo(User::class, 'saisi_par'); }
}