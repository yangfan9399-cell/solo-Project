<?php

use App\Http\Controllers\GameController;
use App\Http\Controllers\PlayerController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [PlayerController::class, 'dashboard'])->name('dashboard');
    Route::get('/profile', [PlayerController::class, 'profile'])->name('profile');

    Route::get('/game/{session}', [GameController::class, 'show'])->name('game.show');
    Route::post('/game/start/{level}', [GameController::class, 'start'])->name('game.start');
    Route::post('/game/{session}/rotor', [GameController::class, 'updateRotor'])->name('game.rotor');
    Route::post('/game/{session}/substitution', [GameController::class, 'updateSubstitution'])->name('game.substitution');
    Route::post('/game/{session}/note', [GameController::class, 'addNote'])->name('game.note');
    Route::post('/game/{session}/hint', [GameController::class, 'useHint'])->name('game.hint');
    Route::post('/game/{session}/undo', [GameController::class, 'undo'])->name('game.undo');
    Route::post('/game/{session}/submit', [GameController::class, 'submit'])->name('game.submit');
    Route::post('/game/{session}/abandon', [GameController::class, 'abandon'])->name('game.abandon');
    Route::get('/game/{session}/history', [GameController::class, 'history'])->name('game.history');
});

require __DIR__.'/auth.php';
