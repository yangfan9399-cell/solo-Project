<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->routes(function () {
            Route::middleware('web')
                ->group(base_path('routes/web.php'));
        });
    }

    public function register(): void
    {
        $this->app->singleton('routes', function () {
            return collect([
                'login' => url('/login'),
                'logout' => url('/logout'),
                'dashboard' => url('/dashboard'),
                'waste-batches.index' => url('/waste-batches'),
                'waste-batches.create' => url('/waste-batches/create'),
                'waste-batches.store' => url('/waste-batches'),
                'waste-batches.show' => function ($id) { return url("/waste-batches/{$id}"); },
                'transfer-requests.index' => url('/transfer-requests'),
                'transfer-requests.create' => url('/transfer-requests/create'),
                'transfer-requests.store' => url('/transfer-requests'),
                'transfer-requests.show' => function ($id) { return url("/transfer-requests/{$id}"); },
                'transfer-requests.update-carrier' => function ($id) { return url("/transfer-requests/{$id}/update-carrier"); },
                'manifest-forms.create' => function ($id) { return url("/transfer-requests/{$id}/manifest/create"); },
                'manifest-forms.store' => url('/manifest-forms'),
                'manifest-forms.verify' => function ($id) { return url("/manifest-forms/{$id}/verify"); },
                'reviews.store' => url('/reviews'),
            ]);
        });
    }
}
