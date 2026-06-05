<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'role' => $request->user()->role,
                    'role_label' => $request->user()->role_label,
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'routes' => $this->getNamedRoutes(),
            'app_url' => config('app.url'),
        ]);
    }

    private function getNamedRoutes(): array
    {
        return [
            'home' => '/',
            'login' => '/login',
            'logout' => '/logout',
            'dashboard' => '/dashboard',
            'waste-batches' => [
                'index' => '/waste-batches',
                'create' => '/waste-batches/create',
                'store' => '/waste-batches',
                'show' => '/waste-batches/:id',
            ],
            'transfer-requests' => [
                'index' => '/transfer-requests',
                'create' => '/transfer-requests/create',
                'store' => '/transfer-requests',
                'show' => '/transfer-requests/:id',
                'update-carrier' => '/transfer-requests/:id/update-carrier',
            ],
            'manifest-forms' => [
                'create' => '/transfer-requests/:id/manifest/create',
                'store' => '/manifest-forms',
                'verify' => '/manifest-forms/:id/verify',
            ],
            'reviews' => [
                'store' => '/reviews',
            ],
        ];
    }
}
