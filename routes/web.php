<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\WasteBatchController;
use App\Http\Controllers\TransferRequestController;
use App\Http\Controllers\ManifestFormController;
use App\Http\Controllers\ReviewController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return inertia('Welcome');
});

Route::get('/login', [LoginController::class, 'create'])->name('login');
Route::post('/login', [LoginController::class, 'store']);
Route::post('/logout', [LoginController::class, 'destroy'])->name('logout');

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::resource('waste-batches', WasteBatchController::class);

    Route::resource('transfer-requests', TransferRequestController::class);
    Route::post('/transfer-requests/{transferRequest}/update-carrier', [TransferRequestController::class, 'updateCarrier'])
        ->name('transfer-requests.update-carrier');

    Route::get('/transfer-requests/{transferRequest}/manifest/create', [ManifestFormController::class, 'create'])
        ->name('manifest-forms.create');
    Route::post('/manifest-forms', [ManifestFormController::class, 'store'])
        ->name('manifest-forms.store');
    Route::post('/manifest-forms/{manifestForm}/verify', [ManifestFormController::class, 'verify'])
        ->name('manifest-forms.verify');

    Route::post('/reviews', [ReviewController::class, 'store'])
        ->name('reviews.store');
});
