@extends('layouts.app')

@section('title', '关卡选择 - 胶水配比实验室')

@section('content')
<div class="mb-6">
    <div class="flex items-center justify-between mb-4">
        <h2 class="text-2xl font-bold text-amber-900">📚 修复任务</h2>
        <div class="flex items-center gap-4">
            <div class="text-amber-700">
                <span class="text-2xl">⭐</span>
                <span class="font-bold text-xl">{{ $totalStars }}</span>
                <span class="text-sm">/ {{ $totalLevels * 3 }}</span>
            </div>
            <div class="text-amber-600 text-sm">
                已通关 {{ $completedLevels }} / {{ $totalLevels }} 关
            </div>
        </div>
    </div>
    <p class="text-amber-700">选择一个修复任务，调配专属胶水配方吧！</p>
</div>

<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
    @foreach($levels as $level)
    <div class="level-card card p-6 {{ !$level['is_unlocked'] ? 'locked cursor-not-allowed' : '' }}">
        <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-2">
                <span class="text-2xl">
                    @if($level['order'] == 1)📗
                    @elseif($level['order'] == 2)📰
                    @elseif($level['order'] == 3)📜
                    @elseif($level['order'] == 4)📷
                    @elseif($level['order'] == 5)📖
                    @else📚
                    @endif
                </span>
                <div>
                    <h3 class="font-bold text-amber-900">第 {{ $level['order'] }} 关</h3>
                    <p class="text-sm text-amber-700">{{ $level['name'] }}</p>
                </div>
            </div>
            @if($level['is_completed'])
                <div class="flex">
                    @for($i = 1; $i <= 3; $i++)
                        <span class="{{ $i <= $level['stars'] ? 'star' : 'star-empty' }} text-lg">★</span>
                    @endfor
                </div>
            @endif
        </div>

        <div class="text-sm text-amber-600 mb-4">
            <p class="mb-2">{{ $level['paper_type'] }}</p>
        </div>

        <div class="grid grid-cols-3 gap-2 mb-4 text-xs">
            <div class="bg-amber-50 rounded p-2 text-center">
                <div class="text-amber-500">黏度目标</div>
                <div class="font-bold text-amber-800">{{ $level['target_viscosity'] }}</div>
            </div>
            <div class="bg-amber-50 rounded p-2 text-center">
                <div class="text-amber-500">干燥时间</div>
                <div class="font-bold text-amber-800">{{ $level['target_drying_time'] }}s</div>
            </div>
            <div class="bg-amber-50 rounded p-2 text-center">
                <div class="text-amber-500">透明度</div>
                <div class="font-bold text-amber-800">{{ $level['target_transparency'] }}%</div>
            </div>
        </div>

        <div class="flex items-center justify-between">
            <span class="text-xs text-amber-500">
                最多 {{ $level['max_attempts'] }} 次尝试
            </span>
            @if($level['is_unlocked'])
                <a href="{{ route('game.play', $level['id']) }}" class="btn-primary !py-2 !px-4 text-sm">
                    {{ $level['is_completed'] ? '再玩一次' : '开始挑战' }}
                </a>
            @else
                <span class="text-xs text-amber-500 bg-amber-100 px-3 py-1 rounded-full">
                    🔒 未解锁
                </span>
            @endif
        </div>

        @if($level['attempts_count'] > 0)
            <div class="mt-3 pt-3 border-t border-amber-100 text-xs text-amber-500">
                已尝试 {{ $level['attempts_count'] }} 次
                @if($level['best_score'])
                    · 最高分 {{ $level['best_score'] }}
                @endif
            </div>
        @endif
    </div>
    @endforeach
</div>

<div class="mt-8 card p-6">
    <h3 class="font-bold text-amber-900 mb-3">💡 游戏提示</h3>
    <ul class="text-sm text-amber-700 space-y-2">
        <li>• 每关需要调配出黏度、干燥时间、透明度都接近目标值的胶水</li>
        <li>• 基础胶料决定胶水的基本属性，添加剂可以调整各项指标</li>
        <li>• 通关后可以解锁新的材料，探索更多配方可能</li>
        <li>• 达到更高分数可以获得更多星星评价（最高3星）</li>
        <li>• 记得保存你的得意配方，分享给朋友一起挑战！</li>
    </ul>
</div>
@endsection
