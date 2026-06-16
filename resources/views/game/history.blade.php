@extends('layouts.app')

@section('title', '操作历史 - ' . $session->level->name)

@section('content')
<div class="flex justify-between items-center mb-4">
    <h1 style="font-size: 1.75rem;">📜 操作历史</h1>
    <a href="{{ route('game.show', $session) }}" class="btn btn-secondary">返回游戏</a>
</div>

<div class="card" style="margin-bottom: 1.5rem;">
    <h2 class="card-title">🎯 游戏概览</h2>
    <div class="grid grid-3">
        <div>
            <div class="text-sm text-muted">关卡</div>
            <div class="font-bold text-lg">{{ $session->level->name }}</div>
        </div>
        <div>
            <div class="text-sm text-muted">状态</div>
            <div class="font-bold text-lg @if($session->status === 'completed') text-success @elseif($session->status === 'in_progress') text-warning @else text-danger @endif">
                {{ $session->status_label }}
            </div>
        </div>
        <div>
            <div class="text-sm text-muted">最终得分</div>
            <div class="font-bold text-lg text-warning">{{ $session->final_score }}</div>
        </div>
        <div>
            <div class="text-sm text-muted">开始时间</div>
            <div>{{ $session->started_at->format('Y-m-d H:i:s') }}</div>
        </div>
        <div>
            <div class="text-sm text-muted">结束时间</div>
            <div>{{ $session->completed_at?->format('Y-m-d H:i:s') ?? $session->abandoned_at?->format('Y-m-d H:i:s') ?? '进行中' }}</div>
        </div>
        <div>
            <div class="text-sm text-muted">耗时</div>
            <div>{{ $session->duration_seconds ?? $session->elapsed_seconds }} 秒</div>
        </div>
    </div>
</div>

<div class="grid grid-2" style="margin-bottom: 1.5rem;">
    <div class="card">
        <h2 class="card-title">💡 已使用的提示 ({{ $hintUses->count() }})</h2>
        @if($hintUses->count() > 0)
            @foreach($hintUses as $idx => $hint)
                <div class="note-item" style="border-left-color: #f59e0b;">
                    <div class="note-category" style="color: #f59e0b;">
                        提示 #{{ $idx + 1 }} · 扣 {{ $hint->penalty_applied }} 分
                    </div>
                    <div>{{ $hint->hint_content }}</div>
                    <div class="text-xs text-muted mt-1">{{ $hint->created_at->format('H:i:s') }}</div>
                </div>
            @endforeach
        @else
            <div class="text-muted text-sm">本局未使用任何提示 🎉</div>
        @endif
    </div>

    <div class="card">
        <h2 class="card-title">📝 推理笔记 ({{ $notes->count() }})</h2>
        @if($notes->count() > 0)
            @foreach($notes as $note)
                <div class="note-item">
                    <div class="note-category">[{{ $note->category_label }}] {{ $note->created_at->format('H:i:s') }}</div>
                    <div>{{ $note->content }}</div>
                </div>
            @endforeach
        @else
            <div class="text-muted text-sm">本局未添加笔记</div>
        @endif
    </div>
</div>

<div class="card">
    <h2 class="card-title">📋 完整操作记录 ({{ $histories->count() }} 条)</h2>
    <table style="width: 100%; border-collapse: collapse;">
        <thead>
            <tr style="border-bottom: 1px solid rgba(99,102,241,0.3);">
                <th style="text-align: left; padding: 0.75rem; color: #94a3b8;">时间</th>
                <th style="text-align: left; padding: 0.75rem; color: #94a3b8;">操作类型</th>
                <th style="text-align: left; padding: 0.75rem; color: #94a3b8;">描述</th>
                <th style="text-align: right; padding: 0.75rem; color: #94a3b8;">分数变化</th>
            </tr>
        </thead>
        <tbody>
            @foreach($histories as $history)
                <tr style="border-bottom: 1px solid rgba(99,102,241,0.1);">
                    <td style="padding: 0.75rem;" class="text-sm text-muted">{{ $history->created_at->format('H:i:s') }}</td>
                    <td style="padding: 0.75rem;">
                        <span class="badge @if($history->action_type === 'hint_use') badge-danger @elseif($history->action_type === 'submit') badge-success @else badge-medium @endif">
                            {{ $history->action_type_label }}
                        </span>
                    </td>
                    <td style="padding: 0.75rem;">{{ $history->description }}</td>
                    <td style="padding: 0.75rem; text-align: right;">
                        <span class="@if($history->score_change > 0) text-success @elseif($history->score_change < 0) text-danger @endif font-bold">
                            {{ $history->score_change > 0 ? '+' : '' }}{{ $history->score_change }}
                        </span>
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>
    <div class="mt-3">
        {{ $histories->links() }}
    </div>
</div>
@endsection
