<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class SetAuthUser
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->has('user')) {
            $user = \App\Models\User::find($request->query('user'));
            if ($user) {
                Auth::login($user);
            }
        }
        if (!Auth::check()) {
            $user = \App\Models\User::first();
            if ($user) {
                Auth::login($user);
            }
        }
        return $next($request);
    }
}
