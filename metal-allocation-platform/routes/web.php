<?php

use App\Http\Controllers\AllocationController;
use App\Http\Controllers\AppealController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ReviewController;
use App\Http\Middleware\SetAuthUser;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', SetAuthUser::class])->group(function () {

    Route::get('/', fn () => redirect()->route('allocations.index'));

    Route::resource('allocations', AllocationController::class)->only(['index', 'show']);

    Route::get('allocations/{allocation}/process', [AllocationController::class, 'process'])->name('allocations.process');

    Route::post('allocations/{allocation}/accept', [AllocationController::class, 'accept'])->name('allocations.accept')
        ->middleware('role:business_specialist');

    Route::post('allocations/{allocation}/complete-process', [AllocationController::class, 'completeProcess'])->name('allocations.complete-process')
        ->middleware('role:business_specialist');

    Route::post('allocations/{allocation}/attachments', [AllocationController::class, 'uploadAttachment'])->name('allocations.attachments')
        ->middleware('role:business_specialist');

    Route::post('allocations/{allocation}/notes', [AllocationController::class, 'addNote'])->name('allocations.notes')
        ->middleware('role:business_specialist');

    Route::post('allocations/{allocation}/confirm', [ReviewController::class, 'confirm'])->name('allocations.confirm')
        ->middleware('role:approval_manager');
    Route::post('allocations/{allocation}/return', [ReviewController::class, 'returnForSupplement'])->name('allocations.return')
        ->middleware('role:approval_manager');
    Route::post('allocations/{allocation}/archive-readonly', [ReviewController::class, 'archiveReadOnly'])->name('allocations.archive-readonly')
        ->middleware('role:approval_manager');

    Route::post('allocations/{allocation}/appeal', [AppealController::class, 'submit'])->name('allocations.appeal')
        ->middleware('role:business_specialist');
    Route::post('allocations/{allocation}/handle-appeal', [AppealController::class, 'handle'])->name('allocations.handle-appeal')
        ->middleware('role:approval_manager');

    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard.index');
    Route::get('dashboard/drill-down', [DashboardController::class, 'drillDown'])->name('dashboard.drill-down');

    Route::get('login', [AuthController::class, 'loginPage'])->name('login');
    Route::post('login', [AuthController::class, 'login'])->name('login.post');
    Route::post('logout', [AuthController::class, 'logout'])->name('logout');

    Route::post('switch-role', function (\Illuminate\Http\Request $request) {
        $user = \App\Models\User::where('role', $request->input('role'))->first();
        if ($user) {
            \Illuminate\Support\Facades\Auth::login($user);
        }
        return back();
    })->name('switch-role');
});
