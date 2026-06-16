@extends('layouts.app')

@section('title', $game->isWin() ? '🎉 破案成功' : '😔 推理失败')

@section('content')
<div class="max-w-4xl mx-auto space-y-8">
    <div class="text-center py-8">
        @if($game->isWin())
            <div class="text-8xl mb-4">🎉</div>
            <h1 class="text-5xl font-bold text-green-400 mb-2">破案成功！</h1>
            <p class="text-gray-400 text-xl">出色的推理，侦探！</p>
        @elseif($game->status === 'lost')
            <div class="text-8xl mb-4">😔</div>
            <h1 class="text-5xl font-bold text-red-400 mb-2">推理失败</h1>
            <p class="text-gray-400 text-xl">真相尚未被揭开...</p>
        @else
            <div class="text-8xl mb-4">🏳️</div>
            <h1 class="text-5xl font-bold text-gray-400 mb-2">已放弃</h1>
            <p class="text-gray-400 text-xl">这局游戏提前结束了</p>
        @endif
    </div>

    <div class="bg-white/5 backdrop-blur rounded-xl p-8 border border-white/10">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div class="text-center">
                <div class="text-6xl mb-2">🏆</div>
                <div class="text-4xl font-bold text-yellow-400">{{ $game->score }}</div>
                <div class="text-gray-500">最终得分</div>
            </div>
            <div class="text-center">
                <div class="text-6xl mb-2">🔑</div>
                <div class="text-4xl font-bold text-purple-400">{{ $distributedClues->where('is_required', true)->count() }}/{{ $level->requiredClues->count() }}</div>
                <div class="text-gray-500">关键线索</div>
            </div>
            <div class="text-center">
                <div class="text-6xl mb-2">❓</div>
                <div class="text-4xl font-bold text-blue-400">{{ $relevantQuestions }}/{{ $totalQuestions }}</div>
                <div class="text-gray-500">相关提问</div>
            </div>
            <div class="text-center">
                <div class="text-6xl mb-2">⏱️</div>
                <div class="text-4xl font-bold text-green-400">
                    @if($game->started_at && $game->ended_at)
                        {{ $game->started_at->diffInMinutes($game->ended_at) }}
                    @else
                        0
                    @endif
                </div>
                <div class="text-gray-500">用时(分钟)</div>
            </div>
        </div>

        <div class="bg-black/30 rounded-xl p-6 mb-8">
            <h2 class="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                <span>📋</span>
                <span>案件结案报告</span>
            </h2>
            <div class="text-gray-300 whitespace-pre-line leading-relaxed">
                {{ $game->final_analysis }}
            </div>
        </div>

        @if($missedClues->count() > 0)
            <div class="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-8">
                <h2 class="text-xl font-bold text-red-400 mb-4 flex items-center space-x-2">
                    <span>⚠️</span>
                    <span>遗漏的关键线索 ({{ $missedClues->count() }})</span>
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    @foreach($missedClues as $clue)
                        <div class="bg-black/30 rounded-lg p-4 border border-red-500/20">
                            <div class="flex items-start space-x-3">
                                <span class="text-3xl">{{ $clue->icon }}</span>
                                <div class="flex-1">
                                    <h3 class="font-bold text-white">{{ $clue->title }}</h3>
                                    <p class="text-xs text-gray-500 mb-2">{{ $clue->getCategoryLabel() }}</p>
                                    <p class="text-gray-400 text-sm">{{ $clue->content }}</p>
                                </div>
                            </div>
                        </div>
                    @endforeach
                </div>
            </div>
        @endif

        @if($distributedClues->where('is_required', true)->count() > 0)
            <div class="bg-green-500/10 border border-green-500/30 rounded-xl p-6 mb-8">
                <h2 class="text-xl font-bold text-green-400 mb-4 flex items-center space-x-2">
                    <span>✅</span>
                    <span>成功发现的关键线索</span>
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    @foreach($distributedClues->where('is_required', true) as $clue)
                        <div class="bg-black/30 rounded-lg p-4 border border-green-500/20">
                            <div class="flex items-start space-x-3">
                                <span class="text-3xl">{{ $clue->icon }}</span>
                                <div class="flex-1">
                                    <h3 class="font-bold text-white">{{ $clue->title }}</h3>
                                    <p class="text-xs text-gray-500 mb-2">{{ $clue->getCategoryLabel() }}</p>
                                    <p class="text-gray-400 text-sm">{{ $clue->content }}</p>
                                </div>
                            </div>
                        </div>
                    @endforeach
                </div>
            </div>
        @endif

        <div class="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6 mb-8">
            <h2 class="text-xl font-bold text-purple-400 mb-4 flex items-center space-x-2">
                <span>📊</span>
                <span>分数解析</span>
            </h2>
            <div class="space-y-3 text-sm">
                <div class="flex justify-between items-center">
                    <span class="text-gray-400">关键线索发现率 ({{ $distributedClues->where('is_required', true)->count() }}/{{ $level->requiredClues->count() }})</span>
                    <span class="text-green-400 font-medium">+{{ round(($distributedClues->where('is_required', true)->count() / max(1, $level->requiredClues->count())) * 50) }}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-400">线索完整度 ({{ $distributedClues->count() }}/{{ $level->clueCards->count() }})</span>
                    <span class="text-green-400 font-medium">+{{ round(($distributedClues->count() / max(1, $level->clueCards->count())) * 20) }}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-400">提问质量 ({{ $relevantQuestions }}/{{ max(1, $totalQuestions) }})</span>
                    <span class="text-green-400 font-medium">+{{ round(($relevantQuestions / max(1, $totalQuestions)) * 15) }}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-400">剧透惩罚</span>
                    <span class="text-red-400 font-medium">-{{ min(15, (int)($game->spoiler_risk_accumulated / 10)) }}</span>
                </div>
                @if(!$game->isTimeUp())
                    <div class="flex justify-between items-center">
                        <span class="text-gray-400">效率奖励</span>
                        <span class="text-green-400 font-medium">+{{ max(0, (int)(15 - ($game->started_at && $game->ended_at ? $game->started_at->diffInMinutes($game->ended_at) : 0) / 2)) }}</span>
                    </div>
                @endif
                <div class="border-t border-white/10 pt-3 mt-3">
                    <div class="flex justify-between items-center text-lg">
                        <span class="text-white font-bold">最终得分</span>
                        <span class="text-yellow-400 font-bold text-2xl">{{ $game->score }} / {{ $level->max_score }}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a href="{{ route('levels.start', $level) }}" class="text-center py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-bold transition">
                🔄 重新挑战
            </a>
            <a href="{{ route('levels.index') }}" class="text-center py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition">
                📚 选择其他案件
            </a>
            <a href="{{ route('home') }}" class="text-center py-4 bg-blue-600/50 hover:bg-blue-600 text-white rounded-xl font-medium transition">
                🏠 返回主页
            </a>
        </div>
    </div>

    <div class="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
        <div class="flex items-center space-x-4">
            <div class="text-5xl">{{ $player->avatar }}</div>
            <div class="flex-1">
                <h3 class="text-xl font-bold text-white">{{ $player->name }}</h3>
                <p class="text-gray-500">累计积分: {{ $player->total_score }} · 破案率: {{ $player->winRate() }}%</p>
            </div>
            <a href="{{ route('players.show', $player) }}" class="px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg transition text-sm">
                查看档案
            </a>
        </div>
    </div>
</div>
@endsection
