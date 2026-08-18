<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class DemoLoginController extends Controller
{
    public function login(Request $request)
    {
        abort_unless(config('app.demo_mode'), 404);

        $validated = $request->validate(['role' => 'required|in:direction,enseignant']);

        $pseudo = $validated['role'] === 'direction' ? 'demo.direction' : 'demo.enseignant';
        $user = User::where('pseudo', $pseudo)->where('actif', true)->firstOrFail();

        $token = $user->createToken('demo')->plainTextToken;

        return response()->json(['data' => ['user' => $user, 'token' => $token]]);
    }
}