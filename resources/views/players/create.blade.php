@extends('layouts.app')

@section('title', '创建侦探档案')

@section('content')
<div class="max-w-2xl mx-auto">
    <div class="text-center mb-10">
        <div class="text-6xl mb-4">✨</div>
        <h1 class="text-4xl font-bold text-white mb-2">创建新侦探档案</h1>
        <p class="text-gray-400">开启你的推理之旅</p>
    </div>

    <div class="bg-white/5 backdrop-blur rounded-xl p-8 border border-white/10">
        <form action="{{ route('players.store') }}" method="POST">
            @csrf

            <div class="mb-6">
                <label class="block text-gray-300 font-medium mb-3">选择头像</label>
                <div class="grid grid-cols-10 gap-3">
                    @foreach($avatars as $avatar)
                        <label class="cursor-pointer">
                            <input type="radio" name="avatar" value="{{ $avatar }}" class="hidden peer" {{ $loop->first ? 'checked' : '' }}>
                            <div class="text-3xl p-2 rounded-lg bg-black/20 border-2 border-transparent peer-checked:border-purple-500 peer-checked:bg-purple-500/20 hover:bg-white/10 transition text-center">
                                {{ $avatar }}
                            </div>
                        </label>
                    @endforeach
                </div>
                @error('avatar')
                    <p class="text-red-400 text-sm mt-2">{{ $message }}</p>
                @enderror
            </div>

            <div class="mb-8">
                <label class="block text-gray-300 font-medium mb-2">侦探名称</label>
                <input type="text" name="name" value="{{ old('name') }}" placeholder="输入你的侦探代号..."
                    class="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition">
                @error('name')
                    <p class="text-red-400 text-sm mt-2">{{ $message }}</p>
                @enderror
            </div>

            <button type="submit" class="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-bold text-lg transition">
                🎭 创建档案并开始游戏
            </button>
        </form>

        <div class="mt-6 text-center">
            <a href="{{ route('players.index') }}" class="text-gray-400 hover:text-white transition">
                ← 返回选择已有档案
            </a>
        </div>
    </div>
</div>
@endsection
