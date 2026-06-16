@extends('layouts.app')

@section('title', '结算 - ' . $level->name)

@section('content')
<div class="max-w-2xl mx-auto">
    <div class="card p-8">
        <div class="text-center mb-8">
            @if($session->isWon())
                <div class="text-7xl mb-4">🎉</div>
                <h2 class="text-3xl font-bold text-green-600 mb-2">修补成功！</h2>
                <div class="flex justify-center gap-1 mb-4">
                    @for($i = 1; $i <= 3; $i++)
                        <span class="text-4xl {{ $i <= $score['stars'] ? 'star' : 'star-empty' }}">★</span>
                    @endfor
                </div>
                <p class="text-amber-700">恭喜你成功修复了这本{{ $level->paper_type }}！</p>
            @elseif($session->isLost())
                <div class="text-7xl mb-4">😢</div>
                <h2 class="text-3xl font-bold text-red-600 mb-2">挑战失败</h2>
                <p class="text-amber-700">尝试次数用完了，再试一次吧！</p>
            @else
                <div class="text-7xl mb-4">🔬</div>
                <h2 class="text-3xl font-bold text-amber-800 mb-2">游戏进行中</h2>
            @endif

            <div class="mt-6">
                <p class="text-amber-600 text-sm">最终得分</p>
                <p class="text-5xl font-bold text-amber-900">{{ number_format($score['total_score'], 1) }}</p>
            </div>
        </div>

        <div class="bg-amber-50 rounded-xl p-6 mb-6">
            <h3 class="font-bold text-amber-900 mb-4 text-center">📊 详细成绩</h3>

            <div class="space-y-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="text-2xl">💧</span>
                        <div>
                            <p class="font-semibold text-amber-800">黏度</p>
                            <p class="text-sm text-amber-600">目标: {{ $level->target_viscosity }}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-xl font-bold {{ $score['viscosity_pass'] ? 'text-green-600' : 'text-red-500' }}">
                            {{ number_format($session->final_viscosity, 1) }}
                        </p>
                        <p class="text-xs text-amber-500">
                            偏差 {{ number_format($score['viscosity_diff'], 1) }}
                            ({{ $score['viscosity_pass'] ? '✓ 通过' : '✗ 未通过' }})
                        </p>
                    </div>
                </div>

                <div class="h-px bg-amber-200"></div>

                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="text-2xl">⏱️</span>
                        <div>
                            <p class="font-semibold text-amber-800">干燥时间</p>
                            <p class="text-sm text-amber-600">目标: {{ $level->target_drying_time }}s</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-xl font-bold {{ $score['drying_pass'] ? 'text-green-600' : 'text-red-500' }}">
                            {{ number_format($session->final_drying_time, 1) }}s
                        </p>
                        <p class="text-xs text-amber-500">
                            偏差 {{ number_format($score['drying_diff'], 1) }}
                            ({{ $score['drying_pass'] ? '✓ 通过' : '✗ 未通过' }})
                        </p>
                    </div>
                </div>

                <div class="h-px bg-amber-200"></div>

                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="text-2xl">✨</span>
                        <div>
                            <p class="font-semibold text-amber-800">透明度</p>
                            <p class="text-sm text-amber-600">目标: {{ $level->target_transparency }}%</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-xl font-bold {{ $score['transparency_pass'] ? 'text-green-600' : 'text-red-500' }}">
                            {{ number_format($session->final_transparency, 1) }}%
                        </p>
                        <p class="text-xs text-amber-500">
                            偏差 {{ number_format($score['transparency_diff'], 1) }}
                            ({{ $score['transparency_pass'] ? '✓ 通过' : '✗ 未通过' }})
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6">
            <p class="text-sm text-amber-700 text-center">
                🔬 以上分数由后端 <strong>实时计算</strong>，确保公平公正
            </p>
        </div>

        <div class="flex gap-4">
            <a href="{{ route('levels.index') }}" class="btn-secondary flex-1 text-center">
                返回关卡
            </a>
            @if($session->isLost())
                <a href="{{ route('game.play', $level->id) }}" class="btn-primary flex-1 text-center">
                    再试一次
                </a>
            @elseif($session->isWon())
                @if($nextLevel && $nextLevelUnlocked)
                    <a href="{{ route('game.play', $nextLevel->id) }}" class="btn-primary flex-1 text-center">
                        下一关 →
                    </a>
                @else
                    <a href="{{ route('recipes.index') }}" class="btn-primary flex-1 text-center">
                        查看配方库
                    </a>
                @endif
            @else
                <a href="{{ route('game.play', $level->id) }}" class="btn-primary flex-1 text-center">
                    继续游戏
                </a>
            @endif
        </div>

        @if($session->isWon() && $nextLevel && !$nextLevelUnlocked)
            <div class="mt-4 p-4 bg-amber-50 rounded-lg text-center">
                <p class="text-amber-700 text-sm">
                    🔒 下一关「{{ $nextLevel->name }}」尚未解锁
                </p>
            </div>
        @endif
    </div>

    <div class="mt-6 text-center">
        <p class="text-amber-600 text-sm">
            本次用时: {{ $session->started_at ? $session->started_at->diffForHumans($session->ended_at ?? now(), true) : '-' }}
            · 尝试次数: {{ $session->attempt_count }}
        </p>
    </div>
</div>
@endsection
