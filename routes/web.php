<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GameController;

Route::get('/', [GameController::class, 'index'])->name('game.index');
Route::post('/game/create', [GameController::class, 'create'])->name('game.create');
Route::get('/game/{session}', [GameController::class, 'show'])->name('game.show');
Route::post('/game/{session}/probe', [GameController::class, 'probe'])->name('game.probe');
Route::post('/game/{session}/move', [GameController::class, 'move'])->name('game.move');
Route::post('/game/{session}/rollback', [GameController::class, 'rollback'])->name('game.rollback');
Route::post('/game/{session}/end', [GameController::class, 'end'])->name('game.end');
Route::get('/game/{session}/result', [GameController::class, 'result'])->name('game.result');
Route::get('/game/{session}/map-data', [GameController::class, 'getMapData'])->name('game.map-data');
