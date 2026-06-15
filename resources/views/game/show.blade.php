@extends('layouts.app')

@section('title', "探险 #{$session->id} - 钟乳洞声波测距探险游戏")

@section('content')
<input type="hidden" id="sessionId" value="{{ $session->id }}">
<input type="hidden" id="probeUrl" value="{{ route('game.probe', $session) }}">
<input type="hidden" id="moveUrl" value="{{ route('game.move', $session) }}">
<input type="hidden" id="rollbackUrl" value="{{ route('game.rollback', $session) }}">
<input type="hidden" id="mapDataUrl" value="{{ route('game.map-data', $session) }}">
<input type="hidden" id="endUrl" value="{{ route('game.end', $session) }}">

@if($session->status !== 'playing')
    <div class="alert alert-danger">
        ⚠️ 本局探险已结束（{{ $session->status === 'completed' ? '已完成' : ($session->status === 'failed' ? '已失败' : '已放弃') }}）。
        <a href="{{ route('game.result', $session) }}" class="btn btn-primary btn-sm" style="margin-left:10px;">查看结算</a>
    </div>
@endif

<div class="grid grid-4 mb-20">
    <div class="stat-box">
        <div class="stat-value" id="oxygenValue">{{ $session->oxygen }}</div>
        <div class="stat-label">🫁 氧气 ({{ $session->oxygen }}/{{ $session->max_oxygen }})</div>
        <div class="progress-bar">
            <div class="progress-fill progress-oxygen" id="oxygenBar" style="width:{{ $session->oxygen / $session->max_oxygen * 100 }}%"></div>
        </div>
    </div>
    <div class="stat-box">
        <div class="stat-value" id="durabilityValue">{{ $session->equipment_durability }}</div>
        <div class="stat-label">🔧 装备耐久 ({{ $session->equipment_durability }}/{{ $session->max_durability }})</div>
        <div class="progress-bar">
            <div class="progress-fill progress-durability" id="durabilityBar" style="width:{{ $session->equipment_durability / $session->max_durability * 100 }}%"></div>
        </div>
    </div>
    <div class="stat-box">
        <div class="stat-value" id="scoreValue">{{ $session->score }}</div>
        <div class="stat-label">🏆 当前分数</div>
        <div class="progress-bar">
            <div class="progress-fill progress-score" style="width:{{ min(100, $session->score / 20) }}%"></div>
        </div>
    </div>
    <div class="stat-box">
        <div class="stat-value">({{ $session->player_x }}, {{ $session->player_y }})</div>
        <div class="stat-label">📍 当前位置</div>
        <div class="text-muted" style="font-size:12px; margin-top:5px;">
            探测次数: {{ $session->probeRecords->count() }}
        </div>
    </div>
</div>

<div class="grid grid-2">
    <div>
        <div class="card">
            <div class="card-title flex flex-between">
                <span>🗺️ 洞穴地图 (玩家已探测区域)</span>
                <span>
                    <button id="toggleActualMap" class="btn btn-secondary btn-sm">👁️ 显示真实地图对比</button>
                </span>
            </div>
            <div class="cave-map" id="caveMap"></div>
            <div class="legend">
                <div class="legend-item"><div class="legend-color" style="background:#151520;"></div>未探测</div>
                <div class="legend-item"><div class="legend-color" style="background:#1a2a3a;"></div>通道</div>
                <div class="legend-item"><div class="legend-color" style="background:#4a4a5a;"></div>普通岩壁</div>
                <div class="legend-item"><div class="legend-color" style="background:#1e5f7a;"></div>潮湿墙面</div>
                <div class="legend-item"><div class="legend-color" style="background:#6b4a1e;"></div>裂隙</div>
                <div class="legend-item"><div class="legend-color" style="background:#5a1e1e;"></div>塌方</div>
                <div class="legend-item"><div class="legend-color" style="background:#00f2fe;"></div>玩家</div>
                <div class="legend-item"><div class="legend-color" style="background:#00e676;"></div>出口</div>
            </div>
            <div class="mt-10 text-muted" style="font-size:12px;">
                <span id="mapCoverage">覆盖率: 计算中...</span> |
                <span id="mapAccuracy">准确率: 计算中...</span>
            </div>
        </div>

        <div class="card">
            <div class="card-title">📡 声波探测控制</div>
            <div class="grid grid-2">
                <div class="form-group">
                    <label class="form-label">探测方向 (°): <span id="directionValue" class="text-info">0</span></label>
                    <input type="range" id="direction" class="form-range" min="0" max="360" value="0" step="1" @if($session->status !== 'playing') disabled @endif>
                    <div class="flex gap-10 mt-10">
                        @foreach([0, 45, 90, 135, 180, 225, 270, 315] as $d)
                            <button type="button" class="btn btn-secondary btn-sm set-direction" data-dir="{{ $d }}" @if($session->status !== 'playing') disabled @endif>{{ $d }}°</button>
                        @endforeach
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">探测频率 (kHz): <span id="frequencyValue" class="text-info">40</span></label>
                    <input type="range" id="frequency" class="form-range" min="10" max="100" value="40" step="1" @if($session->status !== 'playing') disabled @endif>
                    <div class="flex gap-10 mt-10">
                        @foreach([20, 30, 40, 50, 60, 80] as $f)
                            <button type="button" class="btn btn-secondary btn-sm set-frequency" data-freq="{{ $f }}" @if($session->status !== 'playing') disabled @endif>{{ $f }}kHz</button>
                        @endforeach
                    </div>
                    <div class="text-muted mt-10" style="font-size:11px;">推荐频率 30-55kHz，准确率较高</div>
                </div>
            </div>
            <div class="flex gap-10 mt-10">
                <button id="probeBtn" class="btn btn-primary" style="flex:1;" @if($session->status !== 'playing') disabled @endif>
                    📡 发射声波探测
                </button>
                <button id="moveBtn" class="btn btn-warning" style="flex:1;" @if($session->status !== 'playing') disabled @endif>
                    👣 点击地图移动
                </button>
            </div>
            <div id="moveHint" class="alert alert-warning mt-10 hidden">
                👆 点击地图上已探测的通道区域进行移动（单次移动不超过5格）
            </div>
        </div>
    </div>

    <div>
        <div class="card">
            <div class="card-title">📈 回声曲线分析</div>
            <canvas id="echoChart" height="180"></canvas>
            <div id="echoInfo" class="mt-10 text-muted" style="font-size:12px;">
                选择方向和频率后点击「发射声波探测」查看回声曲线
            </div>
        </div>

        <div class="card">
            <div class="card-title">📋 探测历史（可回滚）</div>
            <div style="max-height:240px; overflow-y:auto;">
                @if($session->probeHistories->count() > 0)
                    @foreach($session->probeHistories->reverse() as $h)
                        <div class="log-entry probe">
                            <div class="flex flex-between">
                                <div class="log-title">
                                    探测 #{{ $h->probeRecord->sequence_number ?? $h->id }}
                                    @if($h->probeResult)
                                        @if($h->probeResult->is_false_echo)
                                            <span class="badge badge-warning">假回声</span>
                                        @endif
                                        <span class="badge badge-info">{{ $h->probeResult->wall_type === 'normal' ? '岩壁' : ($h->probeResult->wall_type === 'wet' ? '潮湿' : ($h->probeResult->wall_type === 'crack' ? '裂隙' : ($h->probeResult->wall_type === 'collapse' ? '塌方' : '空洞'))) }}</span>
                                    @endif
                                    @if($h->rolled_back)
                                        <span class="badge badge-secondary">已回滚</span>
                                    @endif
                                </div>
                                <div>
                                    @if($h->rollback_available && !$h->rolled_back && $session->status === 'playing')
                                        <button type="button" class="btn btn-danger btn-sm rollback-btn" data-history-id="{{ $h->id }}">↩️ 回滚</button>
                                    @endif
                                </div>
                            </div>
                            <div class="log-message">
                                方向 {{ round($h->direction_used, 0) }}° · 频率 {{ $h->frequency_used }}kHz
                                @if($h->probeResult)
                                    · 距离 {{ $h->probeResult->measured_distance }}
                                    · 置信度 {{ round($h->probeResult->confidence * 100, 0) }}%
                                    · 消耗氧气 -{{ $h->probeResult->oxygen_used }} 耐久 -{{ $h->probeResult->durability_used }}
                                @endif
                            </div>
                        </div>
                    @endforeach
                @else
                    <div class="text-muted text-center" style="padding:20px;">暂无探测记录</div>
                @endif
            </div>
        </div>

        <div class="card">
            <div class="card-title flex flex-between">
                <span>📝 探险日志</span>
                <form action="{{ route('game.end', $session) }}" method="POST" onsubmit="return confirm('确定要结束本次探险吗？');">
                    @csrf
                    <button type="submit" class="btn btn-danger btn-sm" @if($session->status !== 'playing') disabled @endif>结束探险</button>
                </form>
            </div>
            <div style="max-height:280px; overflow-y:auto;" id="logContainer">
                @foreach($session->expeditionLogs as $log)
                    <div class="log-entry {{ $log->log_type }}">
                        <div class="log-title">{{ $log->title }}</div>
                        <div class="log-message">{{ $log->message }}</div>
                        <div class="log-meta">
                            {{ $log->created_at->format('H:i:s') }}
                            @if($log->oxygen_change !== 0)
                                · 氧气 <span class="{{ $log->oxygen_change > 0 ? 'text-success' : 'text-danger' }}">{{ $log->oxygen_change > 0 ? '+' : '' }}{{ $log->oxygen_change }}</span>
                            @endif
                            @if($log->durability_change !== 0)
                                · 耐久 <span class="{{ $log->durability_change > 0 ? 'text-success' : 'text-danger' }}">{{ $log->durability_change > 0 ? '+' : '' }}{{ $log->durability_change }}</span>
                            @endif
                        </div>
                    </div>
                @endforeach
            </div>
        </div>
    </div>
</div>

@endsection

@section('scripts')
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
let sessionId = document.getElementById('sessionId').value;
let probeUrl = document.getElementById('probeUrl').value;
let moveUrl = document.getElementById('moveUrl').value;
let rollbackUrl = document.getElementById('rollbackUrl').value;
let mapDataUrl = document.getElementById('mapDataUrl').value;

let currentMapData = null;
let isMovingMode = false;
let echoChart = null;

const directionSlider = document.getElementById('direction');
const frequencySlider = document.getElementById('frequency');
const directionValue = document.getElementById('directionValue');
const frequencyValue = document.getElementById('frequencyValue');

directionSlider?.addEventListener('input', e => directionValue.textContent = e.target.value);
frequencySlider?.addEventListener('input', e => frequencyValue.textContent = e.target.value);

document.querySelectorAll('.set-direction').forEach(btn => {
    btn.addEventListener('click', () => {
        directionSlider.value = btn.dataset.dir;
        directionValue.textContent = btn.dataset.dir;
    });
});

document.querySelectorAll('.set-frequency').forEach(btn => {
    btn.addEventListener('click', () => {
        frequencySlider.value = btn.dataset.freq;
        frequencyValue.textContent = btn.dataset.freq;
    });
});

document.getElementById('probeBtn')?.addEventListener('click', executeProbe);
document.getElementById('moveBtn')?.addEventListener('click', toggleMoveMode);

async function executeProbe() {
    const btn = document.getElementById('probeBtn');
    btn.disabled = true;
    btn.textContent = '探测中...';

    try {
        const result = await api(probeUrl, 'POST', {
            direction: parseFloat(directionSlider.value),
            frequency: parseFloat(frequencySlider.value),
        });

        drawEchoCurve(result.echo_curve, result.measured_distance, result.is_false_echo);
        updateStats(result.session);
        showProbeResult(result);
        await loadMapData();

    } catch (e) {
        alert('探测失败: ' + e.message);
    } finally {
        btn.disabled = false;
        btn.textContent = '📡 发射声波探测';
    }
}

function toggleMoveMode() {
    isMovingMode = !isMovingMode;
    const btn = document.getElementById('moveBtn');
    const hint = document.getElementById('moveHint');
    if (isMovingMode) {
        btn.classList.add('btn-primary');
        btn.classList.remove('btn-warning');
        btn.textContent = '❌ 取消移动';
        hint.classList.remove('hidden');
    } else {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-warning');
        btn.textContent = '👣 点击地图移动';
        hint.classList.add('hidden');
    }
}

function updateStats(session) {
    document.getElementById('oxygenValue').textContent = session.oxygen;
    document.getElementById('durabilityValue').textContent = session.equipment_durability;
    document.getElementById('oxygenBar').style.width = (session.oxygen / session.max_oxygen * 100) + '%';
    document.getElementById('durabilityBar').style.width = (session.equipment_durability / session.max_durability * 100) + '%';

    if (session.status !== 'playing') {
        setTimeout(() => location.reload(), 1000);
    }
}

function showProbeResult(result) {
    const info = document.getElementById('echoInfo');
    const wallLabels = { normal: '普通岩壁', wet: '潮湿墙面', crack: '裂隙', collapse: '塌方区域', empty: '空洞' };
    const wallType = wallLabels[result.wall_type] || result.wall_type;

    let html = `<div class="flex gap-10">`;
    html += `<span class="badge ${result.is_false_echo ? 'badge-warning' : 'badge-info'}">${result.is_false_echo ? '⚠️ 假回声' : '✓ 正常回波'}</span>`;
    html += `<span class="badge badge-secondary">${wallType}</span>`;
    html += `</div>`;
    html += `<div style="margin-top:8px;">`;
    html += `📏 测量距离: <strong class="text-info">${result.measured_distance}</strong>`;
    if (result.is_false_echo) {
        html += ` (实际: ${result.actual_distance})`;
    }
    html += ` · 🎯 置信度: <strong class="text-info">${Math.round(result.confidence * 100)}%</strong>`;
    html += ` · 🗺️ 新探测 ${result.revealed_count} 个点`;
    html += `</div>`;
    info.innerHTML = html;
}

function drawEchoCurve(curveData, measuredDistance, isFalseEcho) {
    const ctx = document.getElementById('echoChart').getContext('2d');

    const labels = curveData.map(p => p.t.toFixed(1));
    const data = curveData.map(p => p.amplitude);

    if (echoChart) echoChart.destroy();

    echoChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: '回声振幅',
                data,
                borderColor: '#4facfe',
                backgroundColor: 'rgba(79, 172, 254, 0.1)',
                fill: true,
                tension: 0.3,
                pointRadius: 0,
                borderWidth: 2,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                annotation: {
                    annotations: {
                        line1: {
                            type: 'line',
                            xMin: measuredDistance,
                            xMax: measuredDistance,
                            borderColor: isFalseEcho ? '#ffc107' : '#00e676',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            label: {
                                content: `探测距离 ${measuredDistance}`,
                                display: true,
                                backgroundColor: isFalseEcho ? '#ffc107' : '#00e676',
                                fontColor: '#000',
                            }
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: '时间 (ms)', color: '#8892b0' },
                    ticks: { color: '#8892b0', maxTicksLimit: 15 },
                    grid: { color: 'rgba(255,255,255,0.05)' },
                },
                y: {
                    title: { display: true, text: '振幅', color: '#8892b0' },
                    ticks: { color: '#8892b0' },
                    grid: { color: 'rgba(255,255,255,0.05)' },
                }
            }
        }
    });
}

async function loadMapData() {
    try {
        const data = await api(mapDataUrl);
        currentMapData = data;
        renderMap(data);
        document.getElementById('mapCoverage').textContent = `覆盖率: ${data.revealed_percentage}%`;
        document.getElementById('mapAccuracy').textContent = `准确率: ${data.accuracy_percentage}%`;
    } catch (e) {
        console.error(e);
    }
}

let showActualMap = false;
document.getElementById('toggleActualMap')?.addEventListener('click', () => {
    showActualMap = !showActualMap;
    if (currentMapData) renderMap(currentMapData);
});

function renderMap(data) {
    const container = document.getElementById('caveMap');
    let html = '';

    for (let y = 0; y < data.height; y++) {
        html += '<div class="map-row">';
        for (let x = 0; x < data.width; x++) {
            const cell = data.revealed_map[y][x];
            const isPlayer = data.player_x === x && data.player_y === y;
            const isExit = data.exit_x === x && data.exit_y === y;

            let cellClass = 'map-cell ';
            let title = `(${x}, ${y}) `;

            if (showActualMap) {
                const actualWall = data.actual_grid[y][x] === 1;
                const wallInfo = data.actual_walls[`${x},${y}`];
                if (isPlayer) {
                    cellClass += 'cell-path player';
                    title += '玩家位置';
                } else if (isExit) {
                    cellClass += 'cell-path exit';
                    title += '出口';
                } else if (actualWall) {
                    const wallType = wallInfo?.type || 'normal';
                    cellClass += 'cell-' + wallType;
                    title += `真实:${wallType}`;
                } else {
                    cellClass += 'cell-path';
                    title += '真实:通道';
                }
                if (cell.revealed && cell.type !== 'unknown') {
                    const revealedWall = cell.type !== 'path';
                    if (revealedWall !== actualWall) {
                        cellClass += ' cell-conf-low';
                        title += ' [探测错误]';
                    }
                }
            } else {
                if (isPlayer) {
                    cellClass += 'cell-path player';
                    title += '玩家位置';
                } else if (isExit && cell.revealed) {
                    cellClass += 'cell-path exit';
                    title += '出口';
                } else if (!cell.revealed) {
                    cellClass += 'cell-unknown';
                    title += '未探测';
                } else {
                    cellClass += 'cell-' + (cell.type === 'unknown' ? 'unknown' : cell.type);
                    if (cell.confidence < 0.5) cellClass += ' cell-conf-low';
                    else if (cell.confidence < 0.75) cellClass += ' cell-conf-med';
                    else cellClass += ' cell-conf-high';
                    title += `${cell.type} ${Math.round(cell.confidence * 100)}%`;
                }
            }

            const clickable = isMovingMode && cell.revealed && (cell.type === 'path' || isPlayer || isExit);
            html += `<div class="${cellClass}" title="${title}" data-x="${x}" data-y="${y}" ${clickable ? 'style="cursor:pointer;"' : ''}></div>`;
        }
        html += '</div>';
    }

    container.innerHTML = html;

    container.querySelectorAll('.map-cell').forEach(cell => {
        cell.addEventListener('click', () => {
            if (!isMovingMode) return;
            const x = parseInt(cell.dataset.x);
            const y = parseInt(cell.dataset.y);
            movePlayer(x, y);
        });
    });
}

async function movePlayer(x, y) {
    try {
        const result = await api(moveUrl, 'POST', { x, y });
        updateStats(result.session);
        if (result.reached_exit) {
            alert('🎉 恭喜！你找到了洞穴出口！');
        }
        isMovingMode = false;
        document.getElementById('moveBtn').classList.remove('btn-primary');
        document.getElementById('moveBtn').classList.add('btn-warning');
        document.getElementById('moveBtn').textContent = '👣 点击地图移动';
        document.getElementById('moveHint').classList.add('hidden');
        await loadMapData();
        location.reload();
    } catch (e) {
        alert('移动失败: ' + e.message);
    }
}

document.querySelectorAll('.rollback-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        if (!confirm('确定回滚这次探测吗？将恢复地图状态并部分返还资源。')) return;
        try {
            const result = await api(rollbackUrl, 'POST', { probe_history_id: parseInt(btn.dataset.historyId) });
            alert(`回滚成功！返还氧气 ${result.oxygen_refund}，装备耐久 ${result.durability_refund}`);
            updateStats(result.session);
            await loadMapData();
            location.reload();
        } catch (e) {
            alert('回滚失败: ' + e.message);
        }
    });
});

loadMapData();
</script>
@endsection
