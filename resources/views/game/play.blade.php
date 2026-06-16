@extends('layouts.app')

@section('title', '档案馆 - 索引修复中')

@section('head')
<style>
    .game-container {
        display: flex;
        gap: 20px;
        min-height: 500px;
    }
    .game-main {
        flex: 1;
        display: flex;
        flex-direction: column;
    }
    .game-sidebar {
        width: 340px;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .floors {
        display: flex;
        flex-direction: column;
        gap: 12px;
        flex: 1;
    }
    .floor {
        background: #0f3460;
        border-radius: 8px;
        padding: 16px;
        min-height: 120px;
        border: 2px solid #2a2a6a;
        transition: all 0.2s;
    }
    .floor.drag-over {
        border-color: #d4af37;
        background: #1a4a7a;
    }
    .floor-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid #2a2a6a;
    }
    .floor-title {
        font-weight: 600;
        color: #d4af37;
    }
    .floor-count {
        font-size: 12px;
        color: #888;
        background: #1a1a2e;
        padding: 2px 8px;
        border-radius: 4px;
    }
    .floor-boxes {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        min-height: 60px;
    }

    .unplaced-area {
        background: #1a1a2e;
        border: 2px dashed #3a3a5a;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
    }
    .unplaced-area h4 {
        color: #888;
        margin-bottom: 12px;
        font-size: 14px;
    }
    .unplaced-boxes {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        min-height: 70px;
    }

    .archive-box {
        width: 80px;
        height: 60px;
        border-radius: 6px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: grab;
        user-select: none;
        transition: all 0.15s;
        border: 2px solid rgba(255,255,255,0.2);
        position: relative;
    }
    .archive-box:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    }
    .archive-box.dragging {
        opacity: 0.5;
        cursor: grabbing;
    }
    .archive-box .label {
        font-weight: 700;
        font-size: 14px;
        color: white;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
    }
    .archive-box .meta {
        font-size: 9px;
        color: rgba(255,255,255,0.85);
        margin-top: 2px;
    }
    .archive-box.correct {
        box-shadow: 0 0 0 2px #10b981;
    }
    .archive-box.wrong {
        box-shadow: 0 0 0 2px #ef4444;
    }

    .clue-list {
        max-height: 300px;
        overflow-y: auto;
        list-style: none;
    }
    .clue-item {
        padding: 10px 12px;
        margin-bottom: 6px;
        background: #0f3460;
        border-radius: 6px;
        font-size: 13px;
        line-height: 1.5;
        cursor: pointer;
        transition: all 0.2s;
        border-left: 3px solid transparent;
    }
    .clue-item:hover {
        background: #1a4a7a;
    }
    .clue-item.marked-noise {
        opacity: 0.5;
        text-decoration: line-through;
        border-left-color: #ef4444;
    }
    .clue-item.confirmed-true {
        border-left-color: #10b981;
    }
    .clue-item.confirmed-false {
        border-left-color: #ef4444;
        text-decoration: line-through;
        opacity: 0.7;
    }

    .game-stats {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
        color: #aaa;
        padding: 10px 0;
        border-bottom: 1px solid #2a2a4a;
        margin-bottom: 12px;
    }
    .game-stats .value {
        color: #d4af37;
        font-weight: 600;
    }

    .action-buttons {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }
    .action-buttons .btn {
        flex: 1;
        text-align: center;
        min-width: 80px;
    }

    .timer {
        font-family: monospace;
        font-size: 18px;
        color: #d4af37;
        text-align: center;
        padding: 8px;
        background: #0f3460;
        border-radius: 6px;
    }

    .selected-box-info {
        background: #0f3460;
        border-radius: 6px;
        padding: 12px;
        margin-top: 8px;
        font-size: 13px;
    }
    .selected-box-info h4 {
        color: #d4af37;
        margin-bottom: 8px;
    }
    .selected-box-info .info-row {
        display: flex;
        justify-content: space-between;
        padding: 3px 0;
        color: #aaa;
    }
    .selected-box-info .info-row span:last-child {
        color: #e0e0e0;
    }

    .result-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }
    .result-content {
        background: #16213e;
        border-radius: 12px;
        padding: 30px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        border: 1px solid #4a4a6a;
    }
    .result-content h2 {
        text-align: center;
        margin-bottom: 20px;
        font-size: 1.8em;
    }
    .result-win { color: #10b981; }
    .result-lose { color: #ef4444; }
    .score-breakdown {
        background: #0f3460;
        border-radius: 8px;
        padding: 16px;
        margin: 16px 0;
    }
    .score-row {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        border-bottom: 1px solid #2a2a6a;
    }
    .score-row:last-child { border-bottom: none; }
    .score-row.positive span:last-child { color: #10b981; }
    .score-row.negative span:last-child { color: #ef4444; }
    .score-row.total {
        font-weight: 700;
        font-size: 1.2em;
        padding-top: 12px;
        border-top: 2px solid #d4af37;
        border-bottom: none;
        margin-top: 8px;
    }
    .score-row.total span:last-child { color: #d4af37; }

    .box-results {
        margin-top: 16px;
    }
    .box-result-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        background: #0f3460;
        border-radius: 4px;
        margin-bottom: 4px;
        font-size: 12px;
    }
    .box-result-item .box-mini {
        width: 24px;
        height: 20px;
        border-radius: 3px;
    }
    .box-result-item.correct .status { color: #10b981; }
    .box-result-item.wrong .status { color: #ef4444; }
    .box-result-item.unplaced .status { color: #f59e0b; }

    .clue-results {
        margin-top: 16px;
    }
    .clue-result-item {
        padding: 6px 8px;
        background: #0f3460;
        border-radius: 4px;
        margin-bottom: 4px;
        font-size: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .clue-result-item.true .label { color: #10b981; }
    .clue-result-item.false .label { color: #ef4444; }

    .back-btn {
        display: block;
        text-align: center;
        margin-top: 20px;
    }
</style>
@endsection

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

<div class="game-container">
    <div class="game-main">
        <div class="card" style="flex: 1; display: flex; flex-direction: column;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h2 id="levelTitle" style="margin-bottom: 0;">加载中...</h2>
                <div class="timer" id="gameTimer">00:00</div>
            </div>

            <div class="game-stats">
                <span>操作次数：<span class="value" id="opCount">0</span></span>
                <span>撤销次数：<span class="value" id="undoCount">0</span></span>
                <span>已放置：<span class="value" id="placedCount">0</span>/<span id="totalCount">0</span></span>
            </div>

            <div class="unplaced-area">
                <h4>📦 待归位档案盒（拖拽到对应楼层）</h4>
                <div class="unplaced-boxes" id="unplacedBoxes" data-floor="null">
                </div>
            </div>

            <div class="floors" id="floorsContainer">
            </div>
        </div>
    </div>

    <div class="game-sidebar">
        <div class="card">
            <h2>🔍 线索档案</h2>
            <p style="font-size: 12px; color: #888; margin-bottom: 10px;">
                点击线索标记为「噪声」（你认为是假线索）
            </p>
            <ul class="clue-list" id="clueList">
            </ul>
        </div>

        <div class="card" id="selectedBoxCard" style="display: none;">
            <h2>📋 档案盒信息</h2>
            <div class="selected-box-info" id="selectedBoxInfo">
            </div>
        </div>

        <div class="card">
            <h2>⚙️ 操作</h2>
            <div class="action-buttons" style="margin-bottom: 12px;">
                <button class="btn btn-secondary" onclick="undoMove()" id="undoBtn">↩ 撤销</button>
                <button class="btn btn-secondary" onclick="resetLevel()">🔄 重置</button>
            </div>
            <button class="btn" onclick="submitReport()" style="width: 100%;" id="submitBtn">
                📝 提交结案报告
            </button>
        </div>
    </div>
</div>

<div class="result-modal hidden" id="resultModal">
    <div class="result-content">
        <h2 id="resultTitle">结案报告</h2>
        <div id="resultBody"></div>
        <a href="{{ route('game.index') }}" class="btn back-btn">返回大厅</a>
    </div>
</div>
@endsection

@section('scripts')
<script>
let gameState = null;
let sessionId = null;
let markedNoiseClues = new Set();
let timerInterval = null;
let startTime = null;
let selectedBoxId = null;
let totalBoxCount = 0;

function getSessionId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('session');
}

function init() {
    sessionId = getSessionId();
    if (!sessionId) {
        window.location.href = '/';
        return;
    }
    loadGameState();
}

function loadGameState() {
    fetch('/game/' + sessionId + '/state')
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                gameState = data.game_state;
                totalBoxCount = gameState.boxes_info.length;
                renderGame();
                startTimer();
                if (data.session_status !== 'playing') {
                    showResults(gameState.final_result, data.session_status);
                }
            } else {
                alert(data.error || '加载失败');
                window.location.href = '/';
            }
        });
}

function renderGame() {
    document.getElementById('levelTitle').textContent = gameState.level_name;
    document.getElementById('opCount').textContent = gameState.operation_count;
    document.getElementById('undoCount').textContent = gameState.undo_count;

    const placed = Object.values(gameState.floor_groups).reduce((sum, boxes) => sum + boxes.length, 0);
    document.getElementById('placedCount').textContent = placed;
    document.getElementById('totalCount').textContent = totalBoxCount;

    renderFloors();
    renderUnplacedBoxes();
    renderClues();
}

function renderFloors() {
    const container = document.getElementById('floorsContainer');
    container.innerHTML = '';

    for (let i = 1; i <= gameState.floor_count; i++) {
        const floor = document.createElement('div');
        floor.className = 'floor';
        floor.dataset.floor = i;
        floor.id = 'floor-' + i;

        const boxes = gameState.floor_groups[i] || [];

        floor.innerHTML = `
            <div class="floor-header">
                <span class="floor-title">🏛 第 ${i} 层</span>
                <span class="floor-count">${boxes.length} 个档案盒</span>
            </div>
            <div class="floor-boxes" data-floor="${i}"></div>
        `;

        const boxesContainer = floor.querySelector('.floor-boxes');
        boxes.forEach(box => {
            boxesContainer.appendChild(createBoxElement(box));
        });

        setupDropTarget(floor.querySelector('.floor-boxes'), i);

        container.appendChild(floor);
    }
}

function renderUnplacedBoxes() {
    const container = document.getElementById('unplacedBoxes');
    container.innerHTML = '';

    gameState.unplaced_boxes.forEach(box => {
        container.appendChild(createBoxElement(box));
    });
}

function createBoxElement(box) {
    const el = document.createElement('div');
    el.className = 'archive-box';
    el.draggable = true;
    el.dataset.boxId = box.id;
    el.style.backgroundColor = box.color;
    el.innerHTML = `
        <span class="label">${box.label}</span>
        <span class="meta">${box.classification}</span>
    `;

    el.addEventListener('dragstart', handleDragStart);
    el.addEventListener('dragend', handleDragEnd);
    el.addEventListener('click', () => selectBox(box.id));

    return el;
}

function selectBox(boxId) {
    selectedBoxId = boxId;
    const box = gameState.boxes_info.find(b => b.id === boxId);
    if (!box) return;

    const card = document.getElementById('selectedBoxCard');
    const info = document.getElementById('selectedBoxInfo');
    card.style.display = 'block';

    info.innerHTML = `
        <h4>${box.label}</h4>
        <div class="info-row"><span>年代</span><span>${box.era}</span></div>
        <div class="info-row"><span>密级</span><span>${box.classification}</span></div>
    `;

    document.querySelectorAll('.archive-box').forEach(el => {
        el.style.outline = '';
        if (parseInt(el.dataset.boxId) === boxId) {
            el.style.outline = '2px solid #d4af37';
        }
    });
}

function renderClues() {
    const list = document.getElementById('clueList');
    list.innerHTML = '';

    gameState.clues.forEach(clue => {
        const li = document.createElement('li');
        li.className = 'clue-item';
        li.dataset.clueId = clue.id;
        if (markedNoiseClues.has(clue.id)) {
            li.classList.add('marked-noise');
        }
        li.innerHTML = `
            <span>📎 ${clue.content}</span>
        `;
        li.addEventListener('click', () => toggleNoiseMark(clue.id));
        list.appendChild(li);
    });
}

function toggleNoiseMark(clueId) {
    if (markedNoiseClues.has(clueId)) {
        markedNoiseClues.delete(clueId);
    } else {
        markedNoiseClues.add(clueId);
    }
    renderClues();
}

let draggedBoxId = null;

function handleDragStart(e) {
    draggedBoxId = parseInt(e.target.dataset.boxId);
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.floor-boxes, .unplaced-boxes').forEach(el => {
        el.classList.remove('drag-over');
    });
}

function setupDropTarget(element, floor) {
    element.addEventListener('dragover', (e) => {
        e.preventDefault();
        element.classList.add('drag-over');
    });

    element.addEventListener('dragleave', () => {
        element.classList.remove('drag-over');
    });

    element.addEventListener('drop', (e) => {
        e.preventDefault();
        element.classList.remove('drag-over');
        if (draggedBoxId !== null) {
            moveBox(draggedBoxId, floor === 'null' ? null : floor);
        }
    });
}

setupDropTarget(document.getElementById('unplacedBoxes'), null);

function moveBox(boxId, toFloor) {
    fetch('/game/' + sessionId + '/move', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': '{{ csrf_token() }}',
        },
        body: JSON.stringify({
            box_id: boxId,
            to_floor: toFloor
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success && data.changed) {
            refreshState();
        }
    });
}

function refreshState() {
    fetch('/game/' + sessionId + '/state')
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                gameState = data.game_state;
                renderGame();
            }
        });
}

function undoMove() {
    fetch('/game/' + sessionId + '/undo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': '{{ csrf_token() }}',
        }
    })
    .then(r => r.json())
    .then(data => {
        if (data.success && data.undone) {
            refreshState();
        } else if (!data.undone) {
            alert('没有可撤销的操作');
        }
    });
}

function resetLevel() {
    if (!confirm('确定要重置本关吗？所有操作将被清除。')) return;

    fetch('/game/start/' + gameState.level_id, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': '{{ csrf_token() }}',
        }
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            sessionId = data.session_id;
            markedNoiseClues.clear();
            history.replaceState(null, '', '/play?session=' + sessionId);
            gameState = data.game_state;
            renderGame();
            resetTimer();
            startTimer();
        }
    });
}

function submitReport() {
    const placedCount = Object.values(gameState.floor_groups).reduce((sum, boxes) => sum + boxes.length, 0);

    if (placedCount < totalBoxCount) {
        if (!confirm(`还有 ${totalBoxCount - placedCount} 个档案盒未放置，确定提交吗？`)) {
            return;
        }
    }

    if (!confirm('确定提交结案报告？提交后无法修改。')) return;

    fetch('/game/' + sessionId + '/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': '{{ csrf_token() }}',
        },
        body: JSON.stringify({
            noise_clue_ids: Array.from(markedNoiseClues),
            notes: ''
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            stopTimer();
            if (data.game_state) {
                gameState = data.game_state;
            }
            showResults(data.result, data.session_status);
        } else {
            alert(data.error || '提交失败');
        }
    });
}

function showResults(result, status) {
    const modal = document.getElementById('resultModal');
    const title = document.getElementById('resultTitle');
    const body = document.getElementById('resultBody');

    title.className = status === 'won' ? 'result-win' : 'result-lose';
    title.textContent = status === 'won' ? '🎉 结案成功！' : '📋 结案失败';

    let html = '';

    html += '<div class="score-breakdown">';
    html += '<div class="score-row"><span>基础分</span><span>' + result.base_score + '</span></div>';
    html += '<div class="score-row ' + (result.placement_score >= 0 ? 'positive' : 'negative') + '">';
    html += '<span>放置得分（正确' + result.correct_count + '，错误' + result.wrong_count + '）</span>';
    html += '<span>' + (result.placement_score >= 0 ? '+' : '') + result.placement_score + '</span></div>';
    if (result.undo_penalty > 0) {
        html += '<div class="score-row negative"><span>撤销惩罚（' + result.undo_count + '次）</span><span>-' + result.undo_penalty + '</span></div>';
    }
    if (result.perfect_bonus > 0) {
        html += '<div class="score-row positive"><span>完美通关奖励</span><span>+' + result.perfect_bonus + '</span></div>';
    }
    if (result.time_bonus > 0) {
        html += '<div class="score-row positive"><span>时间奖励</span><span>+' + result.time_bonus + '</span></div>';
    }
    if (result.noise_clue_bonus !== 0) {
        html += '<div class="score-row ' + (result.noise_clue_bonus >= 0 ? 'positive' : 'negative') + '">';
        html += '<span>噪声线索识别</span><span>' + (result.noise_clue_bonus >= 0 ? '+' : '') + result.noise_clue_bonus + '</span></div>';
    }
    html += '<div class="score-row total"><span>最终得分</span><span>' + result.final_score + '</span></div>';
    html += '</div>';

    html += '<p style="color: #aaa; font-size: 13px;">用时：' + formatTime(result.time_taken_seconds) + '</p>';

    html += '<div class="box-results">';
    html += '<h3 style="color: #d4af37; margin-bottom: 10px; font-size: 14px;">档案盒详情</h3>';
    result.box_details.forEach(box => {
        let statusClass = 'unplaced';
        let statusText = '未放置';
        if (box.is_correct) {
            statusClass = 'correct';
            statusText = '✓ 正确';
        } else if (!box.is_unplaced) {
            statusClass = 'wrong';
            statusText = '✗ 错误（应为第' + box.correct_floor + '层）';
        }
        const boxInfo = gameState.boxes_info.find(b => b.id === box.box_id);
        const color = boxInfo ? boxInfo.color : '#888';
        html += '<div class="box-result-item ' + statusClass + '">';
        html += '<div class="box-mini" style="background: ' + color + ';"></div>';
        html += '<span>' + box.label + '（' + box.era + '·' + box.classification + '）</span>';
        html += '<span class="status">' + statusText + '</span>';
        html += '</div>';
    });
    html += '</div>';

    html += '<div class="clue-results">';
    html += '<h3 style="color: #d4af37; margin-bottom: 10px; font-size: 14px;">线索真相</h3>';
    gameState.clues.forEach(clue => {
        const isTrue = !isClueNoise(clue.id);
        const markedAsNoise = markedNoiseClues.has(clue.id);
        let label = isTrue ? '✓ 真线索' : '✗ 噪声线索';
        let cls = isTrue ? 'true' : 'false';
        html += '<div class="clue-result-item ' + cls + '">';
        html += '<span style="flex: 1; font-size: 11px;">' + clue.content + '</span>';
        html += '<span class="label">' + label + '</span>';
        html += '</div>';
    });
    html += '</div>';

    body.innerHTML = html;
    modal.classList.remove('hidden');

    document.getElementById('submitBtn').disabled = true;
    document.getElementById('undoBtn').disabled = true;
}

function isClueNoise(clueId) {
    const clue = gameState.clues.find(c => c.id === clueId);
    if (!clue) return false;
    return clue.is_noise === true;
}

function startTimer() {
    startTime = Date.now();
    if (gameState.operation_count > 0) {
    }
    timerInterval = setInterval(updateTimer, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function resetTimer() {
    stopTimer();
    document.getElementById('gameTimer').textContent = '00:00';
}

function updateTimer() {
    if (!startTime) return;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    document.getElementById('gameTimer').textContent = formatTime(elapsed);
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

document.addEventListener('DOMContentLoaded', init);
</script>
@endsection
