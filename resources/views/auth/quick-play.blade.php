@extends('layouts.app')

@section('title', '快速开始 - 胶水配比实验室')

@section('content')
<div class="max-w-md mx-auto">
    <div class="card p-8">
        <h2 class="text-2xl font-bold text-amber-900 mb-2 text-center">🚀 快速开始</h2>
        <p class="text-amber-600 text-center mb-6 text-sm">
            输入昵称即可开始游戏，无需注册！
        </p>

        <form method="POST" action="{{ route('quick-play') }}">
            @csrf

            <div class="mb-6">
                <label class="block text-amber-800 mb-2 text-sm font-semibold">你的昵称</label>
                <input type="text" name="player_name" required maxlength="50"
                    class="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-lg"
                    placeholder="例如：胶水小能手"
                    value="{{ old('player_name') }}">
                @error('player_name')
                    <p class="text-red-500 text-sm mt-1">{{ $message }}</p>
                @enderror
            </div>

            <button type="submit" class="btn-primary w-full text-lg py-3">
                开始游戏 🎮
            </button>
        </form>

        <div class="mt-6 pt-6 border-t border-amber-200 text-center text-sm">
            <p class="text-amber-600 mb-3">想要保存进度？</p>
            <div class="flex justify-center gap-4">
                <a href="{{ route('login') }}" class="text-amber-900 font-semibold hover:underline">登录</a>
                <span class="text-amber-300">|</span>
                <a href="{{ route('register') }}" class="text-amber-900 font-semibold hover:underline">注册账号</a>
            </div>
        </div>

        <div class="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg">
            <p class="text-amber-800 text-sm text-center">
                💡 <strong>提示：</strong>快速开始的账号也会保留游戏进度，
                建议使用你喜欢的昵称！
            </p>
        </div>
    </div>
</div>
@endsection
