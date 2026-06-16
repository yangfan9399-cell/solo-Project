@extends('layouts.app')

@section('title', '关卡库 - 剧本杀主持工具')

@section('content')
<div class="space-y-8">
    <div class="text-center">
        <h1 class="text-4xl font-bold text-white mb-2">🗂️ 案件档案库</h1>
        <p class="text-gray-400">选择一个案件开始你的调查</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        @foreach($levels as $level)
            <div class="bg-white/5 backdrop-blur rounded-xl border border-white/10 overflow-hidden hover:border-purple-500/50 transition group">
                <div class="h-56 bg-gradient-to-br from-purple-600/40 to-pink-600/40 flex items-center justify-center text-8xl relative">
                    {{ $level->id == 1 ? '🏰' : '🎨' }}
                    <div class="absolute top-4 right-4 flex space-x-2">
                        <span class="px-3 py-1 bg-black/50 backdrop-blur rounded-full text-yellow-400 text-sm">
                            {{ $level->difficultyStars() }}
                        </span>
                        <span class="px-3 py-1 bg-black/50 backdrop-blur rounded-full text-white text-sm">
                            Lv.{{ $level->id }}
                        </span>
                    </div>
                </div>
                <div class="p-6">
                    <h3 class="text-2xl font-bold text-white mb-2">{{ $level->title }}</h3>
                    <p class="text-gray-400 mb-4">{{ $level->description }}</p>

                    <div class="grid grid-cols-4 gap-3 mb-6 text-center">
                        <div class="bg-black/30 rounded-lg p-3">
                            <div class="text-xl font-bold text-purple-400">{{ $level->clue_cards_count }}</div>
                            <div class="text-xs text-gray-500">总线索</div>
                        </div>
                        <div class="bg-black/30 rounded-lg p-3">
                            <div class="text-xl font-bold text-red-400">{{ $level->required_clues_count }}</div>
                            <div class="text-xs text-gray-500">关键线索</div>
                        </div>
                        <div class="bg-black/30 rounded-lg p-3">
                            <div class="text-xl font-bold text-blue-400">{{ $level->time_limit_minutes }}</div>
                            <div class="text-xs text-gray-500">分钟限时</div>
                        </div>
                        <div class="bg-black/30 rounded-lg p-3">
                            <div class="text-xl font-bold text-yellow-400">{{ $level->max_score }}</div>
                            <div class="text-xs text-gray-500">最高积分</div>
                        </div>
                    </div>

                    <div class="flex space-x-3">
                        <a href="{{ route('levels.show', $level) }}" class="flex-1 py-3 text-center bg-white/10 hover:bg-white/20 text-white rounded-lg transition font-medium">
                            查看详情
                        </a>
                        <form action="{{ route('levels.start', $level) }}" method="POST" class="flex-1">
                            @csrf
                            <button type="submit" class="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-semibold transition">
                                开始调查
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        @endforeach
    </div>
</div>
@endsection
