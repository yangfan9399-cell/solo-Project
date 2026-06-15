@extends('layouts.app')

@section('title', '游戏大厅 - 钟乳洞声波测距探险游戏')

@section('content')
<div class="grid grid-2">
    <div class="card">
        <div class="card-title">🎮 开始新探险</div>
        <div class="alert alert-info">
            <strong>游戏玩法：</strong>你只能通过声波回声推断洞穴结构。选择发射点、频率和探测方向来拼接洞穴轮廓。潮湿墙面、裂隙和塌方会产生假回声，路线规划错误会消耗氧气。
        </div>
        <form action="{{ route('game.create') }}" method="POST">
            @csrf
            <div class="form-group">
                <label class="form-label">探险家姓名</label>
                <input type="text" name="player_name" class="form-input" value="探险家" placeholder="输入你的名字">
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%">🚀 开始探险</button>
        </form>

        <div class="mt-20">
            <div class="card-title">📖 游戏说明</div>
            <div style="font-size:13px; line-height:1.8; color:#8892b0;">
                <p>🎯 <strong>目标：</strong>使用声波探测设备绘制洞穴地图，找到出口并安全返回。</p>
                <p>📡 <strong>探测：</strong>选择方向(0-360°)和频率(10-100kHz)发射声波，分析回波曲线推断前方结构。</p>
                <p>💧 <strong>潮湿墙面：</strong>吸收声波，可能出现假回声使距离偏近。</p>
                <p>🕳️ <strong>裂隙：</strong>散射声波，可能出现假回声使距离偏远。</p>
                <p>🪨 <strong>塌方：</strong>强反射且不规则，极易产生假回声。</p>
                <p>🫁 <strong>氧气：</strong>每次探测和移动消耗氧气，耗尽则探险失败。</p>
                <p>🔧 <strong>装备耐久：</strong>探测频率过高或遇到危险墙面会损耗设备。</p>
                <p>↩️ <strong>回滚：</strong>对探测结果不满意可回滚（部分返还氧气和耐久）。</p>
            </div>
        </div>
    </div>

    <div class="card">
        <div class="card-title">📊 历史探险记录</div>
        @if($sessions->count() > 0)
            <table class="table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>探险家</th>
                        <th>状态</th>
                        <th>氧气</th>
                        <th>装备</th>
                        <th>得分</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($sessions as $s)
                        <tr>
                            <td>{{ $s->id }}</td>
                            <td>{{ $s->player_name }}</td>
                            <td>
                                @if($s->status === 'playing')
                                    <span class="badge badge-info">探险中</span>
                                @elseif($s->status === 'completed')
                                    <span class="badge badge-success">已完成</span>
                                @elseif($s->status === 'failed')
                                    <span class="badge badge-danger">失败</span>
                                @else
                                    <span class="badge badge-secondary">已放弃</span>
                                @endif
                            </td>
                            <td>
                                <div class="progress-bar" style="width:60px;display:inline-block;vertical-align:middle;">
                                    <div class="progress-fill progress-oxygen" style="width:{{ $s->oxygen / $s->max_oxygen * 100 }}%"></div>
                                </div>
                                <span style="margin-left:5px;">{{ $s->oxygen }}%</span>
                            </td>
                            <td>
                                <div class="progress-bar" style="width:60px;display:inline-block;vertical-align:middle;">
                                    <div class="progress-fill progress-durability" style="width:{{ $s->equipment_durability / $s->max_durability * 100 }}%"></div>
                                </div>
                                <span style="margin-left:5px;">{{ $s->equipment_durability }}%</span>
                            </td>
                            <td><strong class="text-info">{{ $s->score }}</strong></td>
                            <td>
                                @if($s->status === 'playing')
                                    <a href="{{ route('game.show', $s) }}" class="btn btn-primary btn-sm">继续</a>
                                @endif
                                <a href="{{ route('game.result', $s) }}" class="btn btn-secondary btn-sm">结算</a>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @else
            <div class="text-muted text-center" style="padding:40px 0;">
                暂无探险记录，开始你的第一次冒险吧！
            </div>
        @endif
    </div>
</div>
@endsection
