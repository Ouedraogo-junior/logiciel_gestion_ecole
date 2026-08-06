<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CategorieDepense extends Model
{
    protected $table = 'categories_depenses';
    protected $fillable = ['annee_scolaire_id', 'nom', 'description'];

    public function anneeScolaire() { return $this->belongsTo(AnneeScolaire::class); }
    public function depenses() { return $this->hasMany(Depense::class, 'categorie_depense_id'); }
}
