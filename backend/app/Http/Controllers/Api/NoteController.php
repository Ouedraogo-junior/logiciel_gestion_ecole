<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Affectation;
use App\Models\AnneeScolaire;
use App\Models\Classe;
use App\Models\Eleve;
use App\Models\Matiere;
use App\Models\Note;
use App\Models\ParametreEcole;
use App\Models\TypeEvaluation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NoteController extends Controller
{
    public function index(Request $request)
    {
        $query = Note::with('typeEvaluation');

        if ($request->filled('classe_id')) $query->where('classe_id', $request->classe_id);
        if ($request->filled('matiere_id')) $query->where('matiere_id', $request->matiere_id);
        if ($request->filled('periode_id')) $query->where('periode_id', $request->periode_id);
        if ($request->filled('type_evaluation_id')) $query->where('type_evaluation_id', $request->type_evaluation_id);
        if ($request->filled('eleve_id')) $query->where('eleve_id', $request->eleve_id);

        return response()->json(['data' => $query->get()]);
    }

    public function saisieMasse(Request $request)
    {
        $validated = $request->validate([
            'classe_id' => 'required|exists:classes,id',
            'matiere_id' => 'required|exists:matieres,id',
            'periode_id' => 'required|exists:periodes,id',
            'type_evaluation_id' => 'required|exists:types_evaluation,id',
            'notes' => 'required|array|min:1',
            'notes.*.eleve_id' => 'required|exists:eleves,id',
            'notes.*.valeur' => 'required|numeric|min:0',
        ]);

        $typeEvaluation = TypeEvaluation::findOrFail($validated['type_evaluation_id']);

        $depassements = collect($validated['notes'])->filter(fn ($n) => $n['valeur'] > $typeEvaluation->note_maximale);
        if ($depassements->isNotEmpty()) {
            return response()->json([
                'message' => "Une ou plusieurs notes dépassent le maximum autorisé pour cette évaluation ({$typeEvaluation->note_maximale}).",
            ], 422);
        }

        $user = $request->user();

        if ($user->role === 'enseignant') {
            $responsable = Affectation::enseignantResponsable($validated['classe_id'], $validated['matiere_id']);

            if ($responsable !== $user->id) {
                return response()->json(['message' => "Vous n'êtes pas responsable de cette classe/matière."], 403);
            }
        }

        $resultats = [];
        $bloquees = [];

        foreach ($validated['notes'] as $entree) {
            $existante = Note::where([
                'eleve_id' => $entree['eleve_id'],
                'matiere_id' => $validated['matiere_id'],
                'periode_id' => $validated['periode_id'],
                'type_evaluation_id' => $validated['type_evaluation_id'],
            ])->first();

            if ($existante && $existante->verrouille) {
                $bloquees[] = $entree['eleve_id'];
                continue;
            }

            $resultats[] = Note::updateOrCreate(
                [
                    'eleve_id' => $entree['eleve_id'],
                    'matiere_id' => $validated['matiere_id'],
                    'periode_id' => $validated['periode_id'],
                    'type_evaluation_id' => $validated['type_evaluation_id'],
                ],
                [
                    'classe_id' => $validated['classe_id'],
                    'valeur' => $entree['valeur'],
                    'saisi_par' => $user->id,
                    'saisi_le' => now(),
                ]
            );
        }

        return response()->json([
            'data' => $resultats,
            'notes_bloquees' => $bloquees,
            'message' => count($bloquees) > 0
                ? 'Notes enregistrées, certaines étaient verrouillées et ignorées.'
                : 'Notes enregistrées.',
        ]);
    }

    public function verrouiller(Request $request)
    {
        $validated = $request->validate([
            'classe_id' => 'required|exists:classes,id',
            'matiere_id' => 'required|exists:matieres,id',
            'periode_id' => 'required|exists:periodes,id',
        ]);

        $nb = Note::where($validated)->update(['verrouille' => true]);

        return response()->json(['message' => "$nb note(s) verrouillée(s)."]);
    }

    public function moyennes(Request $request, Eleve $eleve)
    {
        $request->validate(['periode_id' => 'required|exists:periodes,id']);

        $resultat = Note::moyennesPourEleve($eleve->id, $request->periode_id);

        return response()->json(['data' => [
            'par_matiere' => $resultat['par_matiere'],
            'moyenne_generale' => $resultat['moyenne_generale'],
            'echelle' => $resultat['echelle'],
        ]]);
    }

    public function moyennesClasse(Classe $classe)
    {
        $echelle = (float) (ParametreEcole::where('cle', 'echelle_notation')->value('valeur') ?? 20);

        $notes = Note::where('classe_id', $classe->id)->with('typeEvaluation')->get();

        $coefficients = DB::table('classe_matiere_enseignant')
            ->where('classe_id', $classe->id)
            ->pluck('coefficient', 'matiere_id');

        $resultat = [];

        foreach ($notes->groupBy('eleve_id') as $eleveId => $notesEleve) {
            $sommePondereeGenerale = 0;
            $sommeCoefficients = 0;

            foreach ($notesEleve->groupBy('matiere_id') as $matiereId => $notesMatiere) {
                $sommePonderee = $notesMatiere->sum(function ($n) use ($echelle) {
                    return ($n->valeur / $n->typeEvaluation->note_maximale) * $echelle * $n->typeEvaluation->ponderation;
                });
                $sommePonderations = $notesMatiere->sum(fn ($n) => $n->typeEvaluation->ponderation);

                if ($sommePonderations > 0) {
                    $moyenneMatiere = $sommePonderee / $sommePonderations;
                    $coefficient = $coefficients[$matiereId] ?? 1;
                    $sommePondereeGenerale += $moyenneMatiere * $coefficient;
                    $sommeCoefficients += $coefficient;
                }
            }

            $resultat[$eleveId] = $sommeCoefficients > 0 ? round($sommePondereeGenerale / $sommeCoefficients, 2) : null;
        }

        return response()->json(['data' => $resultat, 'echelle' => $echelle]);
    }

    public function mesAffectationsEffectives(Request $request)
    {
        $user = $request->user();
        $anneeActive = AnneeScolaire::where('is_active', true)->first();

        if (!$anneeActive) {
            return response()->json(['data' => []]);
        }

        $classesTitulaire = Classe::where('enseignant_titulaire_id', $user->id)
            ->where('annee_scolaire_id', $anneeActive->id)
            ->get();

        $classesAffectees = Classe::whereHas('affectations', fn ($q) => $q->where('enseignant_id', $user->id))
            ->where('annee_scolaire_id', $anneeActive->id)
            ->get();

        $classes = $classesTitulaire->merge($classesAffectees)->unique('id')->values();
        $matieres = Matiere::all();

        $resultat = $classes->map(function ($classe) use ($matieres, $user) {
            $matieresResponsable = $matieres->filter(function ($matiere) use ($classe, $user) {
                return Affectation::enseignantResponsable($classe->id, $matiere->id) === $user->id;
            })->values();

            return ['classe' => $classe, 'matieres' => $matieresResponsable];
        })->filter(fn ($c) => $c['matieres']->isNotEmpty())->values();

        return response()->json(['data' => $resultat]);
    }
}