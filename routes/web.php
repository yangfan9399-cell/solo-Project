<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthenticatedSessionController;

Route::get('/', function () {
    return inertia('Login');
})->name('login');

Route::get('/dashboard', function () {
    return inertia('Dashboard');
})->name('dashboard')->middleware('auth');