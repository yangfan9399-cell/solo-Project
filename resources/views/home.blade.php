@extends('layouts.app')

@section('title', '侦探主页 - 剧本杀主持工具')

@section('content')
<div class="space-y-8">
    <div class="text-center py-8">
        <div class="text-6xl mb-4">🕵️‍♂️</div>
        <h1 class="text-4xl font-bold text-white mb-2">欢迎回来，{{ $player->name }} {{ $player->avatar }}</h1>
        <p class="text-gray-400 text-lg">准备好揭开下一个案件的真相了吗？</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
            <div class="text-4xl mb-3">🏆</div>
            <div class="text-3xl font-bold text-yellow-400">{{ $player->total_score }}</div>
            <div class="text-gray-400">累计积分</div>
        </div>
        <div class="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
            <div class="text-4xl mb-3">🎮</div>
            <div class="text-3xl font-bold text-blue-400">{{ $player->games_played }}</div>
            <div class="text-gray-400">游戏总局数</div>
        </div>
        <div class="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
            <div class="text-4xl mb-3">✅</div>
            <div class="text-3xl font-bold text-green-400">{{ $player->winRate() }}%</div>
            <div class="text-gray-400">破案率</div>
        </div>
    </div>

    @if($activeGames->count() > 0)
        <div>
            <h2 class="text-2xl font-bold text-white mb-4 flex items-center space-x-2">
                <span>⏸️</span>
                <span>进行中的游戏</span>
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                @foreach($activeGames as $game)
                    <div class="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur rounded-xl p-6 border border-purple-500/30 hover:border-purple-400/50 transition">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <h3 class="text-xl font-bold text-white">{{ $game->level->title }}</h3>
                                <p class="text-gray-400 text-sm">第 {{ $game->current_round }} 轮 · 已发放 {{ $game->clues_distributed }} 条线索</p>
                            </div>
                            <span class="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">进行中</span>
                        </div>
                        <div class="flex space-x-3">
                            <a href="{{ route('games.play', $game) }}" class="flex-1 text-center py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium">
                                继续游戏
                            </a>
                            <form action="{{ route('games.abandon', $game) }}" method="POST" onsubmit="return confirm('确定要放弃这局游戏吗？');">
                                @csrf
                                <button type="submit" class="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition">
                                    放弃
                                </button>
                            </form>
                        </div>
                    </div>
                @endforeach
            </div>
        </div>
    @endif

    <div>
        <h2 class="text-2xl font-bold text-white mb-4 flex items-center space-x-2">
            <span>📚</span>
            <span>选择案件</span>
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            @foreach($levels as $level)
                <div class="bg-white/5 backdrop-blur rounded-xl border border-white/10 overflow-hidden hover:border-purple-500/50 transition group">
                    <div class="h-48 bg-gradient-to-br from-purple-600/30 to-pink-600/30 flex items-center justify-center text-7xl">
                        {{ $level->id == 1 ? '🏰' : '🎨' }}
                    </div>
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="text-xl font-bold text-white">{{ $level->title }}</h3>
                            <span class="text-yellow-400">{{ $level->difficultyStars() }}</span>
                        </div>
                        <p class="text-gray-400 mb-4 line-clamp-2">{{ $level->description }}</p>
                        <div class="flex items-center justify-between text-sm text-gray-500 mb-4">
                            <span>🗂️ {{ $level->clue_cards_count }} 条线索</span>
                            <span>⏱️ {{ $level->time_limit_minutes }} 分钟</span>
                            <span>🎯 {{ $level->required_clues_to_solve }} 关键线索</span>
                        </div>
                        <form action="{{ route('levels.start', $level) }}" method="POST">
                            @csrf
                            <button type="submit" class="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-semibold transition transform group-hover:scale-[1.02]">
                                开始调查
                            </button>
                        </form>
                    </div>
                </div>
            @endforeach
        </div>
    </div>
</div>
@endsection
