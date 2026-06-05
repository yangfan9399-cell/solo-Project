<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DisposalController;
use App\Http\Controllers\InspectionController;
use App\Http\Controllers\ReinspectionController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\SampleController;
use Illuminate\Support\Facades\Route;

Route::get('login', [AuthController::class, 'loginForm'])->name('login');
Route::post('login', [AuthController::class, 'login']);
Route::post('logout', [AuthController::class, 'logout'])->name('logout');

Route::middleware('auth')->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    Route::resource('samples', SampleController::class);
    Route::post('samples/{sample}/update-source', [SampleController::class, 'updateSource'])->name('samples.update-source');
    Route::post('samples/{sample}/resolve-conflict', [SampleController::class, 'resolveConflict'])->name('samples.resolve-conflict');
    Route::get('check-sample-conflict', [SampleController::class, 'checkConflict'])->name('samples.check-conflict');

    Route::get('inspections', [InspectionController::class, 'index'])->name('inspections.index');
    Route::get('inspections/{sample}/create', [InspectionController::class, 'create'])->name('inspections.create');
    Route::post('inspections/{sample}', [InspectionController::class, 'store'])->name('inspections.store');
    Route::post('determine-result', [InspectionController::class, 'determineResult'])->name('inspections.determine-result');

    Route::get('disposals', [DisposalController::class, 'index'])->name('disposals.index');
    Route::get('disposals/{sample}/create', [DisposalController::class, 'create'])->name('disposals.create');
    Route::post('disposals/{sample}', [DisposalController::class, 'store'])->name('disposals.store');
    Route::post('disposals/{disposal}/approve', [DisposalController::class, 'approve'])->name('disposals.approve');
    Route::post('disposals/{disposal}/return', [DisposalController::class, 'return'])->name('disposals.return');
    Route::post('samples/{sample}/archive', [DisposalController::class, 'archive'])->name('samples.archive');

    Route::get('reinspections', [ReinspectionController::class, 'index'])->name('reinspections.index');
    Route::get('reinspections/{sample}/create', [ReinspectionController::class, 'create'])->name('reinspections.create');
    Route::post('reinspections/{sample}', [ReinspectionController::class, 'store'])->name('reinspections.store');
    Route::post('reinspections/{reinspectionRequest}/approve', [ReinspectionController::class, 'approve'])->name('reinspections.approve');
    Route::post('reinspections/{reinspectionRequest}/reject', [ReinspectionController::class, 'reject'])->name('reinspections.reject');

    Route::get('review', [ReviewController::class, 'index'])->name('review.index');
    Route::get('review/statistics', [ReviewController::class, 'statistics'])->name('review.statistics');
});
