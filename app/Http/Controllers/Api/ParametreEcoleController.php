<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ParametreEcole;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ParametreEcoleController extends Controller
{
    public function index()
    {
        return response()->json(['data' => ParametreEcole::pluck('valeur', 'cle')]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate(['parametres' => 'required|array']);

        foreach ($validated['parametres'] as $cle => $valeur) {
            ParametreEcole::set($cle, $valeur);
        }

        return response()->json(['data' => ParametreEcole::pluck('valeur', 'cle'), 'message' => 'Paramètres mis à jour.']);
    }

    public function uploaderLogo(Request $request)
    {
        $validated = $request->validate([
            'logo' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $ancienLogo = ParametreEcole::where('cle', 'logo_path')->value('valeur');
        if ($ancienLogo) {
            Storage::disk('public')->delete($ancienLogo);
        }

        $chemin = $validated['logo']->store('logos', 'public');

        ParametreEcole::set('logo_path', $chemin);

        return response()->json(['data' => ['logo_path' => $chemin], 'message' => 'Logo mis à jour.']);
    }
}