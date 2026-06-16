@extends('layouts.app')

@section('title', $level->name)

@section('content')
<div class="flex justify-between items-center mb-4">
    <h1 style="font-size: 1.75rem;">🎨 {{ $level->name }}</h1>
    <div class="flex gap-2">
        <a href="{{ route('custom-levels.index') }}" class="btn btn-secondary">← 返回列表</a>
        <form method="POST" action="{{ route('game.start', $level) }}">
            @csrf
            <button type="submit" class="btn btn-primary">🎯 开始挑战</button>
        </form>
        <form method="POST" action="{{ route('custom-levels.destroy', $level) }}" onsubmit="return confirm('确定删除这个谜题吗？')">
            @csrf
            @method('DELETE')
            <button type="submit" class="btn btn-danger">🗑️ 删除</button>
        </form>
    </div>
</div>

<div class="grid grid-2">
    <div class="card">
        <h2 class="card-title">📋 谜题信息</h2>

        <div class="mb-4">
            <span class="badge badge-{{ $level->difficulty }}">{{ $level->difficulty_label }}</span>
            <span class="badge badge-medium">{{ match($level->cipher_type) {
                'caesar' => '凯撒密码',
                'substitution' => '单表替换',
                'vigenere' => '维吉尼亚',
                'rotor' => '转轮密码',
                default => $level->cipher_type,
            } }}</span>
            @if($level->cipher_type === 'rotor')
                <span class="badge badge-hard">{{ $level->rotor_count }} 转轮</span>
            @endif
        </div>

        <div style="margin-bottom: 1rem;">
            <div class="text-sm text-muted mb-1">描述</div>
            <div class="text-lg">{{ $level->description }}</div>
        </div>

        <div class="grid grid-2" style="margin-top: 1.5rem;">
            <div class="form-group">
                <div class="text-sm text-muted mb-1">基础分数</div>
                <div class="text-2xl font-bold text-warning">{{ $level->base_score }}</div>
            </div>
            <div class="form-group">
                <div class="text-sm text-muted mb-1">提示扣分</div>
                <div class="text-2xl font-bold text-danger">每次 {{ $level->hint_penalty }}</div>
            </div>
        </div>

        @if($level->time_bonus_threshold)
            <div class="alert alert-info">
                ⏱️ 时间奖励：在 {{ $level->time_bonus_threshold }} 秒内完成可获得额外奖励
            </div>
        @endif

        @if($level->solution_hints && count($level->solution_hints) > 0)
            <div style="margin-top: 1rem;">
                <div class="text-sm text-muted mb-2">解谜提示 ({{ count($level->solution_hints) }} 条)</div>
                @foreach($level->solution_hints as $i => $hint)
                    <div class="alert alert-warning" style="padding: 0.5rem 1rem; margin-bottom: 0.5rem;">
                        💡 提示 {{ $i + 1 }}: {{ $hint }}
                    </div>
                @endforeach
            </div>
        @endif

        <div style="margin-top: 1rem;">
            <div class="text-xs text-muted">
                创建时间：{{ $level->created_at->format('Y-m-d H:i') }}
                @if($level->updated_at > $level->created_at)
                    <br>最后更新：{{ $level->updated_at->format('Y-m-d H:i') }}
                @endif
            </div>
        </div>
    </div>

    <div class="card">
        <h2 class="card-title">🔐 密文预览</h2>

        <div style="margin-bottom: 1.5rem;">
            <div class="text-sm text-muted mb-2">密文:</div>
            <div style="
                background: rgba(0, 0, 0, 0.4);
                padding: 1rem;
                border-radius: 0.5rem;
                font-family: 'SF Mono', monospace;
                word-break: break-all;
                line-height: 1.8;
                border: 1px solid rgba(99, 102, 241, 0.3);
                color: #fbbf24;
                max-height: 250px;
                overflow-y: auto;
            ">{{ $level->ciphertext }}</div>
        </div>

        <div style="margin-bottom: 1rem;">
            <div class="text-sm text-muted mb-2">密文字母频率 TOP 10:</div>
            <div>
                @php
                    $topTen = array_slice($level->frequency_data ?? [], 0, 10, true);
                @endphp
                @foreach($topTen as $letter => $data)
                    <span style="
                        display: inline-block;
                        padding: 0.2rem 0.4rem;
                        margin: 0.15rem;
                        background: rgba(99, 102, 241, 0.2);
                        border-radius: 0.25rem;
                        font-size: 0.8rem;
                        font-family: monospace;
                    ">{{ $letter }}: {{ $data['count'] }} ({{ $data['percentage'] }}%)</span>
                @endforeach
            </div>
        </div>

        <div class="alert alert-info mt-4">
            <details>
                <summary style="cursor: pointer; color: #93c5fd;">👀 点击查看明文（答案）</summary>
                <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(99,102,241,0.2);">
                    <div style="font-family: monospace; line-height: 1.8; color: #a7f3d0;">
                        {{ $level->plaintext }}
                    </div>
                </div>
            </details>
        </div>

        <form method="POST" action="{{ route('game.start', $level) }}" class="mt-4">
            @csrf
            <button type="submit" class="btn btn-primary btn-block" style="font-size: 1.1rem; padding: 0.9rem;">
                🎯 开始挑战这个谜题
            </button>
        </form>
    </div>
</div>
@endsection
