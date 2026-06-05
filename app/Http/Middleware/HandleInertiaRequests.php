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
            'home' => route('home'),
            'login' => route('login'),
            'logout' => route('logout'),
            'dashboard' => route('dashboard'),
            'waste-batches' => [
                'index' => route('waste-batches.index'),
                'create' => route('waste-batches.create'),
                'store' => route('waste-batches.store'),
                'show' => str_replace('_ID_', ':id', route('waste-batches.show', '_ID_')),
            ],
            'transfer-requests' => [
                'index' => route('transfer-requests.index'),
                'create' => route('transfer-requests.create'),
                'store' => route('transfer-requests.store'),
                'show' => str_replace('_ID_', ':id', route('transfer-requests.show', '_ID_')),
                'update-carrier' => str_replace('_ID_', ':id', route('transfer-requests.update-carrier', '_ID_')),
            ],
            'manifest-forms' => [
                'create' => str_replace('_ID_', ':id', route('manifest-forms.create', ['transferRequest' => '_ID_'])),
                'store' => route('manifest-forms.store'),
                'verify' => str_replace('_ID_', ':id', route('manifest-forms.verify', '_ID_')),
            ],
            'reviews' => [
                'store' => route('reviews.store'),
            ],
        ];
    }
}
