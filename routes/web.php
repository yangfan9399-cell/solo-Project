<?php

use App\Http\Controllers\CustomLevelController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\PlayerController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [PlayerController::class, 'dashboard'])->name('dashboard');
    Route::get('/profile', [PlayerController::class, 'profile'])->name('profile');

    Route::get('/custom-levels', [CustomLevelController::class, 'index'])->name('custom-levels.index');
    Route::get('/custom-levels/create', [CustomLevelController::class, 'create'])->name('custom-levels.create');
    Route::post('/custom-levels', [CustomLevelController::class, 'store'])->name('custom-levels.store');
    Route::post('/custom-levels/encrypt', [CustomLevelController::class, 'encrypt'])->name('custom-levels.encrypt');
    Route::get('/custom-levels/{level}', [CustomLevelController::class, 'show'])->name('custom-levels.show');
    Route::delete('/custom-levels/{level}', [CustomLevelController::class, 'destroy'])->name('custom-levels.destroy');

    Route::get('/game/{session}', [GameController::class, 'show'])->name('game.show');
    Route::post('/game/start/{level}', [GameController::class, 'start'])->name('game.start');
    Route::post('/game/{session}/rotor', [GameController::class, 'updateRotor'])->name('game.rotor');
    Route::post('/game/{session}/substitution', [GameController::class, 'updateSubstitution'])->name('game.substitution');
    Route::post('/game/{session}/caesar', [GameController::class, 'updateCaesar'])->name('game.caesar');
    Route::post('/game/{session}/vigenere', [GameController::class, 'updateVigenere'])->name('game.vigenere');
    Route::post('/game/{session}/note', [GameController::class, 'addNote'])->name('game.note');
    Route::post('/game/{session}/hint', [GameController::class, 'useHint'])->name('game.hint');
    Route::post('/game/{session}/undo', [GameController::class, 'undo'])->name('game.undo');
    Route::post('/game/{session}/submit', [GameController::class, 'submit'])->name('game.submit');
    Route::post('/game/{session}/abandon', [GameController::class, 'abandon'])->name('game.abandon');
    Route::get('/game/{session}/history', [GameController::class, 'history'])->name('game.history');
});

require __DIR__.'/auth.php';
