<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TypeEvaluation extends Model
{
    protected $table = 'types_evaluation';

    protected $fillable = ['nom', 'ponderation', 'note_maximale'];
}