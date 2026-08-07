<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ParametreEcole extends Model
{
    protected $table = 'parametres_ecole';
    protected $fillable = ['cle', 'valeur'];

    public static function set(string $cle, $valeur): void
    {
        static::updateOrCreate(['cle' => $cle], ['valeur' => $valeur]);
    }
}