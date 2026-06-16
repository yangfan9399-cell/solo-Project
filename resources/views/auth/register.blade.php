@extends('layouts.app')

@section('title', '注册 - 胶水配比实验室')

@section('content')
<div class="max-w-md mx-auto">
    <div class="card p-8">
        <h2 class="text-2xl font-bold text-amber-900 mb-6 text-center">📝 创建账号</h2>

        <form method="POST" action="{{ route('register') }}">
            @csrf

            <div class="mb-4">
                <label class="block text-amber-800 mb-2 text-sm font-semibold">昵称</label>
                <input type="text" name="name" required
                    class="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    value="{{ old('name') }}">
                @error('name')
                    <p class="text-red-500 text-sm mt-1">{{ $message }}</p>
                @enderror
            </div>

            <div class="mb-4">
                <label class="block text-amber-800 mb-2 text-sm font-semibold">邮箱</label>
                <input type="email" name="email" required
                    class="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    value="{{ old('email') }}">
                @error('email')
                    <p class="text-red-500 text-sm mt-1">{{ $message }}</p>
                @enderror
            </div>

            <div class="mb-4">
                <label class="block text-amber-800 mb-2 text-sm font-semibold">密码</label>
                <input type="password" name="password" required minlength="6"
                    class="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
                @error('password')
                    <p class="text-red-500 text-sm mt-1">{{ $message }}</p>
                @enderror
            </div>

            <div class="mb-6">
                <label class="block text-amber-800 mb-2 text-sm font-semibold">确认密码</label>
                <input type="password" name="password_confirmation" required minlength="6"
                    class="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
            </div>

            <button type="submit" class="btn-primary w-full">注册</button>
        </form>

        <div class="mt-6 text-center text-sm text-amber-700">
            已有账号？
            <a href="{{ route('login') }}" class="text-amber-900 font-semibold hover:underline">立即登录</a>
        </div>

        <div class="mt-4 text-center">
            <a href="{{ route('quick-play') }}" class="text-amber-600 text-sm hover:underline">
                或者直接快速开始 →
            </a>
        </div>
    </div>
</div>
@endsection
