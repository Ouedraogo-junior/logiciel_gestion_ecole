<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

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

    public static function moyennesPourEleve(int $eleveId, int $periodeId): array
    {
        $echelle = (float) (ParametreEcole::where('cle', 'echelle_notation')->value('valeur') ?? 20);

        $notes = self::where('eleve_id', $eleveId)
            ->where('periode_id', $periodeId)
            ->with('typeEvaluation')
            ->get();

        $parMatiere = $notes->groupBy('matiere_id')->map(function ($notesMatiere) use ($echelle) {
            $sommePonderee = $notesMatiere->sum(function ($n) use ($echelle) {
                return ($n->valeur / $n->typeEvaluation->note_maximale) * $echelle * $n->typeEvaluation->ponderation;
            });
            $sommePonderations = $notesMatiere->sum(fn ($n) => $n->typeEvaluation->ponderation);

            return [
                'matiere_id' => $notesMatiere->first()->matiere_id,
                'moyenne' => $sommePonderations > 0 ? round($sommePonderee / $sommePonderations, 2) : null,
            ];
        })->values();

        $classeId = $notes->first()?->classe_id;
        $coefficients = $classeId
            ? DB::table('classe_matiere_enseignant')->where('classe_id', $classeId)->pluck('coefficient', 'matiere_id')
            : collect();

        $sommePondereeGenerale = $parMatiere->sum(fn ($m) => $m['moyenne'] * ($coefficients[$m['matiere_id']] ?? 1));
        $sommeCoefficients = $parMatiere->sum(fn ($m) => $coefficients[$m['matiere_id']] ?? 1);

        return [
            'classe_id' => $classeId,
            'par_matiere' => $parMatiere->toArray(),
            'coefficients' => $coefficients,
            'moyenne_generale' => $sommeCoefficients > 0 ? round($sommePondereeGenerale / $sommeCoefficients, 2) : null,
            'echelle' => $echelle,
        ];
    }

    public static function classementPourClasse(int $classeId, int $periodeId): array
    {
        $eleveIds = Inscription::where('classe_id', $classeId)
            ->whereHas('anneeScolaire', fn ($q) => $q->where('is_active', true))
            ->pluck('eleve_id');

        $moyennes = $eleveIds->map(function ($eleveId) use ($periodeId) {
            $resultat = self::moyennesPourEleve($eleveId, $periodeId);
            return ['eleve_id' => $eleveId, 'moyenne_generale' => $resultat['moyenne_generale']];
        })->filter(fn ($m) => $m['moyenne_generale'] !== null)
          ->sortByDesc('moyenne_generale')
          ->values();

        return [
            'effectif_total' => $eleveIds->count(),
            'classement' => $moyennes->toArray(),
        ];
    }
}