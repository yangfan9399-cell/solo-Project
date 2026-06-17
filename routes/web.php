<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\BatchController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExportController;
use App\Http\Controllers\VersionController;

Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

Route::prefix('batches')->name('batches.')->group(function () {
    Route::get('/', [BatchController::class, 'index'])->name('index');
    Route::get('/create', [BatchController::class, 'create'])->name('create');
    Route::post('/', [BatchController::class, 'store'])->name('store');
    Route::get('/check/anomalies', [BatchController::class, 'checkAnomalies'])->name('check-anomalies');
    Route::get('/{batch}', [BatchController::class, 'show'])->name('show');
    Route::get('/{batch}/edit', [BatchController::class, 'edit'])->name('edit');
    Route::put('/{batch}', [BatchController::class, 'update'])->name('update');
    Route::delete('/{batch}', [BatchController::class, 'destroy'])->name('destroy');
    Route::get('/{batch}/anomalies', [BatchController::class, 'checkAnomalies'])->name('anomalies');
});

Route::prefix('batches/{batch}/versions')->name('versions.')->group(function () {
    Route::get('/', [VersionController::class, 'index'])->name('index');
    Route::get('/{version}', [VersionController::class, 'show'])->name('show');
    Route::get('/{version}/compare', [VersionController::class, 'compare'])->name('compare');
    Route::post('/{version}/restore', [VersionController::class, 'restore'])->name('restore');
});

Route::prefix('exports')->name('exports.')->group(function () {
    Route::get('/summary/excel', [ExportController::class, 'summaryExcel'])->name('summary.excel');
    Route::get('/summary/pdf', [ExportController::class, 'summaryPdf'])->name('summary.pdf');
    Route::get('/batch/{batch}/excel', [ExportController::class, 'batchExcel'])->name('batch.excel');
    Route::get('/batch/{batch}/pdf', [ExportController::class, 'batchPdf'])->name('batch.pdf');
});
