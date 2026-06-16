@extends('layouts.app')

@section('title', $player->name . ' - 侦探档案')

@section('content')
<div class="max-w-4xl mx-auto">
    <div class="bg-white/5 backdrop-blur rounded-xl p-8 border border-white/10 mb-8">
        <div class="flex items-center space-x-6 mb-6">
            <div class="text-7xl">{{ $player->avatar }}</div>
            <div>
                <h1 class="text-3xl font-bold text-white">{{ $player->name }}</h1>
                <p class="text-gray-400">资深侦探</p>
            </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-black/30 rounded-lg p-4 text-center">
                <div class="text-3xl font-bold text-yellow-400">{{ $player->total_score }}</div>
                <div class="text-sm text-gray-500">累计积分</div>
            </div>
            <div class="bg-black/30 rounded-lg p-4 text-center">
                <div class="text-3xl font-bold text-blue-400">{{ $player->games_played }}</div>
                <div class="text-sm text-gray-500">游戏场次</div>
            </div>
            <div class="bg-black/30 rounded-lg p-4 text-center">
                <div class="text-3xl font-bold text-green-400">{{ $player->games_won }}</div>
                <div class="text-sm text-gray-500">成功破案</div>
            </div>
            <div class="bg-black/30 rounded-lg p-4 text-center">
                <div class="text-3xl font-bold text-purple-400">{{ $player->winRate() }}%</div>
                <div class="text-sm text-gray-500">破案率</div>
            </div>
        </div>
    </div>

    <div>
        <h2 class="text-2xl font-bold text-white mb-4">最近游戏记录</h2>
        @if($recentGames->count() > 0)
            <div class="space-y-3">
                @foreach($recentGames as $game)
                    <div class="bg-white/5 backdrop-blur rounded-lg p-4 border border-white/10 flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                            <span class="text-3xl">{{ $game->level->id == 1 ? '🏰' : '🎨' }}</span>
                            <div>
                                <h3 class="font-semibold text-white">{{ $game->level->title }}</h3>
                                <p class="text-sm text-gray-500">{{ $game->created_at->format('Y-m-d H:i') }}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            @if($game->status == 'won')
                                <span class="text-green-400 font-bold">胜利</span>
                            @elseif($game->status == 'lost')
                                <span class="text-red-400 font-bold">失败</span>
                            @elseif($game->status == 'playing')
                                <span class="text-yellow-400 font-bold">进行中</span>
                            @else
                                <span class="text-gray-400">已放弃</span>
                            @endif
                            <div class="text-yellow-400 text-sm">{{ $game->score }} 分</div>
                        </div>
                    </div>
                @endforeach
            </div>
        @else
            <div class="bg-white/5 backdrop-blur rounded-lg p-8 border border-white/10 text-center text-gray-500">
                暂无游戏记录
            </div>
        @endif
    </div>

    <div class="mt-8">
        <a href="{{ route('players.index') }}" class="text-gray-400 hover:text-white transition">
            ← 返回档案列表
        </a>
    </div>
</div>
@endsection
