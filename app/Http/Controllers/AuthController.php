<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function showLogin()
    {
        return view('auth.login');
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();
            return redirect()->route('levels.index');
        }

        throw ValidationException::withMessages([
            'email' => '邮箱或密码错误。',
        ]);
    }

    public function showRegister()
    {
        return view('auth.register');
    }

    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        $defaultMaterials = \App\Models\Material::where('is_unlocked_by_default', true)->get();
        foreach ($defaultMaterials as $material) {
            \App\Models\UserMaterial::create([
                'user_id' => $user->id,
                'material_id' => $material->id,
                'unlocked_at' => now(),
            ]);
        }

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->route('levels.index');
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }

    public function showQuickPlay()
    {
        return view('auth.quick-play');
    }

    public function quickPlay(Request $request)
    {
        $data = $request->validate([
            'player_name' => 'required|string|max:50',
        ]);

        $email = strtolower($data['player_name']) . '@player.local';

        $user = User::where('email', $email)->first();

        if (!$user) {
            $user = User::create([
                'name' => $data['player_name'],
                'email' => $email,
                'password' => Hash::make(Str::random(16)),
            ]);

            $defaultMaterials = \App\Models\Material::where('is_unlocked_by_default', true)->get();
            foreach ($defaultMaterials as $material) {
                \App\Models\UserMaterial::create([
                    'user_id' => $user->id,
                    'material_id' => $material->id,
                    'unlocked_at' => now(),
                ]);
            }
        }

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->route('levels.index');
    }
}
