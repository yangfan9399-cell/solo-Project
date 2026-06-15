const replayState = {
    currentStep: 0,
    totalSteps: 0,
    isPlaying: false,
    playInterval: null,
    speed: 1,
    histories: [],
    nodes: [],
    terrainZones: [],
    victimStart: { x: 700, y: 150 },
    targetPos: { x: 100, y: 400 },
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
    loadReplayData();
    setupEventListeners();
    render();
}

function loadReplayData() {
    fetch(`/api/session/${SESSION_ID}/`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                replayState.histories = data.histories || [];
                replayState.nodes = data.nodes || [];
                replayState.totalSteps = replayState.histories.length;

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
                document.getElementById('progressSlider').max = Math.max(replayState.totalSteps - 1, 0);

                updateTimeline();
                render();
            }
        })
        .catch(err => console.error('加载回放数据失败:', err));
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
        render();
    });

    document.querySelectorAll('.timeline-item').forEach(item => {
        item.addEventListener('click', function() {
            const step = parseInt(this.dataset.step) - 1;
            replayState.currentStep = step;
            document.getElementById('progressSlider').value = step;
            updateCurrentStepDisplay();
            render();
        });
    });
}

function startPlay() {
    if (replayState.isPlaying) return;

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
        updateTimelineHighlight();
        render();
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
    updateTimelineHighlight();
    render();
}

function updateCurrentStepDisplay() {
    document.getElementById('currentStep').textContent = replayState.currentStep + 1;
}

function updateTimeline() {
    const timelineList = document.getElementById('timelineList');
    if (replayState.histories.length === 0) return;

    let html = '';
    replayState.histories.forEach((h, index) => {
        const dangerClass = !h.is_safe ? 'danger' : '';
        const activeClass = index === replayState.currentStep ? 'active' : '';
        html += `
            <div class="timeline-item step-${index + 1} ${activeClass}" data-step="${index + 1}" onclick="jumpToStep(${index})">
                <div class="timeline-dot ${dangerClass}"></div>
                <div class="timeline-content">
                    <span class="timeline-step">步骤${index + 1}</span>
                    <p class="timeline-action">${h.action}</p>
                    ${h.remark ? `<p class="timeline-remark">${h.remark}</p>` : ''}
                </div>
            </div>
        `;
    });

    timelineList.innerHTML = html;
}

function updateTimelineHighlight() {
    document.querySelectorAll('.timeline-item').forEach((item, index) => {
        if (index === replayState.currentStep) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

function jumpToStep(step) {
    replayState.currentStep = step;
    document.getElementById('progressSlider').value = step;
    updateCurrentStepDisplay();
    updateTimelineHighlight();
    render();
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground();
    drawTerrainZones();
    drawTarget();

    const currentHistory = replayState.histories[replayState.currentStep];
    const victimPos = currentHistory
        ? { x: currentHistory.victim_x, y: currentHistory.victim_y }
        : replayState.victimStart;

    drawRopes(victimPos);
    drawNodes(currentHistory);
    drawVictim(victimPos);

    if (currentHistory && currentHistory.action_type === 'weather') {
        drawWeatherOverlay(currentHistory.weather);
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

function drawNodes(history) {
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
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    for (let i = 0; i < 30; i++) {
        const x = (Date.now() / 20 + i * 50) % canvas.width;
        const y = (Date.now() / 30 + i * 40) % canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    requestAnimationFrame(() => {
        if (replayState.isPlaying && replayState.histories[replayState.currentStep]?.action_type === 'weather') {
            render();
        }
    });
}

document.addEventListener('DOMContentLoaded', init);
