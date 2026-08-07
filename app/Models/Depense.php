<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Depense extends Model
{
    protected $fillable = ['categorie_depense_id', 'montant', 'date_depense', 'description', 'justificatif_path', 'saisi_par', 'statut'];
    protected $casts = ['date_depense' => 'date'];

    public function categorie() { return $this->belongsTo(CategorieDepense::class, 'categorie_depense_id'); }
    public function saisiPar() { return $this->belongsTo(User::class, 'saisi_par'); }
}
