@extends('layouts.app')

@section('title', '地下档案馆 - 索引修复解谜')

@section('content')
<div class="row">
    <div class="col">
        <div class="card">
            <h2>👤 玩家档案</h2>
            @if($player)
                <div class="player-info">
                    <div>
                        <strong>{{ $player->name }}</strong>
                        <div class="stats" style="margin-top: 8px;">
                            <span>{{ $player->total_score }}</span> 总积分
                            <span>{{ $player->games_won }}/{{ $player->games_played }}</span> 胜/局
                            <span>{{ $player->current_streak }}</span> 连胜
                        </div>
                    </div>
                    <button class="btn btn-secondary" onclick="switchPlayer()">切换玩家</button>
                </div>
            @else
                <p style="margin-bottom: 16px; color: #aaa;">请输入玩家名称开始游戏</p>
                <div style="display: flex; gap: 10px;">
                    <input type="text" id="playerName" placeholder="输入你的代号..." style="flex: 1;">
                    <button class="btn" onclick="selectPlayer()">进入</button>
                </div>
            @endif
        </div>

        <div class="card">
            <h2>🗂 档案关卡</h2>
            <div class="level-list">
                @foreach($levels as $level)
                <div class="level-card" onclick="startLevel({{ $level->id }})">
                    <h3>{{ $level->name }}</h3>
                    <p>{{ $level->description }}</p>
                    <div class="level-meta">
                        <span>难度：<span class="difficulty difficulty-{{ $level->difficulty }}">
                            {{ ['', '入门', '中级', '高级'][$level->difficulty] ?? '未知' }}
                        </span></span>
                        <span>{{ $level->archive_boxes_count }} 个档案盒</span>
                    </div>
                    <div class="level-meta" style="margin-top: 8px;">
                        <span>基础分：{{ $level->base_score }}</span>
                        <span>{{ $level->floor_count }} 层楼</span>
                    </div>
                </div>
                @endforeach
            </div>
        </div>
    </div>

    <div class="col-sidebar">
        <div class="card">
            <h2>📊 排行榜</h2>
            <ul class="leaderboard">
                @foreach($players as $i => $p)
                <li>
                    <span class="rank">#{{ $i + 1 }}</span>
                    <span class="name">{{ $p->name }}</span>
                    <span class="score">{{ $p->total_score }}</span>
                </li>
                @endforeach
            </ul>
        </div>

        @if($player)
        <div class="card">
            <h2>🕹 操作</h2>
            <a href="{{ route('game.resume') }}" class="btn btn-secondary" style="width: 100%; text-align: center; margin-bottom: 10px; display: block;">
                继续未完成的局
            </a>
        </div>
        @endif

        <div class="card">
            <h2>📖 游戏说明</h2>
            <div style="font-size: 13px; color: #aaa; line-height: 1.8;">
                <p>🎯 <strong>目标</strong>：将每个档案盒放到正确的楼层。</p>
                <p style="margin-top: 10px;">🔍 <strong>线索</strong>：根据提供的线索推理档案的正确位置。</p>
                <p style="margin-top: 10px;">⚠️ <strong>噪声</strong>：部分线索是假的（噪声），需要自行判断。</p>
                <p style="margin-top: 10px;">↩️ <strong>撤销</strong>：可以撤销操作，但会扣分。</p>
                <p style="margin-top: 10px;">📝 <strong>结案报告</strong>：提交后后端会重新计算分数。</p>
                <p style="margin-top: 10px;">🎁 <strong>加分项</strong>：正确识别噪声线索可获得额外分数。</p>
            </div>
        </div>
    </div>
</div>
@endsection

@section('scripts')
<script>
function selectPlayer() {
    const name = document.getElementById('playerName').value.trim();
    if (!name) {
        alert('请输入玩家名称');
        return;
    }
    fetch('{{ route("player.select") }}', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': '{{ csrf_token() }}',
        },
        body: JSON.stringify({ name: name })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            location.reload();
        } else {
            alert(data.error || '操作失败');
        }
    });
}

function switchPlayer() {
    if (confirm('确定要切换玩家吗？')) {
        fetch('{{ route("player.select") }}', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': '{{ csrf_token() }}',
            },
            body: JSON.stringify({ name: '__logout__' })
        })
        .then(() => {
            location.reload();
        });
    }
}

function startLevel(levelId) {
    @if(!$player)
        alert('请先选择玩家');
        document.getElementById('playerName').focus();
        return;
    @endif

    fetch('/game/start/' + levelId, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': '{{ csrf_token() }}',
        }
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            window.location.href = '/play?session=' + data.session_id;
        } else {
            alert(data.error || '开始游戏失败');
        }
    });
}
</script>
@endsection
