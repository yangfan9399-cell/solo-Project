@extends('layouts.app')

@section('title', '登录 - 胶水配比实验室')

@section('content')
<div class="max-w-md mx-auto">
    <div class="card p-8">
        <h2 class="text-2xl font-bold text-amber-900 mb-6 text-center">👤 登录账号</h2>

        <form method="POST" action="{{ route('login') }}">
            @csrf

            <div class="mb-4">
                <label class="block text-amber-800 mb-2 text-sm font-semibold">邮箱</label>
                <input type="email" name="email" required
                    class="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    value="{{ old('email') }}">
                @error('email')
                    <p class="text-red-500 text-sm mt-1">{{ $message }}</p>
                @enderror
            </div>

            <div class="mb-6">
                <label class="block text-amber-800 mb-2 text-sm font-semibold">密码</label>
                <input type="password" name="password" required
                    class="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
                @error('password')
                    <p class="text-red-500 text-sm mt-1">{{ $message }}</p>
                @enderror
            </div>

            <button type="submit" class="btn-primary w-full">登录</button>
        </form>

        <div class="mt-6 text-center text-sm text-amber-700">
            还没有账号？
            <a href="{{ route('register') }}" class="text-amber-900 font-semibold hover:underline">立即注册</a>
        </div>

        <div class="mt-4 text-center">
            <a href="{{ route('quick-play') }}" class="text-amber-600 text-sm hover:underline">
                或者直接快速开始 →
            </a>
        </div>

        <div class="mt-6 p-4 bg-amber-50 rounded-lg text-sm">
            <p class="text-amber-800 font-semibold mb-2">💡 演示账号</p>
            <p class="text-amber-700">邮箱: player@example.com</p>
            <p class="text-amber-700">密码: password123</p>
        </div>
    </div>
</div>
@endsection
