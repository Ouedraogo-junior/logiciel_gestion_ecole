<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnneeScolaire extends Model
{
    protected $table = 'annees_scolaires';
    
    protected $fillable = ['libelle', 'date_debut', 'date_fin', 'is_active'];

    public function periodes()
    {
        return $this->hasMany(Periode::class);
    }
}
