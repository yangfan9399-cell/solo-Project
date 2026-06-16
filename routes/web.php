<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GameController;

Route::get('/', [GameController::class, 'index'])->name('game.index');
Route::post('/player/select', [GameController::class, 'selectPlayer'])->name('player.select');

Route::get('/play', [GameController::class, 'play'])->name('game.play');
Route::get('/resume', [GameController::class, 'resume'])->name('game.resume');
Route::post('/game/start/{level}', [GameController::class, 'startGame'])->name('game.start');
Route::post('/game/{session}/move', [GameController::class, 'moveBox'])->name('game.move');
Route::post('/game/{session}/undo', [GameController::class, 'undo'])->name('game.undo');
Route::post('/game/{session}/submit', [GameController::class, 'submitReport'])->name('game.submit');
Route::get('/game/{session}/state', [GameController::class, 'gameState'])->name('game.state');
Route::get('/history', [GameController::class, 'history'])->name('game.history');
