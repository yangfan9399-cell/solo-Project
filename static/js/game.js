const gameState = {
    selectedTool: null,
    nodes: [],
    details: [],
    histories: [],
    isPlaying: false,
    gameStartTime: null,
    timerInterval: null,
    victimPosition: { x: 700, y: 150 },
    targetPosition: { x: 100, y: 400 },
    terrainZones: [],
    weatherEvents: [],
    currentStep: 0,
    isGameOver: false,
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const colors = {
    rock: '#6b7280',
    ice: '#7dd3fc',
    snow_cornice: '#f8fafc',
    anchor: '#3b82f6',
    pulley: '#f59e0b',
    protection: '#10b981',
    knot: '#8b5cf6',
    victim: '#ef4444',
    rescuer: '#8b5cf6',
    rope: '#e5e7eb',
    ropeStressed: '#f59e0b',
    ropeFailed: '#ef4444',
};

function init() {
    loadSessionState();
    setupEventListeners();
    startTimer();
    render();
}

function loadSessionState() {
    fetch(`/api/session/${SESSION_ID}/`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                gameState.nodes = data.nodes;
                gameState.details = data.details;
                gameState.histories = data.histories;

                if (data.seed) {
                    gameState.victimPosition = {
                        x: data.seed.victim_x,
                        y: data.seed.victim_y
                    };
                    gameState.targetPosition = {
                        x: data.seed.target_x,
                        y: data.seed.target_y
                    };

                    try {
                        const terrainMap = JSON.parse(data.seed.terrain_map.replace(/'/g, '"'));
                        gameState.terrainZones = terrainMap.zones || [];
                    } catch(e) {
                        gameState.terrainZones = [
                            { type: 'rock', x: 0, y: 0, width: 800, height: 500 }
                        ];
                    }

                    try {
                        const weatherEvents = JSON.parse(data.seed.weather_events.replace(/'/g, '"'));
                        gameState.weatherEvents = weatherEvents || [];
                    } catch(e) {
                        gameState.weatherEvents = [];
                    }
                }

                if (data.session.status === 'playing') {
                    gameState.isPlaying = true;
                    document.getElementById('startBtn').style.display = 'none';
                }

                updateNodeList();
                updateHistoryList();
                updateUI();
                render();
            }
        })
        .catch(err => console.error('加载状态失败:', err));
}

function setupEventListeners() {
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousemove', handleCanvasMove);

    document.querySelectorAll('.tool-item').forEach(item => {
        item.addEventListener('click', function() {
            selectTool(this.dataset.tool, this.dataset.type);
        });
    });

    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('calculateBtn').addEventListener('click', calculateLoads);
    document.getElementById('weatherBtn').addEventListener('click', simulateWeather);
    document.getElementById('rollbackBtn').addEventListener('click', rollbackToSafe);
    document.getElementById('completeBtn').addEventListener('click', completeGame);
}

function selectTool(tool, type) {
    gameState.selectedTool = { tool, type };
    document.querySelectorAll('.tool-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-tool="${tool}"]`).classList.add('active');
    document.getElementById('hintText').textContent = `已选择${getToolName(tool)}，点击地图放置`;
}

function getToolName(tool) {
    const names = {
        anchor: '锚点',
        pulley: '滑轮',
        protection: '保护站',
        knot: '绳结'
    };
    return names[tool] || tool;
}

function handleCanvasClick(e) {
    if (gameState.isGameOver) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (!gameState.selectedTool) {
        return;
    }

    const terrainType = getTerrainAtPosition(x, y);

    if (gameState.selectedTool.tool === 'pulley' || gameState.selectedTool.tool === 'protection') {
        addDetail(gameState.selectedTool.type, x, y, terrainType);
    } else {
        addNode(gameState.selectedTool.type, x, y, terrainType);
    }
}

function handleCanvasMove(e) {
    render();
}

function getTerrainAtPosition(x, y) {
    for (const zone of gameState.terrainZones) {
        if (x >= zone.x && x <= zone.x + zone.width &&
            y >= zone.y && y <= zone.y + zone.height) {
            return zone.type;
        }
    }
    return 'rock';
}

function addNode(nodeType, x, y, terrainType) {
    fetch(`/api/session/${SESSION_ID}/node/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            node_type: nodeType,
            x: x,
            y: y,
            terrain_type: terrainType
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            gameState.nodes.push(data.node);
            updateNodeList();
            updateUI();
            render();
        }
    })
    .catch(err => console.error('添加节点失败:', err));
}

function addDetail(detailType, x, y) {
    fetch(`/api/session/${SESSION_ID}/detail/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            detail_type: detailType,
            x: x,
            y: y
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            gameState.details.push(data.detail);
            updateNodeList();
            render();
        }
    })
    .catch(err => console.error('添加明细失败:', err));
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground();
    drawTerrainZones();
    drawTarget();
    drawRopes();
    drawNodes();
    drawDetails();
    drawVictim();
}

function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1e3a5f');
    gradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (let i = 0; i < 50; i++) {
        const x = (i * 73) % canvas.width;
        const y = (i * 37) % canvas.height;
        const r = Math.random() * 1.5 + 0.5;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawTerrainZones() {
    gameState.terrainZones.forEach(zone => {
        const color = colors[zone.type] || '#6b7280';

        ctx.fillStyle = color;
        ctx.globalAlpha = 0.6;
        ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
        ctx.globalAlpha = 1;

        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.font = '11px sans-serif';
        ctx.fillText(getTerrainName(zone.type), zone.x + 5, zone.y + 15);
    });
}

function getTerrainName(type) {
    const names = {
        rock: '岩壁 25KN',
        ice: '冰面 8KN',
        snow_cornice: '雪檐 3KN'
    };
    return names[type] || type;
}

function drawTarget() {
    const { x, y } = gameState.targetPosition;

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#10b981';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏁 终点', x, y + 40);
    ctx.textAlign = 'left';
}

function drawRopes() {
    const anchors = gameState.nodes.filter(n => n.node_type === 'anchor');
    if (anchors.length < 1) return;

    ctx.strokeStyle = colors.rope;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.7;

    if (anchors.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(anchors[0].x, anchors[0].y);
        for (let i = 1; i < anchors.length; i++) {
            ctx.lineTo(anchors[i].x, anchors[i].y);
        }
        ctx.stroke();
    }

    const lastAnchor = anchors[anchors.length - 1];
    ctx.beginPath();
    ctx.moveTo(lastAnchor.x, lastAnchor.y);
    ctx.lineTo(gameState.victimPosition.x, gameState.victimPosition.y);
    ctx.stroke();

    ctx.globalAlpha = 1;
}

function drawNodes() {
    gameState.nodes.forEach(node => {
        const color = colors[node.node_type] || '#6b7280';
        const radius = 12;

        ctx.fillStyle = node.is_valid === false ? '#ef4444' : color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();

        if (node.actual_load > 0 && node.load_capacity > 0) {
            const ratio = node.actual_load / node.load_capacity;
            const barWidth = 30;
            const barHeight = 4;
            const barX = node.x - barWidth / 2;
            const barY = node.y - radius - 10;

            ctx.fillStyle = '#333';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            ctx.fillStyle = ratio > 1 ? '#ef4444' : ratio > 0.8 ? '#f59e0b' : '#10b981';
            ctx.fillRect(barX, barY, barWidth * Math.min(ratio, 1), barHeight);
        }

        ctx.fillStyle = 'white';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(getNodeIcon(node.node_type), node.x, node.y + 4);
        ctx.textAlign = 'left';

        if (node.failure_reason) {
            ctx.fillStyle = '#ef4444';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('失效', node.x, node.y + radius + 14);
            ctx.textAlign = 'left';
        }
    });
}

function getNodeIcon(type) {
    const icons = {
        anchor: '⚓',
        pulley: '🔘',
        protection: '🛡',
        knot: '🔗',
        victim: '🧍',
        rescuer: '🚶'
    };
    return icons[type] || '●';
}

function drawDetails() {
    gameState.details.forEach(detail => {
        const color = detail.detail_type === 'pulley' ? '#f59e0b' : '#10b981';
        const size = 14;

        ctx.fillStyle = color;
        if (detail.detail_type === 'pulley') {
            ctx.beginPath();
            ctx.arc(detail.x, detail.y, size, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else {
            ctx.fillRect(detail.x - size, detail.y - size, size * 2, size * 2);
        }

        ctx.fillStyle = 'white';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(detail.detail_type === 'pulley' ? '滑' : '保', detail.x, detail.y + 3);
        ctx.textAlign = 'left';
    });
}

function drawVictim() {
    const { x, y } = gameState.victimPosition;

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🧍‍♂️', x, y + 4);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('被困者', x, y + 28);
    ctx.textAlign = 'left';
}

function updateNodeList() {
    const list = document.getElementById('nodeList');
    if (gameState.nodes.length === 0 && gameState.details.length === 0) {
        list.innerHTML = '<p class="empty-hint">暂无节点</p>';
        return;
    }

    let html = '';
    gameState.nodes.forEach(node => {
        const invalidClass = node.is_valid === false ? 'invalid' : '';
        html += `
            <div class="node-item ${invalidClass}">
                <div class="node-item-header">
                    <span class="node-item-name">${getNodeIcon(node.node_type)} ${getNodeTypeName(node.node_type)}</span>
                </div>
                <div class="node-item-load">
                    承力: ${node.load_capacity?.toFixed?.(1) || '?'} KN
                    ${node.actual_load > 0 ? ` | 受力: ${node.actual_load.toFixed(2)} KN` : ''}
                </div>
                ${node.failure_reason ? `<div style="color:#f87171;font-size:0.8em;margin-top:4px;">${node.failure_reason}</div>` : ''}
            </div>
        `;
    });

    gameState.details.forEach(detail => {
        html += `
            <div class="node-item">
                <div class="node-item-header">
                    <span class="node-item-name">${detail.detail_type === 'pulley' ? '🔘' : '🛡️'} ${getDetailTypeName(detail.detail_type)}</span>
                </div>
                <div class="node-item-load">
                    位置: (${detail.x.toFixed(0)}, ${detail.y.toFixed(0)})
                </div>
            </div>
        `;
    });

    list.innerHTML = html;
}

function getNodeTypeName(type) {
    const names = {
        anchor: '锚点',
        pulley: '滑轮',
        protection: '保护站',
        knot: '绳结',
        victim: '被困者',
        rescuer: '救援者'
    };
    return names[type] || type;
}

function getDetailTypeName(type) {
    const names = {
        pulley: '滑轮',
        protection: '保护站'
    };
    return names[type] || type;
}

function updateHistoryList() {
    const list = document.getElementById('historyList');
    if (gameState.histories.length === 0) {
        list.innerHTML = '<p class="empty-hint">暂无记录</p>';
        return;
    }

    let html = '';
    gameState.histories.slice(-10).forEach(h => {
        const dangerClass = !h.is_safe ? 'danger' : '';
        const weatherClass = h.action_type === 'weather' ? 'weather' : '';
        html += `
            <div class="history-item ${dangerClass} ${weatherClass}">
                <div style="font-weight:600;margin-bottom:2px;">步骤${h.step}</div>
                <div>${h.action}</div>
                ${h.remark ? `<div style="font-size:0.8em;color:#94a3b8;margin-top:2px;">${h.remark}</div>` : ''}
            </div>
        `;
    });

    list.innerHTML = html;
}

function updateUI() {
    document.getElementById('nodeCount').textContent = gameState.nodes.length;
    document.getElementById('stepCount').textContent = gameState.histories.length;

    const failedNodes = gameState.nodes.filter(n => n.is_valid === false);
    const warningPanel = document.getElementById('warningPanel');
    const warningContent = document.getElementById('warningContent');

    if (failedNodes.length > 0) {
        warningPanel.style.display = 'block';
        warningContent.innerHTML = `
            <p>检测到 <strong>${failedNodes.length}</strong> 个失效节点：</p>
            <ul>
                ${failedNodes.map(n => `<li>${getNodeTypeName(n.node_type)} - ${n.failure_reason}</li>`).join('')}
            </ul>
            <p style="margin-top:10px;">⚠️ 绳路可能失效，请重新布置节点</p>
        `;
    } else {
        warningPanel.style.display = 'none';
    }
}

function startGame() {
    const anchors = gameState.nodes.filter(n => n.node_type === 'anchor');
    if (anchors.length < 2) {
        alert('请至少布置2个锚点才能开始救援！');
        return;
    }

    const protections = gameState.details.filter(d => d.detail_type === 'protection');
    if (protections.length === 0) {
        if (!confirm('建议至少布置1个保护站以确保救援安全。是否继续？')) {
            return;
        }
    }

    fetch(`/api/session/${SESSION_ID}/start/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            gameState.isPlaying = true;
            gameState.gameStartTime = Date.now();
            document.getElementById('startBtn').style.display = 'none';
            document.getElementById('statusText').textContent = '进行中';
            document.getElementById('statusText').className = 'status-value status-playing';

            executeBackendTransfer();
        }
    })
    .catch(err => console.error('开始游戏失败:', err));
}

function executeBackendTransfer() {
    document.getElementById('hintText').textContent = '正在执行救援转移（后端计算每一步受力...）';

    fetch(`/api/session/${SESSION_ID}/transfer/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            start_x: gameState.victimPosition.x,
            start_y: gameState.victimPosition.y,
            end_x: gameState.targetPosition.x,
            end_y: gameState.targetPosition.y,
            steps: 20
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            gameState.transferSteps = data.steps;
            gameState.transferSuccess = data.transfer_success;
            gameState.transferStopReason = data.stop_reason;

            animateTransferSteps(0);
        }
    })
    .catch(err => {
        console.error('执行救援转移失败:', err);
        alert('救援转移执行失败，请重试');
    });
}

function animateTransferSteps(currentStepIndex) {
    const steps = gameState.transferSteps;
    if (currentStepIndex >= steps.length) {
        finishTransfer();
        return;
    }

    const step = steps[currentStepIndex];
    gameState.victimPosition.x = step.victim_x;
    gameState.victimPosition.y = step.victim_y;
    gameState.currentStep = currentStepIndex;

    gameState.nodes = step.nodes || gameState.nodes;
    gameState.details = step.details || gameState.details;

    if (step.weather_event) {
        const weatherType = step.weather_event.weather;
        document.getElementById('weatherDisplay').innerHTML = `
            <span class="weather-icon">${getWeatherIcon(weatherType)}</span>
            <span class="weather-text">${getWeatherName(weatherType)}</span>
        `;
    }

    if (!step.is_safe) {
        document.getElementById('rollbackBtn').style.display = 'inline-block';
    }

    updateNodeList();
    updateHistoryListFromSteps(currentStepIndex);
    updateUI();
    render();

    setTimeout(() => {
        animateTransferSteps(currentStepIndex + 1);
    }, 400);
}

function updateHistoryListFromSteps(upToIndex) {
    const steps = gameState.transferSteps.slice(0, upToIndex + 1);
    const list = document.getElementById('historyList');

    let html = '';
    steps.slice(-10).forEach(h => {
        const dangerClass = !h.is_safe ? 'danger' : '';
        const weatherClass = h.weather_event ? 'weather' : '';
        html += `
            <div class="history-item ${dangerClass} ${weatherClass}">
                <div style="font-weight:600;margin-bottom:2px;">步骤${h.step}</div>
                <div>位置: (${h.victim_x.toFixed(0)}, ${h.victim_y.toFixed(0)})</div>
                <div>张力: ${h.rope_tension.toFixed(2)} KN</div>
                ${h.weather_event ? `<div style="color:#fbbf24;font-size:0.8em;">天气: ${h.weather_event.description || getWeatherName(h.weather_event.weather)}</div>` : ''}
                ${h.failures && h.failures.length > 0 ? `<div style="color:#f87171;font-size:0.8em;">${h.failures.length}个装置失效</div>` : ''}
            </div>
        `;
    });

    list.innerHTML = html || '<p class="empty-hint">暂无记录</p>';
}

function finishTransfer() {
    document.getElementById('hintText').textContent = gameState.transferSuccess
        ? '✅ 救援转移完成！点击「完成救援」结算分数'
        : `❌ 救援失败: ${gameState.transferStopReason || '路线失效'}`;

    loadSessionState();
}

function triggerWeatherEvent(weatherType) {
    fetch(`/api/session/${SESSION_ID}/weather/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({ weather_type: weatherType })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('weatherDisplay').innerHTML = `
                <span class="weather-icon">${getWeatherIcon(weatherType)}</span>
                <span class="weather-text">${getWeatherName(weatherType)}</span>
            `;

            if (data.failed_nodes && data.failed_nodes.length > 0) {
                document.getElementById('rollbackBtn').style.display = 'inline-block';
            }

            loadSessionState();
        }
    })
    .catch(err => console.error('天气事件失败:', err));
}

function getWeatherIcon(type) {
    const icons = {
        clear: '☀️',
        snowfall: '🌨️',
        wind: '💨',
        blizzard: '❄️',
        avalanche_risk: '⚠️'
    };
    return icons[type] || '🌤️';
}

function getWeatherName(type) {
    const names = {
        clear: '晴朗',
        snowfall: '降雪',
        wind: '强风',
        blizzard: '暴风雪',
        avalanche_risk: '雪崩风险'
    };
    return names[type] || type;
}

function calculateLoads() {
    fetch(`/api/session/${SESSION_ID}/calculate/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            victim_x: gameState.victimPosition.x,
            victim_y: gameState.victimPosition.y
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            gameState.nodes = data.nodes;
            updateNodeList();
            updateUI();
            render();

            if (data.failed_nodes.length > 0) {
                alert(`警告：${data.failed_nodes.length} 个节点受力过载！\n请重新布置或降低负载。`);
            }
        }
    })
    .catch(err => console.error('计算受力失败:', err));
}

function calculateLoadsSilent() {
    fetch(`/api/session/${SESSION_ID}/calculate/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            victim_x: gameState.victimPosition.x,
            victim_y: gameState.victimPosition.y
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            gameState.nodes = data.nodes;
            updateNodeList();
            updateUI();
        }
    })
    .catch(err => console.error('计算受力失败:', err));
}

function simulateWeather() {
    const weatherTypes = ['snowfall', 'wind', 'blizzard', 'avalanche_risk'];
    const randomWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
    triggerWeatherEvent(randomWeather);
}

function rollbackToSafe() {
    const safeStep = Math.max(0, gameState.currentStep - 3);

    fetch(`/api/session/${SESSION_ID}/rollback/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({ step: safeStep })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(`已回滚到步骤 ${safeStep}`);
            loadSessionState();
            document.getElementById('rollbackBtn').style.display = 'none';
        }
    })
    .catch(err => console.error('回滚失败:', err));
}

function completeGame() {
    const totalTime = gameState.gameStartTime
        ? (Date.now() - gameState.gameStartTime) / 1000
        : 60;

    const failedNodes = gameState.nodes.filter(n => n.is_valid === false);
    const success = failedNodes.length === 0;

    fetch(`/api/session/${SESSION_ID}/complete/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            total_time: totalTime,
            success: success
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            gameState.isGameOver = true;
            stopTimer();
            showResultModal(data.result, success);
        }
    })
    .catch(err => console.error('完成游戏失败:', err));
}

function showResultModal(result, success) {
    document.getElementById('resultModal').style.display = 'flex';
    document.getElementById('resultTitle').textContent = success ? '🎉 救援成功！' : '💔 救援失败';
    document.getElementById('resultFinal').textContent = result.final_score;
    document.getElementById('resultSafety').textContent = result.safety_score;
    document.getElementById('resultSpeed').textContent = result.speed_score;
    document.getElementById('resultTech').textContent = result.technique_score;
    document.getElementById('resultGrade').textContent = result.grade;
    document.getElementById('resultEval').textContent = result.evaluation;

    document.getElementById('safetyScore').textContent = result.safety_score;
    document.getElementById('totalScore').textContent = result.final_score;
}

function startTimer() {
    if (gameState.timerInterval) return;

    gameState.timerInterval = setInterval(() => {
        if (!gameState.gameStartTime) return;
        const elapsed = Math.floor((Date.now() - gameState.gameStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        document.getElementById('timerDisplay').textContent = `${minutes}:${seconds}`;
    }, 1000);
}

function stopTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

document.addEventListener('DOMContentLoaded', init);
