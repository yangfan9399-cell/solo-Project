@extends('layouts.app')

@section('title', "探险结算 #{$session->id} - 钟乳洞声波测距探险游戏")

@section('content')
<input type="hidden" id="sessionId" value="{{ $session->id }}">
<input type="hidden" id="mapDataUrl" value="{{ route('game.map-data', $session) }}">

<div class="card">
    <div class="card-title flex flex-between">
        <span>
            🏆 探险结算报告 - {{ $session->player_name }}
            @if($session->status === 'completed')
                <span class="badge badge-success">探险成功</span>
            @elseif($session->status === 'failed')
                <span class="badge badge-danger">探险失败</span>
            @else
                <span class="badge badge-secondary">探险中止</span>
            @endif
        </span>
        <span class="text-muted" style="font-size:13px;">
            {{ $session->start_time->format('Y-m-d H:i') }} ~ {{ $session->end_time?->format('H:i') ?? '进行中' }}
        </span>
    </div>

    @if($session->final_notes)
        <div class="alert {{ $session->status === 'completed' ? 'alert-success' : ($session->status === 'failed' ? 'alert-danger' : 'alert-warning') }}">
            {{ $session->final_notes }}
        </div>
    @endif

    <div class="grid grid-4 mb-20">
        <div class="stat-box">
            <div class="stat-value text-info">{{ $finalScore }}</div>
            <div class="stat-label">🎯 最终得分 (后端重算)</div>
        </div>
        <div class="stat-box">
            <div class="stat-value text-success">{{ $session->oxygen }}%</div>
            <div class="stat-label">🫁 剩余氧气</div>
            <div class="progress-bar">
                <div class="progress-fill progress-oxygen" style="width:{{ $session->oxygen / $session->max_oxygen * 100 }}%"></div>
            </div>
        </div>
        <div class="stat-box">
            <div class="stat-value text-warning">{{ $session->equipment_durability }}%</div>
            <div class="stat-label">🔧 剩余装备耐久</div>
            <div class="progress-bar">
                <div class="progress-fill progress-durability" style="width:{{ $session->equipment_durability / $session->max_durability * 100 }}%"></div>
            </div>
        </div>
        <div class="stat-box">
            <div class="stat-value">{{ $session->probeRecords->count() }}</div>
            <div class="stat-label">📡 总探测次数</div>
            <div class="text-muted" style="font-size:12px; margin-top:5px;">
                移动: {{ $session->expeditionLogs->where('log_type', 'move')->count() }} 次
            </div>
        </div>
    </div>

    <div class="grid grid-2">
        <div class="card" style="margin-bottom:0;">
            <div class="card-title">📊 分数明细 (按局次明细重算)</div>
            <table class="table">
                <tbody>
                    <tr>
                        <td>🗺️ 地图绘制得分</td>
                        <td class="text-right">
                            <strong class="text-info">{{ $scoreBreakdown['map_reveal'] }}</strong>
                            <div class="text-muted" style="font-size:11px;">根据探测覆盖率、准确率和危险墙面识别</div>
                        </td>
                    </tr>
                    <tr>
                        <td>🎯 探测准确率得分</td>
                        <td class="text-right">
                            <strong class="text-info">{{ $scoreBreakdown['accuracy'] }}</strong>
                            <div class="text-muted" style="font-size:11px;">根据假回声率和测距误差</div>
                        </td>
                    </tr>
                    <tr>
                        <td>⚡ 资源效率得分</td>
                        <td class="text-right">
                            <strong class="text-info">{{ $scoreBreakdown['efficiency'] }}</strong>
                            <div class="text-muted" style="font-size:11px;">根据氧气使用、装备损耗和回滚率</div>
                        </td>
                    </tr>
                    <tr>
                        <td>💪 生存状态得分</td>
                        <td class="text-right">
                            <strong class="text-info">{{ $scoreBreakdown['survival'] }}</strong>
                            <div class="text-muted" style="font-size:11px;">根据剩余氧气和装备耐久</div>
                        </td>
                    </tr>
                    <tr>
                        <td>🏁 完成度奖励</td>
                        <td class="text-right">
                            <strong class="text-success">{{ $scoreBreakdown['completion'] }}</strong>
                            <div class="text-muted" style="font-size:11px;">完成探险 +500，到达出口 +200</div>
                        </td>
                    </tr>
                    <tr>
                        <td>⚠️ 危险墙面识别</td>
                        <td class="text-right">
                            <strong class="text-info">{{ $scoreBreakdown['hazard'] }}</strong>
                            <div class="text-muted" style="font-size:11px;">潮湿+8 / 裂隙+12 / 塌方+18</div>
                        </td>
                    </tr>
                    <tr style="border-top:2px solid rgba(79,172,254,0.3);">
                        <td><strong>🏆 总分</strong></td>
                        <td class="text-right"><strong class="stat-value text-info" style="font-size:22px;">{{ $scoreBreakdown['total'] }}</strong></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="card" style="margin-bottom:0;">
            <div class="card-title flex flex-between">
                <span>🗺️ 地图拼接对比 (探测 vs 真实)</span>
                <span>
                    <button id="toggleDiffView" class="btn btn-secondary btn-sm">切换差异视图</button>
                </span>
            </div>
            <div class="cave-map" id="caveMap"></div>
            <div class="legend">
                <div class="legend-item"><div class="legend-color" style="background:#151520;"></div>未探测</div>
                <div class="legend-item"><div class="legend-color" style="background:#1a2a3a;"></div>通道</div>
                <div class="legend-item"><div class="legend-color" style="background:#4a4a5a;"></div>岩壁</div>
                <div class="legend-item"><div class="legend-color" style="background:#f5576c;"></div>探测错误</div>
                <div class="legend-item"><div class="legend-color" style="background:#00f2fe;"></div>玩家起点</div>
                <div class="legend-item"><div class="legend-color" style="background:#00e676;"></div>出口</div>
            </div>
            <div class="mt-10" style="font-size:13px;">
                <span class="text-info">覆盖率: <strong id="coverageText">-</strong>%</span>
                <span style="margin:0 10px;">|</span>
                <span class="text-success">准确率: <strong id="accuracyText">-</strong>%</span>
                <span style="margin:0 10px;">|</span>
                <span class="text-danger">错误点: <strong id="errorText">-</strong></span>
            </div>
        </div>
    </div>
</div>

<div class="grid grid-2">
    <div class="card">
        <div class="card-title">📡 探测明细记录</div>
        <div style="max-height:400px; overflow-y:auto;">
            <table class="table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>方向</th>
                        <th>频率</th>
                        <th>墙面类型</th>
                        <th>测量距离</th>
                        <th>实际距离</th>
                        <th>置信度</th>
                        <th>假回声</th>
                        <th>消耗</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($session->probeHistories as $h)
                        @if($h->probeResult)
                            <tr>
                                <td>{{ $h->probeRecord->sequence_number ?? $h->id }}</td>
                                <td>{{ round($h->direction_used, 0) }}°</td>
                                <td>{{ $h->frequency_used }}kHz</td>
                                <td>
                                    @if($h->probeResult->wall_type === 'normal')
                                        <span class="badge badge-secondary">岩壁</span>
                                    @elseif($h->probeResult->wall_type === 'wet')
                                        <span class="badge badge-info">潮湿</span>
                                    @elseif($h->probeResult->wall_type === 'crack')
                                        <span class="badge badge-warning">裂隙</span>
                                    @elseif($h->probeResult->wall_type === 'collapse')
                                        <span class="badge badge-danger">塌方</span>
                                    @else
                                        <span class="badge badge-info">空洞</span>
                                    @endif
                                    @if($h->rolled_back)
                                        <span class="badge badge-secondary">已回滚</span>
                                    @endif
                                </td>
                                <td>{{ $h->probeResult->measured_distance }}</td>
                                <td class="{{ $h->probeResult->is_false_echo ? 'text-danger' : 'text-success' }}">
                                    {{ $h->probeResult->actual_distance ?? '-' }}
                                </td>
                                <td>{{ round($h->probeResult->confidence * 100, 0) }}%</td>
                                <td>
                                    @if($h->probeResult->is_false_echo)
                                        <span class="badge badge-warning">是</span>
                                    @else
                                        <span class="badge badge-success">否</span>
                                    @endif
                                </td>
                                <td>
                                    <span class="text-danger">-{{ $h->probeResult->oxygen_used }}O₂</span><br>
                                    <span class="text-warning">-{{ $h->probeResult->durability_used }}🔧</span>
                                </td>
                            </tr>
                        @endif
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>

    <div class="card">
        <div class="card-title">📝 探险日志 & 资源变化</div>
        <div style="max-height:400px; overflow-y:auto;">
            @foreach($session->expeditionLogs as $log)
                <div class="log-entry {{ $log->log_type }}">
                    <div class="flex flex-between">
                        <div class="log-title">{{ $log->title }}</div>
                        <div class="text-muted" style="font-size:11px;">{{ $log->created_at->format('H:i:s') }}</div>
                    </div>
                    <div class="log-message">{{ $log->message }}</div>
                    @if($log->oxygen_change !== 0 || $log->durability_change !== 0)
                        <div class="log-meta">
                            资源变化:
                            @if($log->oxygen_change !== 0)
                                氧气 <span class="{{ $log->oxygen_change > 0 ? 'text-success' : 'text-danger' }}">{{ $log->oxygen_change > 0 ? '+' : '' }}{{ $log->oxygen_change }}</span>
                            @endif
                            @if($log->durability_change !== 0)
                                · 耐久 <span class="{{ $log->durability_change > 0 ? 'text-success' : 'text-danger' }}">{{ $log->durability_change > 0 ? '+' : '' }}{{ $log->durability_change }}</span>
                            @endif
                        </div>
                    @endif
                    @if($log->details)
                        <div class="log-meta">
                            @if(isset($log->details['probe_record_id']))
                                探测记录 #{{ $log->details['probe_record_id'] }}
                            @endif
                            @if(isset($log->details['from_x']))
                                从 ({{ $log->details['from_x'] }}, {{ $log->details['from_y'] }}) 到 ({{ $log->details['to_x'] }}, {{ $log->details['to_y'] }})
                            @endif
                            @if(isset($log->details['oxygen_refund']))
                                回滚返还: 氧气+{{ $log->details['oxygen_refund'] }}, 耐久+{{ $log->details['durability_refund'] }}
                            @endif
                            @if(isset($log->details['final_score']))
                                <br>最终分数: {{ $log->details['final_score'] }}
                                @if(isset($log->details['score_breakdown']))
                                    (地图:{{ $log->details['score_breakdown']['map_reveal'] }} +
                                    准确:{{ $log->details['score_breakdown']['accuracy'] }} +
                                    效率:{{ $log->details['score_breakdown']['efficiency'] }} +
                                    生存:{{ $log->details['score_breakdown']['survival'] }} +
                                    完成:{{ $log->details['score_breakdown']['completion'] }} +
                                    危险:{{ $log->details['score_breakdown']['hazard'] }})
                                @endif
                            @endif
                        </div>
                    @endif
                </div>
            @endforeach
        </div>
    </div>
</div>

<div class="flex flex-center gap-20 mt-20 mb-20">
    <a href="{{ route('game.index') }}" class="btn btn-primary">🏠 返回大厅</a>
    @if($session->status === 'playing')
        <a href="{{ route('game.show', $session) }}" class="btn btn-warning">▶️ 继续探险</a>
    @endif
    <form action="{{ route('game.create') }}" method="POST">
        @csrf
        <input type="hidden" name="player_name" value="{{ $session->player_name }}">
        <button type="submit" class="btn btn-secondary">🔄 再玩一局</button>
    </form>
</div>

@endsection

@section('scripts')
<script>
let showDiffOnly = false;
let mapData = null;

document.getElementById('toggleDiffView')?.addEventListener('click', () => {
    showDiffOnly = !showDiffOnly;
    if (mapData) renderMap(mapData);
});

async function loadMapData() {
    try {
        const url = document.getElementById('mapDataUrl').value;
        mapData = await api(url);
        renderMap(mapData);
        document.getElementById('coverageText').textContent = mapData.revealed_percentage;
        document.getElementById('accuracyText').textContent = mapData.accuracy_percentage;
        document.getElementById('errorText').textContent = mapData.map_diff.differences.length;
    } catch (e) {
        console.error(e);
    }
}

function renderMap(data) {
    const container = document.getElementById('caveMap');
    let html = '';
    const errors = {};
    data.map_diff.differences.forEach(d => { errors[`${d.x},${d.y}`] = true; });

    for (let y = 0; y < data.height; y++) {
        html += '<div class="map-row">';
        for (let x = 0; x < data.width; x++) {
            const cell = data.revealed_map[y][x];
            const actualWall = data.actual_grid[y][x] === 1;
            const wallInfo = data.actual_walls[`${x},${y}`];
            const isPlayer = data.player_x === x && data.player_y === y;
            const isExit = data.exit_x === x && data.exit_y === y;
            const isError = errors[`${x},${y}`];

            let cellClass = 'map-cell ';
            let title = `(${x}, ${y}) `;

            if (showDiffOnly) {
                if (isError) {
                    cellClass += 'cell-collapse';
                    title += '探测错误';
                } else if (!cell.revealed) {
                    cellClass += 'cell-unknown';
                    title += '未探测';
                } else {
                    cellClass += actualWall ? 'cell-normal' : 'cell-path';
                    title += actualWall ? '真实:墙' : '真实:通道';
                    if (wallInfo && wallInfo.type !== 'normal') {
                        cellClass = 'map-cell cell-' + wallInfo.type;
                    }
                }
            } else {
                if (isPlayer) {
                    cellClass += 'cell-path player';
                    title += '玩家起点';
                } else if (isExit) {
                    cellClass += 'cell-path exit';
                    title += '出口';
                } else if (!cell.revealed) {
                    cellClass += 'cell-unknown';
                    title += '未探测';
                } else if (isError) {
                    cellClass += 'cell-collapse';
                    title += '探测错误';
                } else {
                    if (actualWall) {
                        const wallType = wallInfo?.type || 'normal';
                        cellClass += 'cell-' + wallType;
                        title += `真实:${wallType}`;
                    } else {
                        cellClass += 'cell-path';
                        title += '真实:通道';
                    }
                    if (cell.confidence < 0.5) cellClass += ' cell-conf-low';
                    else if (cell.confidence < 0.75) cellClass += ' cell-conf-med';
                }
            }

            html += `<div class="${cellClass}" title="${title}"></div>`;
        }
        html += '</div>';
    }

    container.innerHTML = html;
}

loadMapData();
</script>
@endsection
