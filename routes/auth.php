<?php

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

Route::get('/login/{userId?}', function ($userId = null) {
    if ($userId) {
        $user = User::find($userId);
        if ($user) {
            Auth::login($user);
        }
    } else {
        $user = User::first();
        if ($user) {
            Auth::login($user);
        }
    }
    return redirect()->route('dashboard');
})->name('login');

Route::post('/logout', function () {
    Auth::logout();
    return redirect()->route('dashboard');
})->name('logout');

Route::get('/switch-role', function () {
    $users = User::all();
    return view('switch-role', ['users' => $users, 'current' => Auth::user()]);
})->name('switch-role');
