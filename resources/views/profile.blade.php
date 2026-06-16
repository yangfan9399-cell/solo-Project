@extends('layouts.app')

@section('title', '个人资料')

@section('content')
<h1 style="font-size: 2rem; margin-bottom: 1.5rem;">👤 个人资料</h1>

<div class="grid grid-3" style="margin-bottom: 2rem;">
    <div class="card stat-card">
        <div class="stat-value">{{ $stats['total_score'] }}</div>
        <div class="stat-label">累计得分</div>
    </div>
    <div class="card stat-card">
        <div class="stat-value">{{ $stats['average_score_per_game'] }}</div>
        <div class="stat-label">场均得分</div>
    </div>
    <div class="card stat-card">
        <div class="stat-value">{{ $stats['hints_used_total'] }}</div>
        <div class="stat-label">累计使用提示</div>
    </div>
</div>

<div class="grid grid-2" style="margin-bottom: 2rem;">
    <div class="card">
        <h2 class="card-title">📊 游戏统计</h2>
        <div style="line-height: 2;">
            <div class="flex justify-between">
                <span class="text-muted">玩家昵称</span>
                <span class="font-bold">{{ $profile?->display_name ?? $user->name }}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-muted">注册邮箱</span>
                <span>{{ $user->email }}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-muted">总场次</span>
                <span class="font-bold">{{ $stats['games_played'] }}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-muted">胜利场次</span>
                <span class="text-success font-bold">{{ $stats['games_won'] }}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-muted">胜率</span>
                <span class="font-bold">{{ $stats['win_rate'] }}%</span>
            </div>
            <div class="flex justify-between">
                <span class="text-muted">当前连胜</span>
                <span class="text-warning font-bold">{{ $stats['current_streak'] }} 🔥</span>
            </div>
            <div class="flex justify-between">
                <span class="text-muted">最佳连胜</span>
                <span class="font-bold">{{ $stats['best_streak'] }}</span>
            </div>
        </div>
    </div>

    <div class="card">
        <h2 class="card-title">🏆 成就系统</h2>
        @php
            $achievements = [
                ['icon' => '🎯', 'name' => '初出茅庐', 'desc' => '完成第一个关卡', 'unlocked' => $stats['games_won'] >= 1],
                ['icon' => '🔥', 'name' => '连胜达人', 'desc' => '取得 5 连胜', 'unlocked' => $stats['best_streak'] >= 5],
                ['icon' => '💯', 'name' => '完美主义者', 'desc' => '不使用提示完成一个关卡', 'unlocked' => false],
                ['icon' => '⚡', 'name' => '闪电破译', 'desc' => '在时间奖励内完成关卡', 'unlocked' => false],
                ['icon' => '🧠', 'name' => '大师级破译者', 'desc' => '完成专家难度关卡', 'unlocked' => false],
                ['icon' => '📚', 'name' => '博学多才', 'desc' => '累计完成 10 个关卡', 'unlocked' => $stats['games_won'] >= 10],
            ];
        @endphp
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem;">
            @foreach($achievements as $ach)
                <div style="background: rgba(15,23,42,0.6); padding: 0.75rem; border-radius: 0.5rem; border: 1px solid {{ $ach['unlocked'] ? '#10b981' : 'rgba(99,102,241,0.2)' }}; opacity: {{ $ach['unlocked'] ? 1 : 0.5 }};">
                    <div style="font-size: 1.5rem;">{{ $ach['icon'] }}</div>
                    <div class="font-bold text-sm">{{ $ach['name'] }}</div>
                    <div class="text-xs text-muted">{{ $ach['desc'] }}</div>
                    @if($ach['unlocked'])
                        <div class="text-success text-xs mt-1">✓ 已解锁</div>
                    @endif
                </div>
            @endforeach
        </div>
    </div>
</div>

<div class="card">
    <h2 class="card-title">📜 全部游戏历史</h2>
    {{ $allGames->links() }}
    <table style="width: 100%; border-collapse: collapse; margin-top: 1rem;">
        <thead>
            <tr style="border-bottom: 1px solid rgba(99,102,241,0.2);">
                <th style="text-align: left; padding: 0.75rem; color: #94a3b8;">关卡</th>
                <th style="text-align: left; padding: 0.75rem; color: #94a3b8;">难度</th>
                <th style="text-align: left; padding: 0.75rem; color: #94a3b8;">状态</th>
                <th style="text-align: right; padding: 0.75rem; color: #94a3b8;">得分</th>
                <th style="text-align: right; padding: 0.75rem; color: #94a3b8;">提示</th>
                <th style="text-align: right; padding: 0.75rem; color: #94a3b8;">耗时</th>
                <th style="text-align: right; padding: 0.75rem; color: #94a3b8;">时间</th>
            </tr>
        </thead>
        <tbody>
            @foreach($allGames as $game)
                <tr style="border-bottom: 1px solid rgba(99,102,241,0.1);">
                    <td style="padding: 0.75rem;" class="font-bold">{{ $game->level->name }}</td>
                    <td style="padding: 0.75rem;"><span class="badge badge-{{ $game->level->difficulty }}">{{ $game->level->difficulty_label }}</span></td>
                    <td style="padding: 0.75rem;">
                        <span class="@if($game->status === 'completed') text-success @elseif($game->status === 'in_progress') text-warning @else text-danger @endif font-bold">
                            {{ $game->status_label }}
                        </span>
                    </td>
                    <td style="padding: 0.75rem; text-align: right;" class="font-bold text-warning">{{ $game->final_score }}</td>
                    <td style="padding: 0.75rem; text-align: right;">{{ $game->hints_used }}</td>
                    <td style="padding: 0.75rem; text-align: right;">{{ $game->duration_seconds ?? $game->elapsed_seconds }}s</td>
                    <td style="padding: 0.75rem; text-align: right;" class="text-muted text-sm">{{ $game->started_at->format('Y-m-d H:i') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
    {{ $allGames->links() }}
</div>
@endsection
