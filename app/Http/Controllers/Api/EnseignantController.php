<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class EnseignantController extends Controller
{
    public function index(Request $request)
    {
        $query = User::where('role', 'enseignant')->with(['affectations.classe', 'affectations.matiere']);

        if ($request->filled('actif')) {
            $query->where('actif', (bool) $request->actif);
        }

        return response()->json(['data' => $query->orderBy('nom')->get()]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'pseudo' => 'required|string|max:50|unique:users,pseudo',
            'telephone_contact' => 'nullable|string|max:30',
            'password' => 'required|string|min:6',
        ]);

        $enseignant = User::create([
            'nom' => $validated['nom'],
            'prenom' => $validated['prenom'],
            'pseudo' => $validated['pseudo'],
            'telephone_contact' => $validated['telephone_contact'] ?? null,
            'password' => Hash::make($validated['password']),
            'role' => 'enseignant',
            'actif' => true,
        ]);

        return response()->json(['data' => $enseignant, 'message' => 'Enseignant créé.'], 201);
    }

    public function show(User $enseignant)
    {
        abort_unless($enseignant->role === 'enseignant', 404);

        return response()->json(['data' => $enseignant->load(['affectations.classe', 'affectations.matiere'])]);
    }

    public function update(Request $request, User $enseignant)
    {
        abort_unless($enseignant->role === 'enseignant', 404);

        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:100',
            'prenom' => 'sometimes|required|string|max:100',
            'telephone_contact' => 'nullable|string|max:30',
            'pseudo' => 'sometimes|required|string|max:50|unique:users,pseudo,'.$enseignant->id,
            'actif' => 'sometimes|boolean',
        ]);

        if (array_key_exists('actif', $validated) && !$validated['actif']) {
            $enseignant->tokens()->delete();
        }

        $enseignant->update($validated);

        return response()->json(['data' => $enseignant, 'message' => 'Enseignant mis à jour.']);
    }

    public function reinitialiserMotDePasse(Request $request, User $enseignant)
    {
        abort_unless($enseignant->role === 'enseignant', 404);

        $validated = $request->validate(['password' => 'required|string|min:6']);

        $enseignant->update(['password' => Hash::make($validated['password'])]);

        return response()->json(['message' => 'Mot de passe réinitialisé.']);
    }
}