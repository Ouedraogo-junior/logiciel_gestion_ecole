<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EleveContact extends Model
{
    protected $table = 'eleve_contacts';

    protected $fillable = ['eleve_id', 'nom', 'telephone', 'lien_parente'];

    public function eleve()
    {
        return $this->belongsTo(Eleve::class);
    }
}