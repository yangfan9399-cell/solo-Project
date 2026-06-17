<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PlateController;

Route::get('/', [PlateController::class, 'dashboard'])->name('dashboard');

Route::prefix('plates')->name('plates.')->group(function () {
    Route::get('/', [PlateController::class, 'index'])->name('index');
    Route::get('/create', [PlateController::class, 'create'])->name('create');
    Route::post('/', [PlateController::class, 'store'])->name('store');
    Route::get('/export', [PlateController::class, 'export'])->name('export');
    Route::get('/{plate}', [PlateController::class, 'show'])->name('show');
    Route::get('/{plate}/edit', [PlateController::class, 'edit'])->name('edit');
    Route::put('/{plate}', [PlateController::class, 'update'])->name('update');
    Route::delete('/{plate}', [PlateController::class, 'destroy'])->name('destroy');
    Route::get('/{plate}/versions', [PlateController::class, 'versionHistory'])->name('versions');
    Route::get('/{plate}/compare', [PlateController::class, 'compareVersions'])->name('compare');
    Route::post('/{plate}/usage', [PlateController::class, 'recordUsage'])->name('usage');
    Route::post('/{plate}/orders', [PlateController::class, 'addOrder'])->name('orders.store');
    Route::post('/{plate}/maintenances', [PlateController::class, 'addMaintenance'])->name('maintenances.store');
    Route::post('/{plate}/status', [PlateController::class, 'changeStatus'])->name('status');
});

Route::put('/orders/{order}/status', [PlateController::class, 'updateOrderStatus'])->name('orders.status');
Route::get('/review', [PlateController::class, 'review'])->name('review');
