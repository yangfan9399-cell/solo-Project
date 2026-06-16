@extends('layouts.app')

@section('title', $level->title . ' - 案件详情')

@section('content')
<div class="max-w-4xl mx-auto">
    <div class="mb-6">
        <a href="{{ route('levels.index') }}" class="text-gray-400 hover:text-white transition">
            ← 返回案件列表
        </a>
    </div>

    <div class="bg-white/5 backdrop-blur rounded-xl border border-white/10 overflow-hidden">
        <div class="h-64 bg-gradient-to-br from-purple-600/40 to-pink-600/40 flex items-center justify-center text-9xl relative">
            {{ $level->id == 1 ? '🏰' : '🎨' }}
            <div class="absolute top-4 right-4 px-4 py-2 bg-black/50 backdrop-blur rounded-full text-yellow-400">
                {{ $level->difficultyStars() }} 难度
            </div>
        </div>

        <div class="p-8">
            <h1 class="text-4xl font-bold text-white mb-4">{{ $level->title }}</h1>
            <p class="text-gray-300 text-lg mb-6">{{ $level->description }}</p>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div class="bg-black/30 rounded-lg p-4 text-center">
                    <div class="text-3xl mb-1">🗂️</div>
                    <div class="text-2xl font-bold text-purple-400">{{ $clueCount }}</div>
                    <div class="text-sm text-gray-500">线索总数</div>
                </div>
                <div class="bg-black/30 rounded-lg p-4 text-center">
                    <div class="text-3xl mb-1">🔑</div>
                    <div class="text-2xl font-bold text-red-400">{{ $requiredCount }}</div>
                    <div class="text-sm text-gray-500">关键线索</div>
                </div>
                <div class="bg-black/30 rounded-lg p-4 text-center">
                    <div class="text-3xl mb-1">⏱️</div>
                    <div class="text-2xl font-bold text-blue-400">{{ $level->time_limit_minutes }}</div>
                    <div class="text-sm text-gray-500">时间限制</div>
                </div>
                <div class="bg-black/30 rounded-lg p-4 text-center">
                    <div class="text-3xl mb-1">⭐</div>
                    <div class="text-2xl font-bold text-yellow-400">{{ $level->max_score }}</div>
                    <div class="text-sm text-gray-500">最高积分</div>
                </div>
            </div>

            <div class="bg-black/30 rounded-lg p-6 mb-8">
                <h3 class="text-xl font-bold text-white mb-3 flex items-center space-x-2">
                    <span>📖</span>
                    <span>案件背景</span>
                </h3>
                <p class="text-gray-300 leading-relaxed whitespace-pre-line">{{ $level->story_intro }}</p>
            </div>

            <div class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 mb-8">
                <h3 class="text-lg font-bold text-yellow-400 mb-2 flex items-center space-x-2">
                    <span>💡</span>
                    <span>主持提示</span>
                </h3>
                <p class="text-gray-300 text-sm">
                    你需要找到至少 <span class="text-yellow-400 font-bold">{{ $level->required_clues_to_solve }}</span> 条关键线索才能提交答案。
                    注意提问的相关性，避免过度剧透。正确的推理方向将帮助你更快找到真相！
                </p>
            </div>

            <form action="{{ route('levels.start', $level) }}" method="POST">
                @csrf
                <button type="submit" class="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-bold text-xl transition">
                    🔍 开始调查此案
                </button>
            </form>
        </div>
    </div>
</div>
@endsection
