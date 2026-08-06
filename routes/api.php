<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AnneeScolaireController;
use App\Http\Controllers\Api\PeriodeController;
use App\Http\Controllers\Api\ClasseController;
use App\Http\Controllers\Api\MatiereController;
use App\Http\Controllers\Api\EleveController;
use App\Http\Controllers\Api\InscriptionController;
use App\Http\Controllers\Api\AffectationController;
use App\Http\Controllers\Api\TypeEvaluationController;
use App\Http\Controllers\Api\NoteController;
use App\Http\Controllers\Api\PresenceController;
use App\Http\Controllers\Api\TypeFraisController;
use App\Http\Controllers\Api\EcheanceController;
use App\Http\Controllers\Api\PaiementController;
use App\Http\Controllers\Api\EnseignantController;
use App\Http\Controllers\Api\CompteDirectionController;
use App\Http\Controllers\Api\CategorieDepenseController;
use App\Http\Controllers\Api\DepenseController;
use App\Http\Controllers\Api\RapportFinancierController;
use App\Http\Controllers\Api\ParametreEcoleController;
use App\Http\Controllers\Api\CarteScolaireController;
use App\Http\Controllers\Api\RecuController;

Route::prefix('v1')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);

        // Lecture ouverte à tous les connectés
        Route::apiResource('annees-scolaires', AnneeScolaireController::class)
            ->parameters(['annees-scolaires' => 'anneeScolaire'])->only(['index', 'show']);
        Route::apiResource('periodes', PeriodeController::class)
            ->parameters(['periodes' => 'periode'])->only(['index', 'show']);
        Route::apiResource('classes', ClasseController::class)
            ->parameters(['classes' => 'classe'])->only(['index', 'show']);
        Route::apiResource('matieres', MatiereController::class)
            ->parameters(['matieres' => 'matiere'])->only(['index', 'show']);
        Route::apiResource('eleves', EleveController::class)
            ->parameters(['eleves' => 'eleve'])->only(['index', 'show']);
        Route::apiResource('inscriptions', InscriptionController::class)->only(['index']);
        Route::apiResource('affectations', AffectationController::class)
            ->parameters(['affectations' => 'affectation'])->only(['index']);
        Route::apiResource('types-evaluation', TypeEvaluationController::class)
            ->parameters(['types-evaluation' => 'typeEvaluation'])->only(['index', 'show']);
        Route::post('/types-evaluation', [TypeEvaluationController::class, 'store']);
        Route::put('/types-evaluation/{typeEvaluation}', [TypeEvaluationController::class, 'update']);
        Route::get('/notes', [NoteController::class, 'index']);
        Route::get('/classes/{classe}/moyennes', [NoteController::class, 'moyennesClasse']);
        Route::get('/eleves/{eleve}/moyennes', [NoteController::class, 'moyennes']);
        Route::get('/presences', [PresenceController::class, 'index']);
        Route::get('/eleves/{eleve}/assiduite', [PresenceController::class, 'assiduite']);
        Route::apiResource('types-frais', TypeFraisController::class)
            ->parameters(['types-frais' => 'typeFrais'])->only(['index', 'show']);
        Route::apiResource('echeances', EcheanceController::class)
            ->parameters(['echeances' => 'echeance'])->only(['index', 'show']);
        Route::get('/parametres-ecole', [ParametreEcoleController::class, 'index']);

        Route::middleware('role:direction,enseignant')->group(function () {
            Route::post('/notes/saisie-masse', [NoteController::class, 'saisieMasse']);
            Route::post('/presences/appel', [PresenceController::class, 'appel']);
        });

        // Écriture réservée à la direction
        Route::middleware('role:direction')->group(function () {
            Route::apiResource('annees-scolaires', AnneeScolaireController::class)
                ->parameters(['annees-scolaires' => 'anneeScolaire'])->except(['index', 'show']);
            Route::apiResource('periodes', PeriodeController::class)
                ->parameters(['periodes' => 'periode'])->except(['index', 'show']);
            Route::apiResource('classes', ClasseController::class)
                ->parameters(['classes' => 'classe'])->except(['index', 'show']);
            Route::post('/classes/dupliquer', [ClasseController::class, 'dupliquer']);
            Route::apiResource('matieres', MatiereController::class)
                ->parameters(['matieres' => 'matiere'])->except(['index', 'show']);
            Route::apiResource('eleves', EleveController::class)
                ->parameters(['eleves' => 'eleve'])->except(['index', 'show']);
            Route::post('/eleves/masse', [EleveController::class, 'storeMasse']);
            Route::post('/eleves/{eleve}/photo', [EleveController::class, 'uploaderPhoto']);
            Route::apiResource('inscriptions', InscriptionController::class)->only(['store']);
            Route::apiResource('affectations', AffectationController::class)
                ->parameters(['affectations' => 'affectation'])->only(['store', 'destroy']);
            Route::post('/inscriptions/promotion-masse', [InscriptionController::class, 'promotionMasse']);
            Route::apiResource('types-evaluation', TypeEvaluationController::class)
                ->parameters(['types-evaluation' => 'typeEvaluation'])->only(['update', 'destroy']);
            Route::post('/notes/verrouiller', [NoteController::class, 'verrouiller']);

            Route::apiResource('types-frais', TypeFraisController::class)
                ->parameters(['types-frais' => 'typeFrais'])->except(['index', 'show']);
            Route::apiResource('echeances', EcheanceController::class)
                ->parameters(['echeances' => 'echeance'])->except(['index', 'show']);
            Route::get('/paiements', [PaiementController::class, 'index']);
            Route::get('/paiements/retards', [PaiementController::class, 'retards']);
            Route::get('/soldes', [PaiementController::class, 'soldes']);
            Route::post('/paiements', [PaiementController::class, 'store']);
            Route::get('/paiements/{paiement}', [PaiementController::class, 'show']);
            Route::post('/paiements/{paiement}/annuler', [PaiementController::class, 'annuler']);
            Route::get('/paiements/{paiement}/recu', [RecuController::class, 'generer']);
            Route::get('/eleves/{eleve}/solde', [PaiementController::class, 'solde']);

            Route::get('/enseignants', [EnseignantController::class, 'index']);
            Route::post('/enseignants', [EnseignantController::class, 'store']);
            Route::get('/enseignants/{enseignant}', [EnseignantController::class, 'show']);
            Route::patch('/enseignants/{enseignant}', [EnseignantController::class, 'update']);
            Route::post('/enseignants/{enseignant}/reinitialiser-mot-de-passe', [EnseignantController::class, 'reinitialiserMotDePasse']);

            Route::get('/comptes-direction', [CompteDirectionController::class, 'index']);
            Route::post('/comptes-direction', [CompteDirectionController::class, 'store']);
            Route::patch('/comptes-direction/{direction}', [CompteDirectionController::class, 'update']);

            Route::apiResource('categories-depenses', CategorieDepenseController::class)
                ->parameters(['categories-depenses' => 'categorieDepense'])->only(['index', 'store', 'update', 'destroy']);
            Route::get('/depenses', [DepenseController::class, 'index']);
            Route::post('/depenses', [DepenseController::class, 'store']);
            Route::post('/depenses/{depense}/annuler', [DepenseController::class, 'annuler']);
            Route::get('/rapport-financier', [RapportFinancierController::class, 'show']);

            Route::put('/parametres-ecole', [ParametreEcoleController::class, 'update']);
            Route::post('/parametres-ecole/logo', [ParametreEcoleController::class, 'uploaderLogo']);
            Route::get('/eleves/{eleve}/carte', [CarteScolaireController::class, 'generer']);
            Route::get('/classes/{classe}/cartes', [CarteScolaireController::class, 'genererClasse']);
        });
    });
});