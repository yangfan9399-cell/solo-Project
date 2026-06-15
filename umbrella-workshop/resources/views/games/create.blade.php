@extends('layouts.app')

@section('content')
<div class="page-header">
    <h1>🏗️ 开工作坊</h1>
    <p>选择一个关卡，开始你的纸伞制作之旅</p>
</div>

<div class="grid grid-3">
    @foreach($levels as $level)
    <div class="card" style="border-left: 4px solid {{ $level->difficulty == 1 ? 'var(--success)' : ($level->difficulty == 2 ? 'var(--warning)' : 'var(--danger)') }}">
        <h2 style="border:none; padding:0; margin-bottom:8px;">{{ $level->name }}</h2>
        <p class="text-sm text-muted mb-2">{{ $level->description }}</p>
        <div class="mb-2">
            <span class="badge {{ $level->difficulty == 1 ? 'badge-success' : ($level->difficulty == 2 ? 'badge-warning' : 'badge-danger') }}">
                难度：{{ str_repeat('★', $level->difficulty) }}{{ str_repeat('☆', 3 - $level->difficulty) }}
            </span>
        </div>
        <div class="text-sm mb-2">
            <span class="text-muted">目标分数：</span><strong>{{ $level->target_score }}</strong>分
        </div>
        @if($level->humidity_range)
        <div class="text-sm mb-2">
            <span class="text-muted">湿度范围：</span>{{ $level->humidity_range['min'] }}% - {{ $level->humidity_range['max'] }}%
        </div>
        @endif

        <form action="{{ route('games.store') }}" method="POST">
            @csrf
            <input type="hidden" name="level_id" value="{{ $level->id }}">
            <div class="form-group">
                <label>匠人姓名</label>
                <input type="text" name="player_name" placeholder="请输入匠人姓名" value="匠人">
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%;">开始制作</button>
        </form>
    </div>
    @endforeach
</div>

<div class="mt-4">
    <a href="{{ route('games.index') }}" class="btn btn-outline">← 返回作坊记录</a>
</div>
@endsection
