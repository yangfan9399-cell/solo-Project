<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GameController;
use App\Http\Controllers\PlayerController;

Route::get('/', function () {
    return redirect()->route('home');
});

Route::get('/home', [GameController::class, 'home'])->name('home');

Route::prefix('players')->name('players.')->group(function () {
    Route::get('/', [PlayerController::class, 'index'])->name('index');
    Route::get('/create', [PlayerController::class, 'create'])->name('create');
    Route::post('/', [PlayerController::class, 'store'])->name('store');
    Route::get('/select/{player}', [PlayerController::class, 'select'])->name('select');
    Route::post('/logout', [PlayerController::class, 'logout'])->name('logout');
    Route::get('/{player}', [PlayerController::class, 'show'])->name('show');
});

Route::prefix('levels')->name('levels.')->group(function () {
    Route::get('/', [GameController::class, 'levels'])->name('index');
    Route::get('/{level}', [GameController::class, 'showLevel'])->name('show');
    Route::post('/{level}/start', [GameController::class, 'startGame'])->name('start');
});

Route::prefix('games')->name('games.')->group(function () {
    Route::get('/{game}', [GameController::class, 'play'])->name('play');
    Route::get('/{game}/score-estimate', [GameController::class, 'scoreEstimate'])->name('score-estimate');
    Route::post('/{game}/distribute-clue', [GameController::class, 'distributeClue'])->name('distribute-clue');
    Route::post('/{game}/ask-question', [GameController::class, 'askQuestion'])->name('ask-question');
    Route::post('/{game}/advance-round', [GameController::class, 'advanceRound'])->name('advance-round');
    Route::post('/{game}/undo/{operation}', [GameController::class, 'undo'])->name('undo');
    Route::post('/{game}/solve', [GameController::class, 'submitSolve'])->name('solve');
    Route::post('/{game}/abandon', [GameController::class, 'abandon'])->name('abandon');
    Route::get('/{game}/result', [GameController::class, 'result'])->name('result');
});

