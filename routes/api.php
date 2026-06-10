<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\IssueController;
use App\Http\Controllers\StoreController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ProblemTypeController;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth');
Route::get('/me', [AuthController::class, 'me'])->middleware('auth');

Route::middleware('auth')->group(function () {
    Route::apiResource('/issues', IssueController::class);
    Route::post('/issues/{id}/assign', [IssueController::class, 'assign']);
    Route::post('/issues/{id}/rectify', [IssueController::class, 'rectify']);
    Route::post('/issues/{id}/upload-photos', [IssueController::class, 'uploadPhotos']);
    Route::post('/issues/{id}/review', [IssueController::class, 'review']);
    Route::post('/issues/{id}/close', [IssueController::class, 'close']);
    Route::post('/issues/{id}/reopen', [IssueController::class, 'reopen']);

    Route::apiResource('/stores', StoreController::class);

    Route::get('/dashboard/overview', [DashboardController::class, 'overview']);
    Route::get('/dashboard/by-region', [DashboardController::class, 'byRegion']);
    Route::get('/dashboard/by-level', [DashboardController::class, 'byLevel']);
    Route::get('/dashboard/by-problem-type', [DashboardController::class, 'byProblemType']);
    Route::get('/dashboard/recent-issues', [DashboardController::class, 'recentIssues']);

    Route::get('/users', [UserController::class, 'index']);
    Route::get('/problem-types', [ProblemTypeController::class, 'index']);
});