<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'pseudo' => 'required|string',
            'password' => 'required',
        ]);

        $user = \App\Models\User::where('pseudo', $request->pseudo)->first();

        if (!$user || !Hash::check($request->password, $user->password) || !$user->actif) {
            throw ValidationException::withMessages([
                'pseudo' => ['Identifiants invalides ou compte désactivé.'],
            ]);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Déconnecté.']);
    }

    public function me(Request $request)
    {
        return response()->json(['data' => $request->user()]);
    }
}