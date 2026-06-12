<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InspectionRecordController;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

Route::get('/login/{role?}', function ($role = 'business_specialist') {
    $user = User::where('role', $role)->first();
    if (!$user) {
        $user = User::first();
    }
    Auth::login($user);
    return redirect()->route('dashboard');
})->name('login');

Route::get('/logout', function () {
    Auth::logout();
    return redirect()->route('login');
})->name('logout');

Route::middleware('auth')->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard/drilldown', [DashboardController::class, 'drilldown'])->name('dashboard.drilldown');

    Route::get('/records', [InspectionRecordController::class, 'index'])->name('records.index');
    Route::get('/records/{record}', [InspectionRecordController::class, 'show'])->name('records.show');
    Route::get('/records/{record}/handle', [InspectionRecordController::class, 'handle'])->name('records.handle');

    Route::put('/records/{record}', [InspectionRecordController::class, 'update'])->name('records.update');
    Route::post('/records/{record}/supplement', [InspectionRecordController::class, 'addSupplement'])->name('records.supplement');
    Route::post('/records/{record}/attachment', [InspectionRecordController::class, 'addAttachment'])->name('records.attachment');
    Route::post('/records/{record}/submit', [InspectionRecordController::class, 'submitReview'])->name('records.submit');
    Route::post('/records/{record}/approve', [InspectionRecordController::class, 'approve'])->name('records.approve');
    Route::post('/records/{record}/reopen', [InspectionRecordController::class, 'reopen'])->name('records.reopen');
    Route::post('/records/{record}/abnormal/{abnormal}/resolve', [InspectionRecordController::class, 'resolveAbnormal'])->name('records.abnormal.resolve');
});
