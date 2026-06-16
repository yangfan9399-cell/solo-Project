<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\RecipeController;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('levels.index');
    }
    return view('welcome');
})->name('home');

Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
Route::post('/register', [AuthController::class, 'register']);
Route::get('/quick-play', [AuthController::class, 'showQuickPlay'])->name('quick-play');
Route::post('/quick-play', [AuthController::class, 'quickPlay']);
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

Route::middleware('auth')->group(function () {
    Route::get('/levels', [GameController::class, 'index'])->name('levels.index');
    Route::get('/levels/{level}', [GameController::class, 'showLevel'])->name('game.play');

    Route::post('/game/{level}/start', [GameController::class, 'startSession'])->name('game.start');
    Route::post('/game/session/{session}/add-material', [GameController::class, 'addMaterial'])->name('game.add-material');
    Route::post('/game/session/{session}/remove-material', [GameController::class, 'removeMaterial'])->name('game.remove-material');
    Route::post('/game/session/{session}/adjust-material', [GameController::class, 'adjustMaterial'])->name('game.adjust-material');
    Route::post('/game/session/{session}/reset', [GameController::class, 'resetRecipe'])->name('game.reset');
    Route::post('/game/session/{session}/undo', [GameController::class, 'undo'])->name('game.undo');
    Route::get('/game/session/{session}/history', [GameController::class, 'getHistory'])->name('game.history');
    Route::post('/game/session/{session}/submit', [GameController::class, 'submitAttempt'])->name('game.submit');
    Route::get('/game/session/{session}/result', [GameController::class, 'showResult'])->name('game.result');

    Route::get('/recipes', [RecipeController::class, 'index'])->name('recipes.index');
    Route::post('/recipes', [RecipeController::class, 'store'])->name('recipes.store');
    Route::get('/recipes/{recipe}', [RecipeController::class, 'show'])->name('recipes.show');
    Route::post('/recipes/{recipe}/share', [RecipeController::class, 'share'])->name('recipes.share');
    Route::delete('/recipes/{recipe}', [RecipeController::class, 'destroy'])->name('recipes.destroy');
    Route::post('/recipes/{recipe}/like', [RecipeController::class, 'like'])->name('recipes.like');
    Route::post('/recipes/{recipe}/use/{level}', [RecipeController::class, 'useRecipe'])->name('recipes.use');

    Route::get('/share/{code}', [RecipeController::class, 'showByCode'])->name('recipes.share-code');
    Route::post('/import-recipe', [RecipeController::class, 'importByCode'])->name('recipes.import');

    Route::post('/recipes/{recipe}/recalculate', [GameController::class, 'recalculateScore'])
        ->name('recipes.recalculate');
});
