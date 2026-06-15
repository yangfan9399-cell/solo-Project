<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DrumTuningController;

Route::get('/', function () {
    return redirect()->route('drum-tuning.index');
});

Route::prefix('drum-tuning')->name('drum-tuning.')->group(function () {
    Route::get('/', [DrumTuningController::class, 'index'])->name('index');
    Route::get('/create', [DrumTuningController::class, 'create'])->name('create');
    Route::post('/', [DrumTuningController::class, 'store'])->name('store');
    Route::get('/{id}', [DrumTuningController::class, 'show'])->name('show');
    Route::get('/{id}/edit', [DrumTuningController::class, 'edit'])->name('edit');
    Route::put('/{id}', [DrumTuningController::class, 'update'])->name('update');
    
    Route::post('/{id}/tension', [DrumTuningController::class, 'addTension'])->name('tension.add');
    Route::post('/{id}/result', [DrumTuningController::class, 'addResult'])->name('result.add');
    
    Route::post('/{id}/tension-table', [DrumTuningController::class, 'generateTensionTable'])->name('tension-table.generate');
    Route::post('/{id}/tension-table/rollback', [DrumTuningController::class, 'rollbackTensionTable'])->name('tension-table.rollback');
    Route::post('/{id}/tension-table/recalculate', [DrumTuningController::class, 'recalculateTensionTable'])->name('tension-table.recalculate');
    
    Route::get('/{id}/export', [DrumTuningController::class, 'exportRecord'])->name('export');
});

Route::prefix('comparisons')->name('comparison.')->group(function () {
    Route::get('/', [DrumTuningController::class, 'comparisonIndex'])->name('index');
    Route::post('/create', [DrumTuningController::class, 'comparisonCreate'])->name('create');
    Route::get('/{id}', [DrumTuningController::class, 'comparisonShow'])->name('show');
    Route::get('/{id}/export', [DrumTuningController::class, 'exportComparison'])->name('export');
});
