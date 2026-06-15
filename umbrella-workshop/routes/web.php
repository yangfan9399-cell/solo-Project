<?php

use App\Http\Controllers\GameController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::prefix('games')->name('games.')->group(function () {
    Route::get('/', [GameController::class, 'index'])->name('index');
    Route::get('/create', [GameController::class, 'create'])->name('create');
    Route::post('/', [GameController::class, 'store'])->name('store');
    Route::get('/{game}/workbench', [GameController::class, 'workbench'])->name('workbench');
    Route::post('/{game}/select-rib', [GameController::class, 'selectRib'])->name('select-rib');
    Route::post('/{game}/select-surface', [GameController::class, 'selectSurface'])->name('select-surface');
    Route::post('/{game}/select-paper', [GameController::class, 'selectPaper'])->name('select-paper');
    Route::post('/{game}/pasting-order', [GameController::class, 'setPastingOrder'])->name('pasting-order');
    Route::post('/{game}/drying-time', [GameController::class, 'setDryingTime'])->name('drying-time');
    Route::post('/{game}/finalize', [GameController::class, 'finalize'])->name('finalize');
    Route::get('/{game}', [GameController::class, 'show'])->name('show');
    Route::post('/{game}/rollback', [GameController::class, 'rollback'])->name('rollback');
    Route::get('/history/records', [GameController::class, 'history'])->name('history');
    Route::get('/inspections/records', [GameController::class, 'inspections'])->name('inspections');
});
