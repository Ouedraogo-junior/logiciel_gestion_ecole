<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Eleve extends Model
{
    protected $table = 'eleves';

    protected $fillable = ['nom', 'prenom', 'date_naissance', 'sexe', 'photo_path', 'statut'];

    protected $casts = ['date_naissance' => 'date'];

    protected static function booted(): void
    {
        static::creating(function (Eleve $eleve) {
            if (empty($eleve->matricule)) {
                $eleve->matricule = self::genererMatricule();
            }
        });
    }

    public static function genererMatricule(): string
    {
        $prefixe = (string) now()->year;

        $dernierNumero = self::where('matricule', 'like', $prefixe.'-%')
            ->orderByDesc('matricule')
            ->value('matricule');

        $sequence = $dernierNumero ? ((int) substr($dernierNumero, -4)) + 1 : 1;

        return $prefixe.'-'.str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }

    public function inscriptions()
    {
        return $this->hasMany(Inscription::class);
    }

    public function inscriptionActuelle()
    {
        return $this->hasOne(Inscription::class)
            ->whereHas('anneeScolaire', fn ($q) => $q->where('is_active', true));
    }

    public function contacts()
    {
        return $this->hasMany(EleveContact::class);
    }
}