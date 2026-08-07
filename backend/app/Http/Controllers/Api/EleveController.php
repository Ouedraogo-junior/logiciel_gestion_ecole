<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Affectation;
use App\Models\Classe;
use App\Models\Eleve;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class EleveController extends Controller
{
    public function index(Request $request)
    {
        $query = Eleve::with(['contacts', 'inscriptionActuelle.classe']);

        if ($request->user()->role === 'enseignant') {
            $classesAutorisees = Affectation::where('enseignant_id', $request->user()->id)
                ->pluck('classe_id')
                ->merge(Classe::where('enseignant_titulaire_id', $request->user()->id)->pluck('id'))
                ->unique();

            $query->whereHas('inscriptions', function ($q) use ($classesAutorisees) {
                $q->whereIn('classe_id', $classesAutorisees)
                  ->whereHas('anneeScolaire', fn ($aq) => $aq->where('is_active', true));
            });
        }

        if ($request->filled('classe_id')) {
            $query->whereHas('inscriptions', function ($q) use ($request) {
                $q->where('classe_id', $request->classe_id)
                  ->whereHas('anneeScolaire', fn ($aq) => $aq->where('is_active', true));
            });
        }

        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }

        if ($request->filled('recherche')) {
            $recherche = $request->recherche;
            $query->where(function ($q) use ($recherche) {
                $q->where('nom', 'like', "%{$recherche}%")
                  ->orWhere('prenom', 'like', "%{$recherche}%")
                  ->orWhere('matricule', 'like', "%{$recherche}%");
            });
        }

        $tri = $request->input('tri', 'asc') === 'desc' ? 'desc' : 'asc';
        $perPage = min((int) $request->input('per_page', 20), 200);

        return response()->json($query->orderBy('nom', $tri)->paginate($perPage));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'date_naissance' => 'required|date',
            'sexe' => 'required|in:M,F',
            'classe_id' => 'required|exists:classes,id',
            'photo_path' => 'nullable|string',
            'contacts' => 'sometimes|array',
            'contacts.*.nom' => 'required_with:contacts|string|max:100',
            'contacts.*.telephone' => 'required_with:contacts|string|max:30',
            'contacts.*.lien_parente' => 'nullable|string|max:50',
        ]);

        $classe = Classe::findOrFail($validated['classe_id']);

        $eleve = DB::transaction(function () use ($validated, $classe) {
            $eleve = Eleve::create([
                'nom' => $validated['nom'],
                'prenom' => $validated['prenom'],
                'date_naissance' => $validated['date_naissance'],
                'sexe' => $validated['sexe'],
                'photo_path' => $validated['photo_path'] ?? null,
            ]);

            $eleve->inscriptions()->create([
                'classe_id' => $classe->id,
                'annee_scolaire_id' => $classe->annee_scolaire_id,
                'statut' => 'inscrit',
                'date_inscription' => now(),
            ]);

            if (!empty($validated['contacts'])) {
                $eleve->contacts()->createMany($validated['contacts']);
            }

            return $eleve;
        });

        return response()->json([
            'data' => $eleve->load(['contacts', 'inscriptions.classe']),
            'message' => 'Élève créé et inscrit.',
        ], 201);
    }

    public function storeMasse(Request $request)
    {
        $validated = $request->validate([
            'classe_id' => 'required|exists:classes,id',
            'eleves' => 'required|array|min:1|max:100',
        ]);

        $classe = Classe::findOrFail($validated['classe_id']);
        $resultats = [];
        $erreurs = [];

        foreach ($request->input('eleves') as $index => $ligne) {
            $validator = Validator::make($ligne, [
                'nom' => 'required|string|max:100',
                'prenom' => 'required|string|max:100',
                'date_naissance' => 'required|date',
                'sexe' => 'required|in:M,F',
                'contact_nom' => 'nullable|string|max:100',
                'contact_telephone' => 'nullable|string|max:30',
                'contact_lien_parente' => 'nullable|string|max:50',
            ]);

            if ($validator->fails()) {
                $erreurs[] = ['ligne' => $index + 1, 'erreur' => $validator->errors()->first()];
                continue;
            }

            $donnees = $validator->validated();

            $eleve = DB::transaction(function () use ($donnees, $classe) {
                $eleve = Eleve::create([
                    'nom' => $donnees['nom'],
                    'prenom' => $donnees['prenom'],
                    'date_naissance' => $donnees['date_naissance'],
                    'sexe' => $donnees['sexe'],
                ]);

                $eleve->inscriptions()->create([
                    'classe_id' => $classe->id,
                    'annee_scolaire_id' => $classe->annee_scolaire_id,
                    'statut' => 'inscrit',
                    'date_inscription' => now(),
                ]);

                if (!empty($donnees['contact_nom']) && !empty($donnees['contact_telephone'])) {
                    $eleve->contacts()->create([
                        'nom' => $donnees['contact_nom'],
                        'telephone' => $donnees['contact_telephone'],
                        'lien_parente' => $donnees['contact_lien_parente'] ?? null,
                    ]);
                }

                return $eleve;
            });

            $resultats[] = $eleve;
        }

        return response()->json([
            'data' => $resultats,
            'erreurs' => $erreurs,
            'message' => count($resultats).' élève(s) créé(s)'.(count($erreurs) > 0 ? ', '.count($erreurs).' ligne(s) en erreur.' : '.'),
        ], 201);
    }

    public function show(Eleve $eleve)
    {
        return response()->json(['data' => $eleve->load(['contacts', 'inscriptions.classe', 'inscriptions.anneeScolaire'])]);
    }

    public function update(Request $request, Eleve $eleve)
    {
        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:100',
            'prenom' => 'sometimes|required|string|max:100',
            'date_naissance' => 'sometimes|required|date',
            'sexe' => 'sometimes|required|in:M,F',
            'photo_path' => 'nullable|string',
            'statut' => 'sometimes|required|in:actif,transfere,inactif',
        ]);

        $eleve->update($validated);

        return response()->json(['data' => $eleve, 'message' => 'Élève mis à jour.']);
    }

    public function uploaderPhoto(Request $request, Eleve $eleve)
    {
        $validated = $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        if ($eleve->photo_path) {
            Storage::disk('public')->delete($eleve->photo_path);
        }

        $chemin = $validated['photo']->store('photos', 'public');

        $eleve->update(['photo_path' => $chemin]);

        return response()->json(['data' => $eleve, 'message' => 'Photo mise à jour.']);
    }

    public function destroy(Eleve $eleve)
    {
        $eleve->delete();
        return response()->json(['message' => 'Élève supprimé.']);
    }
}