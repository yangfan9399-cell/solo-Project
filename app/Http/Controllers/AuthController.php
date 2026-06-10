<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json(['error' => '登录失败'], 401);
        }

        $user = Auth::user();
        $request->session()->regenerate();

        return response()->json([
            'user' => $user,
            'message' => '登录成功',
        ]);
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return response()->json(['message' => '退出成功']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }
}