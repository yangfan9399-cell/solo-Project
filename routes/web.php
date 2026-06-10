<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DecorationController;

Route::get('/', [DecorationController::class, 'index'])->name('dashboard');
Route::get('/applications', [DecorationController::class, 'applications'])->name('applications');
Route::get('/applications/{id}', [DecorationController::class, 'show'])->name('application.show');
Route::post('/applications', [DecorationController::class, 'store'])->name('applications.store');
Route::put('/applications/{id}/engineer-review', [DecorationController::class, 'engineerReview'])->name('applications.engineer-review');
Route::put('/applications/{id}/fire-review', [DecorationController::class, 'fireReview'])->name('applications.fire-review');
Route::put('/applications/{id}/manager-approval', [DecorationController::class, 'managerApproval'])->name('applications.manager-approval');
Route::delete('/applications/{id}', [DecorationController::class, 'destroy'])->name('applications.destroy');
Route::get('/kanban', [DecorationController::class, 'kanban'])->name('kanban');
