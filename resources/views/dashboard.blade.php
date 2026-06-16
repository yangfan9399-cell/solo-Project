@extends('layouts.app')

@section('title', '控制台')

@section('content')
<h1 style="font-size: 2rem; margin-bottom: 1.5rem;">🎮 控制台</h1>

<div class="grid grid-4" style="margin-bottom: 2rem;">
    <div class="card stat-card">
        <div class="stat-value">{{ $stats['total_score'] }}</div>
        <div class="stat-label">累计得分</div>
    </div>
    <div class="card stat-card">
        <div class="stat-value">{{ $stats['games_won'] }}/{{ $stats['games_played'] }}</div>
        <div class="stat-label">胜场/总场次</div>
    </div>
    <div class="card stat-card">
        <div class="stat-value">{{ $stats['win_rate'] }}%</div>
        <div class="stat-label">胜率</div>
    </div>
    <div class="card stat-card">
        <div class="stat-value">{{ $stats['current_streak'] }}🔥</div>
        <div class="stat-label">当前连胜 (最佳: {{ $stats['best_streak'] }})</div>
    </div>
</div>

<div class="grid grid-2" style="margin-bottom: 2rem;">
    <div class="card">
        <div class="flex justify-between items-center mb-3">
            <h2 class="card-title" style="margin: 0;">📋 关卡列表</h2>
            <a href="{{ route('custom-levels.index') }}" class="btn btn-secondary" style="padding: 0.35rem 0.8rem; font-size: 0.85rem;">🎨 我的自定义谜题</a>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            @foreach($levels as $level)
                <div style="background: rgba(15,23,42,0.6); padding: 1rem; border-radius: 0.5rem; border: 1px solid rgba(99,102,241,0.2);">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <div class="font-bold text-lg">
                                {{ $level->name }}
                                @if($level->is_custom)
                                    <span class="badge badge-medium" style="font-size: 0.7rem; vertical-align: middle;">自定义</span>
                                @endif
                            </div>
                            <div class="text-sm text-muted mt-1">{{ $level->description }}</div>
                        </div>
                        <span class="badge badge-{{ $level->difficulty }}">{{ $level->difficulty_label }}</span>
                    </div>
                    <div class="flex justify-between items-center mt-3">
                        <div class="text-sm">
                            <span class="text-warning font-bold">{{ $level->base_score }}</span> 基础分 ·
                            <span class="text-info">{{ $level->rotor_count }}</span> 转轮 ·
                            <span class="text-danger">{{ $level->hint_penalty }}</span> 提示扣分
                        </div>
                        <form method="POST" action="{{ route('game.start', $level) }}">
                            @csrf
                            <button type="submit" class="btn btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">
                                开始挑战
                            </button>
                        </form>
                    </div>
                </div>
            @endforeach
        </div>
    </div>

    <div>
        @if($inProgressGames->count() > 0)
            <div class="card" style="margin-bottom: 1.5rem;">
                <h2 class="card-title">⏸️ 进行中的游戏</h2>
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    @foreach($inProgressGames as $game)
                        <div class="flex justify-between items-center" style="background: rgba(245,158,11,0.1); padding: 0.75rem 1rem; border-radius: 0.5rem; border-left: 3px solid #f59e0b;">
                            <div>
                                <div class="font-bold">{{ $game->level->name }}</div>
                                <div class="text-sm text-muted">开始于 {{ $game->started_at->format('H:i') }} · 已扣分 {{ $game->penalty_score }}</div>
                            </div>
                            <a href="{{ route('game.show', $game) }}" class="btn btn-warning" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">继续</a>
                        </div>
                    @endforeach
                </div>
            </div>
        @endif

        <div class="card">
            <h2 class="card-title">🏆 排行榜 TOP 10</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 1px solid rgba(99,102,241,0.2);">
                        <th style="text-align: left; padding: 0.5rem; color: #94a3b8;">#</th>
                        <th style="text-align: left; padding: 0.5rem; color: #94a3b8;">玩家</th>
                        <th style="text-align: right; padding: 0.5rem; color: #94a3b8;">分数</th>
                        <th style="text-align: right; padding: 0.5rem; color: #94a3b8;">胜率</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($leaderboard as $entry)
                        <tr style="border-bottom: 1px solid rgba(99,102,241,0.1);">
                            <td style="padding: 0.5rem;">
                                <span class="@if($entry['rank'] == 1) text-warning @elseif($entry['rank'] == 2) text-muted @elseif($entry['rank'] == 3) text-danger @endif font-bold">
                                    {{ $entry['rank'] }}
                                </span>
                            </td>
                            <td style="padding: 0.5rem;">{{ $entry['name'] }}</td>
                            <td style="padding: 0.5rem; text-align: right;" class="font-bold text-warning">{{ $entry['total_score'] }}</td>
                            <td style="padding: 0.5rem; text-align: right;" class="text-success">{{ $entry['win_rate'] }}%</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
</div>

<div class="card">
    <h2 class="card-title">📜 最近游戏记录</h2>
    @if($recentGames->count() > 0)
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="border-bottom: 1px solid rgba(99,102,241,0.2);">
                    <th style="text-align: left; padding: 0.75rem; color: #94a3b8;">关卡</th>
                    <th style="text-align: left; padding: 0.75rem; color: #94a3b8;">状态</th>
                    <th style="text-align: right; padding: 0.75rem; color: #94a3b8;">得分</th>
                    <th style="text-align: right; padding: 0.75rem; color: #94a3b8;">提示使用</th>
                    <th style="text-align: right; padding: 0.75rem; color: #94a3b8;">时间</th>
                    <th style="text-align: right; padding: 0.75rem; color: #94a3b8;">操作</th>
                </tr>
            </thead>
            <tbody>
                @foreach($recentGames as $game)
                    <tr style="border-bottom: 1px solid rgba(99,102,241,0.1);">
                        <td style="padding: 0.75rem;">
                            <span class="font-bold">{{ $game->level->name }}</span>
                            <span class="badge badge-{{ $game->level->difficulty }}" style="margin-left: 0.5rem;">{{ $game->level->difficulty_label }}</span>
                        </td>
                        <td style="padding: 0.75rem;">
                            <span class="@if($game->status === 'completed') text-success @elseif($game->status === 'in_progress') text-warning @else text-danger @endif font-bold">
                                {{ $game->status_label }}
                            </span>
                        </td>
                        <td style="padding: 0.75rem; text-align: right;" class="font-bold text-warning">{{ $game->final_score }}</td>
                        <td style="padding: 0.75rem; text-align: right;">{{ $game->hints_used }}</td>
                        <td style="padding: 0.75rem; text-align: right;" class="text-muted text-sm">{{ $game->started_at->format('m-d H:i') }}</td>
                        <td style="padding: 0.75rem; text-align: right;">
                            <a href="{{ route('game.history', $game) }}" class="btn btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;">查看历史</a>
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @else
        <p class="text-muted">还没有游戏记录，选择一个关卡开始挑战吧！</p>
    @endif
</div>
@endsection
