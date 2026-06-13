<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ReviewRecordController;
use App\Http\Controllers\DashboardController;

Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login'])->name('login.post');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

Route::middleware('auth')->group(function () {
    Route::get('/', function () {
        return redirect()->route('review.index');
    });

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard.index');
    Route::get('/api/statistics', [DashboardController::class, 'apiStatistics'])->name('api.statistics');

    Route::get('/review', [ReviewRecordController::class, 'index'])->name('review.index');
    Route::post('/review', [ReviewRecordController::class, 'store'])->name('review.store');
    Route::get('/review/{record}', [ReviewRecordController::class, 'show'])->name('review.show');
    Route::post('/review/{record}/process', [ReviewRecordController::class, 'process'])->name('review.process');
    Route::post('/review/{record}/review', [ReviewRecordController::class, 'review'])->name('review.review');
    Route::post('/review/{record}/reopen', [ReviewRecordController::class, 'reopen'])->name('review.reopen');

    Route::get('/api/review', [ReviewRecordController::class, 'apiList'])->name('api.review.list');
    Route::get('/api/review/{record}', [ReviewRecordController::class, 'apiDetail'])->name('api.review.detail');
});
