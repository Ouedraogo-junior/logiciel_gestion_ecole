<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class CompteDirectionController extends Controller
{
    public function index()
    {
        return response()->json(['data' => User::where('role', 'direction')->orderBy('nom')->get()]);
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

        $compte = User::create([
            'nom' => $validated['nom'],
            'prenom' => $validated['prenom'],
            'pseudo' => $validated['pseudo'],
            'telephone_contact' => $validated['telephone_contact'] ?? null,
            'password' => Hash::make($validated['password']),
            'role' => 'direction',
            'actif' => true,
        ]);

        return response()->json(['data' => $compte, 'message' => 'Compte direction créé.'], 201);
    }

    public function update(Request $request, User $direction)
    {
        abort_unless($direction->role === 'direction', 404);

        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:100',
            'prenom' => 'sometimes|required|string|max:100',
            'telephone_contact' => 'nullable|string|max:30',
            'pseudo' => 'sometimes|required|string|max:50|unique:users,pseudo,'.$direction->id,
            'actif' => 'sometimes|boolean',
        ]);

        if (array_key_exists('actif', $validated) && !$validated['actif']) {
            $autresActifs = User::where('role', 'direction')
                ->where('id', '!=', $direction->id)
                ->where('actif', true)
                ->exists();

            if (!$autresActifs) {
                return response()->json(['message' => 'Impossible de désactiver le dernier compte direction actif.'], 422);
            }

            $direction->tokens()->delete(); // révoque tous les accès actifs
        }

        $direction->update($validated);

        return response()->json(['data' => $direction, 'message' => 'Compte mis à jour.']);
    }
}