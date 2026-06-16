@extends('layouts.app')

@section('title', '继续游戏 - 地下档案馆')

@section('content')
<div class="player-info">
    <div>
        <strong>{{ $player->name }}</strong>
        <span style="margin-left: 16px; color: #aaa; font-size: 13px;">
            总积分：<span style="color: #d4af37;">{{ $player->total_score }}</span>
        </span>
    </div>
    <a href="{{ route('game.index') }}" class="btn btn-secondary">返回大厅</a>
</div>

<div class="row">
    <div class="col">
        <div class="card">
            <h2>🎮 进行中的游戏</h2>
            @if($sessions->count() > 0)
                <div class="level-list">
                    @foreach($sessions as $session)
                    <div class="level-card" onclick="continueGame({{ $session->id }})">
                        <h3>{{ $session->level->name }}</h3>
                        <p style="margin-bottom: 8px;">
                            难度：<span class="difficulty difficulty-{{ $session->level->difficulty }}">
                                {{ ['', '入门', '中级', '高级'][$session->level->difficulty] }}
                            </span>
                        </p>
                        <div class="level-meta">
                            <span>操作次数：{{ $session->operation_count }}</span>
                            <span>撤销：{{ $session->undo_count }}</span>
                        </div>
                        <div class="level-meta" style="margin-top: 6px;">
                            <span>开始于：{{ $session->started_at?->format('m-d H:i') }}</span>
                        </div>
                    </div>
                    @endforeach
                </div>
            @else
                <p style="color: #888; text-align: center; padding: 30px 0;">
                    没有进行中的游戏
                </p>
            @endif
        </div>

        <div class="card">
            <h2>📜 历史记录</h2>
            @if($completedSessions->count() > 0)
                <ul class="leaderboard" style="list-style: none;">
                    @foreach($completedSessions as $session)
                    <li onclick="viewResult({{ $session->id }})" style="cursor: pointer;">
                        <span>{{ $session->level->name }}</span>
                        <span style="color: {{ $session->status === 'won' ? '#10b981' : '#ef4444' }};">
                            {{ $session->status === 'won' ? '✓ 通关' : '✗ 失败' }}
                        </span>
                        <span style="color: #d4af37; font-weight: 600;">{{ $session->score }} 分</span>
                    </li>
                    @endforeach
                </ul>
            @else
                <p style="color: #888; text-align: center; padding: 20px 0;">
                    暂无历史记录
                </p>
            @endif
        </div>
    </div>

    <div class="col-sidebar">
        <div class="card">
            <h2>📊 玩家数据</h2>
            <div style="font-size: 14px; line-height: 2;">
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: #aaa;">总积分</span>
                    <span style="color: #d4af37; font-weight: 600;">{{ $player->total_score }}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: #aaa;">游戏局数</span>
                    <span>{{ $player->games_played }}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: #aaa;">胜利次数</span>
                    <span style="color: #10b981;">{{ $player->games_won }}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: #aaa;">当前连胜</span>
                    <span>{{ $player->current_streak }}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: #aaa;">最高连胜</span>
                    <span style="color: #f59e0b;">{{ $player->best_streak }}</span>
                </div>
            </div>
        </div>

        <div class="card">
            <h2>🎯 开始新游戏</h2>
            <a href="{{ route('game.index') }}" class="btn" style="width: 100%; text-align: center; display: block;">
                选择关卡
            </a>
        </div>
    </div>
</div>
@endsection

@section('scripts')
<script>
function continueGame(sessionId) {
    window.location.href = '/play?session=' + sessionId;
}

function viewResult(sessionId) {
    window.location.href = '/play?session=' + sessionId;
}
</script>
@endsection
