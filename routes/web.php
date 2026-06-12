<?php

use App\Http\Controllers\ToolCaseController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('dashboard');
});

Route::get('/dashboard', [ToolCaseController::class, 'dashboard'])->name('dashboard');
Route::get('/cases', [ToolCaseController::class, 'index'])->name('cases.index');
Route::get('/cases/{toolCase}', [ToolCaseController::class, 'show'])->name('cases.show');
Route::get('/cases/{toolCase}/review', [ToolCaseController::class, 'review'])->name('cases.review');
Route::put('/cases/{toolCase}/clerk', [ToolCaseController::class, 'updateClerk'])->name('cases.update-clerk');
Route::post('/cases/{toolCase}/approve', [ToolCaseController::class, 'approve'])->name('cases.approve');
Route::post('/cases/{toolCase}/reopen', [ToolCaseController::class, 'reopen'])->name('cases.reopen');

require __DIR__.'/auth.php';
