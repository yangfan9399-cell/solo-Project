const replayState = {
    currentStep: 0,
    totalSteps: 0,
    isPlaying: false,
    playInterval: null,
    speed: 1,
    histories: [],
    nodes: [],
    details: [],
    terrainZones: [],
    victimStart: { x: 700, y: 150 },
    targetPos: { x: 100, y: 400 },
    scoreAnalysis: null,
    sessionData: null,
};

const canvas = document.getElementById('replayCanvas');
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
    rope: '#e5e7eb',
    target: '#10b981',
};

function init() {
    loadAllData();
    setupEventListeners();
}

function loadAllData() {
    Promise.all([
        loadSessionState(),
        loadScoreAnalysis(),
    ]).then(() => {
        render();
    }).catch(err => {
        console.error('加载数据失败:', err);
    });
}

function loadSessionState() {
    return fetch(`/api/session/${SESSION_ID}/`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                replayState.histories = data.histories || [];
                replayState.nodes = data.nodes || [];
                replayState.details = data.details || [];
                replayState.totalSteps = replayState.histories.length;
                replayState.sessionData = data.session;

                if (data.seed) {
                    replayState.victimStart = {
                        x: data.seed.victim_x,
                        y: data.seed.victim_y
                    };
                    replayState.targetPos = {
                        x: data.seed.target_x,
                        y: data.seed.target_y
                    };

                    try {
                        const terrainMap = JSON.parse(data.seed.terrain_map.replace(/'/g, '"'));
                        replayState.terrainZones = terrainMap.zones || [];
                    } catch(e) {
                        replayState.terrainZones = [
                            { type: 'rock', x: 0, y: 0, width: 800, height: 500 }
                        ];
                    }
                }

                document.getElementById('totalSteps').textContent = replayState.totalSteps;
                const slider = document.getElementById('progressSlider');
                slider.max = Math.max(replayState.totalSteps - 1, 0);

                updateTimeline();
                updateTerrainLoads();
                updateDetailsSummary();
            }
        });
}

function loadScoreAnalysis() {
    return fetch(`/api/session/${SESSION_ID}/analysis/`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                replayState.scoreAnalysis = data.analysis;
                updateScoreComparison();
                updateChangeReasons();
            }
        });
}

function updateScoreComparison() {
    const analysis = replayState.scoreAnalysis;
    if (!analysis) return;

    document.getElementById('beforeScore').textContent = analysis.before_score;
    document.getElementById('afterScore').textContent = analysis.after_score;
    document.getElementById('beforeSafety').textContent = `初始安全分: ${analysis.initial_safety_score}`;
    document.getElementById('afterSafety').textContent = `最终安全分: ${analysis.final_safety_score}`;

    const diffValue = document.getElementById('diffValue');
    diffValue.textContent = `${analysis.score_diff > 0 ? '+' : ''}${analysis.score_diff}`;
    diffValue.style.color = analysis.score_diff >= 0 ? '#059669' : '#dc2626';
}

function updateChangeReasons() {
    const analysis = replayState.scoreAnalysis;
    const reasonContent = document.getElementById('reasonContent');
    if (!analysis || !analysis.reasons) {
        reasonContent.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:20px;">暂无评分变化数据</p>';
        return;
    }

    let html = '';
    analysis.reasons.forEach(reason => {
        html += `
            <div class="reason-item">
                <span class="reason-icon">${reason.icon}</span>
                <div class="reason-text">
                    <h4>${reason.title} <span style="font-size:0.8em;color:${reason.impact.startsWith('+') ? '#059669' : '#dc2626'};font-weight:normal;">${reason.impact}</span></h4>
                    <p>${reason.detail}</p>
                </div>
            </div>
        `;
    });

    reasonContent.innerHTML = html;
}

function updateDetailsSummary() {
    const analysis = replayState.scoreAnalysis;
    const summaryDiv = document.getElementById('detailsSummary');

    if (!analysis || !analysis.details_summary) {
        summaryDiv.innerHTML = '<p style="color:#94a3b8;font-size:0.85em;text-align:center;padding:10px;">暂无明细数据</p>';
        return;
    }

    const ds = analysis.details_summary;
    const detailItems = replayState.details;

    let html = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
            <div style="text-align:center;padding:8px;background:#f0f9ff;border-radius:6px;">
                <div style="font-size:1.5em;font-weight:bold;color:#0284c7;">${ds.pulley_count}</div>
                <div style="font-size:0.75em;color:#64748b;">滑轮</div>
            </div>
            <div style="text-align:center;padding:8px;background:#ecfdf5;border-radius:6px;">
                <div style="font-size:1.5em;font-weight:bold;color:#059669;">${ds.protection_count}</div>
                <div style="font-size:0.75em;color:#64748b;">保护站</div>
            </div>
        </div>
        <div style="font-size:0.8em;color:#64748b;line-height:1.6;">
            <p>滑轮效率系数: 0.95</p>
            <p>锚点数量: ${ds.anchor_count}</p>
            <p>总节点数: ${ds.total_nodes}</p>
            <p>总明细数: ${ds.total_details}</p>
        </div>
    `;

    if (detailItems && detailItems.length > 0) {
        html += '<div style="margin-top:12px;padding-top:12px;border-top:1px dashed #e2e8f0;"><h5 style="font-size:0.85em;margin-bottom:8px;color:#475569;">明细列表:</h5>';
        detailItems.forEach(d => {
            html += `
                <div style="font-size:0.75em;padding:6px 8px;background:#f8fafc;border-radius:4px;margin-bottom:4px;">
                    <strong>${d.detail_type === 'pulley' ? '🔘 滑轮' : '🛡️ 保护站'}</strong>
                    <span style="color:#64748b;margin-left:8px;">(${d.x.toFixed(0)}, ${d.y.toFixed(0)})</span>
                    ${d.actual_load > 0 ? `<span style="color:#059669;margin-left:8px;">受力:${d.actual_load.toFixed(2)}KN</span>` : ''}
                </div>
            `;
        });
        html += '</div>';
    }

    if (analysis.technique_score !== undefined) {
        html += `
            <div style="margin-top:12px;padding:10px;background:#fef3c7;border-radius:6px;text-align:center;">
                <div style="font-size:0.75em;color:#92400e;">技术评分</div>
                <div style="font-size:1.4em;font-weight:bold;color:#b45309;">${analysis.technique_score}</div>
            </div>
        `;
    }

    summaryDiv.innerHTML = html;
}

function updateTerrainLoads() {
    const sessionData = replayState.sessionData;
    const nodes = replayState.nodes;

    if (!nodes || nodes.length === 0) return;

    const rockLoad = Math.max(...nodes.filter(n => n.terrain_type === 'rock').map(n => n.actual_load || 0), 0);
    const iceLoad = Math.max(...nodes.filter(n => n.terrain_type === 'ice').map(n => n.actual_load || 0), 0);
    const snowLoad = Math.max(...nodes.filter(n => n.terrain_type === 'snow_cornice').map(n => n.actual_load || 0), 0);

    document.getElementById('rockLoadValue').textContent = `${rockLoad.toFixed(2)} KN`;
    document.getElementById('iceLoadValue').textContent = `${iceLoad.toFixed(2)} KN`;
    document.getElementById('snowLoadValue').textContent = `${snowLoad.toFixed(2)} KN`;

    document.getElementById('rockLoadBar').style.width = `${Math.min(rockLoad / 25 * 100, 100)}%`;
    document.getElementById('iceLoadBar').style.width = `${Math.min(iceLoad / 8 * 100, 100)}%`;
    document.getElementById('snowLoadBar').style.width = `${Math.min(snowLoad / 3 * 100, 100)}%`;
}

function updateTimeline() {
    const timelineList = document.getElementById('timelineList');
    if (replayState.histories.length === 0) {
        timelineList.innerHTML = '<p style="color:#94a3b8;font-size:0.85em;text-align:center;padding:10px;">暂无历史记录</p>';
        return;
    }

    let html = '';
    replayState.histories.forEach((h, index) => {
        const dangerClass = !h.is_safe ? 'danger' : '';
        const activeClass = index === replayState.currentStep ? 'active' : '';
        html += `
            <div class="timeline-item step-${index + 1} ${activeClass}" data-step="${index}" onclick="jumpToStep(${index})" style="cursor:pointer;">
                <div class="timeline-dot ${dangerClass}"></div>
                <div class="timeline-content">
                    <span class="timeline-step">步骤${h.step} [${h.action_type || 'transfer'}]</span>
                    <p class="timeline-action">${h.action}</p>
                    <p style="font-size:0.75em;color:#64748b;">张力: ${h.rope_tension?.toFixed?.(2) || 0} KN</p>
                    ${h.remark ? `<p class="timeline-remark">${h.remark}</p>` : ''}
                </div>
            </div>
        `;
    });

    timelineList.innerHTML = html;
}

function setupEventListeners() {
    document.getElementById('playBtn').addEventListener('click', startPlay);
    document.getElementById('pauseBtn').addEventListener('click', pausePlay);
    document.getElementById('resetBtn').addEventListener('click', resetPlay);

    document.getElementById('speedSelect').addEventListener('change', function() {
        replayState.speed = parseFloat(this.value);
        if (replayState.isPlaying) {
            pausePlay();
            startPlay();
        }
    });

    document.getElementById('progressSlider').addEventListener('input', function() {
        replayState.currentStep = parseInt(this.value);
        updateCurrentStepDisplay();
        loadAndRenderStep();
    });
}

function startPlay() {
    if (replayState.isPlaying) return;
    if (replayState.totalSteps === 0) {
        alert('暂无回放数据');
        return;
    }

    replayState.isPlaying = true;
    document.getElementById('playBtn').style.display = 'none';
    document.getElementById('pauseBtn').style.display = 'inline-block';

    const interval = 1000 / replayState.speed;

    replayState.playInterval = setInterval(() => {
        if (replayState.currentStep >= replayState.totalSteps - 1) {
            pausePlay();
            return;
        }

        replayState.currentStep++;
        document.getElementById('progressSlider').value = replayState.currentStep;
        updateCurrentStepDisplay();
        loadAndRenderStep();
    }, interval);
}

function pausePlay() {
    replayState.isPlaying = false;
    document.getElementById('playBtn').style.display = 'inline-block';
    document.getElementById('pauseBtn').style.display = 'none';

    if (replayState.playInterval) {
        clearInterval(replayState.playInterval);
        replayState.playInterval = null;
    }
}

function resetPlay() {
    pausePlay();
    replayState.currentStep = 0;
    document.getElementById('progressSlider').value = 0;
    updateCurrentStepDisplay();
    loadAndRenderStep();
}

function updateCurrentStepDisplay() {
    document.getElementById('currentStep').textContent = replayState.currentStep + 1;
    updateTimeline();
}

function jumpToStep(step) {
    pausePlay();
    replayState.currentStep = step;
    document.getElementById('progressSlider').value = step;
    updateCurrentStepDisplay();
    loadAndRenderStep();
}

function loadAndRenderStep() {
    const history = replayState.histories[replayState.currentStep];
    if (!history) {
        render();
        return;
    }

    const stepDetailDiv = document.getElementById('stepDetail');
    const stepDetailContent = document.getElementById('stepDetailContent');

    stepDetailDiv.style.display = 'block';
    stepDetailContent.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;font-size:0.85em;">
            <div>
                <strong>被困者位置:</strong><br>
                (${history.victim_x?.toFixed?.(0) || 0}, ${history.victim_y?.toFixed?.(0) || 0})
            </div>
            <div>
                <strong>绳索张力:</strong><br>
                <span style="color:${history.rope_tension > 5 ? '#dc2626' : '#059669'};">${history.rope_tension?.toFixed?.(2) || 0} KN</span>
            </div>
            <div>
                <strong>状态:</strong><br>
                <span style="color:${history.is_safe ? '#059669' : '#dc2626'};">${history.is_safe ? '✅ 安全' : '❌ 危险'}</span>
            </div>
        </div>
        <div style="margin-top:8px;font-size:0.85em;">
            <strong>天气:</strong> ${getWeatherName(history.weather)} |
            <strong>动作:</strong> ${history.action}
            ${history.remark ? ` | <strong>备注:</strong> ${history.remark}` : ''}
        </div>
    `;

    replayState.currentVictimPos = {
        x: history.victim_x,
        y: history.victim_y
    };
    replayState.currentWeather = history.weather;

    render();
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground();
    drawTerrainZones();
    drawTarget();

    const victimPos = replayState.currentVictimPos || replayState.victimStart;
    drawRopes(victimPos);
    drawNodes();
    drawDetails();
    drawVictim(victimPos);

    if (replayState.currentWeather && replayState.currentWeather !== 'clear') {
        drawWeatherOverlay(replayState.currentWeather);
    }
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
    replayState.terrainZones.forEach(zone => {
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

function getWeatherName(type) {
    const names = {
        clear: '☀️ 晴朗',
        snowfall: '🌨️ 降雪',
        wind: '💨 强风',
        blizzard: '❄️ 暴风雪',
        avalanche_risk: '⚠️ 雪崩风险'
    };
    return names[type] || type;
}

function drawTarget() {
    const { x, y } = replayState.targetPos;

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

function drawRopes(victimPos) {
    const anchors = replayState.nodes.filter(n => n.node_type === 'anchor');
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
    ctx.lineTo(victimPos.x, victimPos.y);
    ctx.stroke();

    ctx.globalAlpha = 1;
}

function drawNodes() {
    replayState.nodes.forEach(node => {
        const color = colors[node.node_type] || '#6b7280';
        const radius = 12;

        const isFailed = node.is_valid === false;

        ctx.fillStyle = isFailed ? '#ef4444' : color;
        ctx.globalAlpha = isFailed ? 0.5 : 1;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

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

        if (node.failure_reason) {
            ctx.fillStyle = '#ef4444';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('失效', node.x, node.y + radius + 14);
            ctx.textAlign = 'left';
        }
    });
}

function drawDetails() {
    replayState.details.forEach(detail => {
        const color = detail.detail_type === 'pulley' ? '#f59e0b' : '#10b981';
        const size = 14;

        const isFailed = detail.is_valid === false;

        ctx.fillStyle = isFailed ? '#ef4444' : color;
        ctx.globalAlpha = isFailed ? 0.5 : 1;

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
        ctx.globalAlpha = 1;

        ctx.fillStyle = 'white';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(detail.detail_type === 'pulley' ? '滑' : '保', detail.x, detail.y + 3);
        ctx.textAlign = 'left';

        if (detail.actual_load > 0 && detail.load_capacity > 0) {
            const ratio = detail.actual_load / detail.load_capacity;
            ctx.fillStyle = ratio > 1 ? '#ef4444' : '#64748b';
            ctx.font = '9px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${detail.actual_load.toFixed(1)}KN`, detail.x, detail.y + size + 12);
            ctx.textAlign = 'left';
        }
    });
}

function drawVictim(pos) {
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🧍‍♂️', pos.x, pos.y + 4);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('被困者', pos.x, pos.y + 28);
    ctx.textAlign = 'left';
}

function drawWeatherOverlay(weatherType) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    for (let i = 0; i < 40; i++) {
        const x = ((Date.now() / 20 + i * 50) % (canvas.width + 40)) - 20;
        const y = ((Date.now() / 30 + i * 40) % (canvas.height + 40)) - 20;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    if (replayState.isPlaying) {
        requestAnimationFrame(() => {
            if (replayState.isPlaying) {
                render();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', init);
