let selectedTrap = null;
let gameState = null;
let currentChecksum = '';
const CELL_SIZE = 70;

const actionNames = {
    'place_trap': '放置陷阱',
    'remove_trap': '移除陷阱',
    'start_task': '开始任务',
    'complete_task': '完成任务',
    'next_turn': '下一回合',
    'start_attack': '开始进攻',
    'trigger_trap': '陷阱触发',
    'enemy_move': '敌人移动',
    'enemy_damage': '敌人受伤',
    'wall_damage': '城墙受伤',
};

const actionColors = {
    'place_trap': 'text-green-400',
    'remove_trap': 'text-orange-400',
    'start_task': 'text-blue-400',
    'complete_task': 'text-cyan-400',
    'next_turn': 'text-slate-400',
    'start_attack': 'text-red-400',
    'trigger_trap': 'text-yellow-400',
    'enemy_move': 'text-purple-400',
    'enemy_damage': 'text-red-300',
    'wall_damage': 'text-red-500',
};

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slide-in 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

async function generateClientChecksum(state) {
    const data = {
        session_id: SESSION_ID,
        turn: state.turn,
        wall_health: state.wall_health,
        gold: state.gold,
        score: state.score,
        enemies_killed: state.enemies_killed,
        trap_count: state.traps.length,
        status: state.status,
    };
    const raw = JSON.stringify(data, Object.keys(data).sort());
    return await sha256(raw);
}

async function sha256(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function fetchGameState() {
    try {
        const response = await fetch(`/api/state/${SESSION_ID}/`);
        gameState = await response.json();
        currentChecksum = gameState.checksum;
        renderGame();
        return gameState;
    } catch (error) {
        console.error('Failed to fetch game state:', error);
        showToast('获取游戏状态失败', 'error');
    }
}

function renderGame() {
    if (!gameState) return;

    document.getElementById('turn-display').textContent = gameState.turn;
    document.getElementById('gold-display').textContent = gameState.gold;
    document.getElementById('score-display').textContent = gameState.score;
    document.getElementById('kills-display').textContent = gameState.enemies_killed;

    const wallPct = (gameState.wall_health / gameState.max_wall_health) * 100;
    document.getElementById('wall-health-bar').style.width = `${wallPct}%`;
    document.getElementById('wall-health-text').textContent = `${gameState.wall_health}/${gameState.max_wall_health}`;

    const statusBadge = document.getElementById('status-badge');
    statusBadge.textContent = gameState.status === 'setup' ? '布置阶段' :
                              gameState.status === 'playing' ? '战斗中' :
                              gameState.status === 'won' ? '胜利!' : '失败';
    statusBadge.className = `px-4 py-2 rounded-lg font-bold ${
        gameState.status === 'setup' ? 'bg-blue-600 text-white' :
        gameState.status === 'playing' ? 'bg-green-600 text-white' :
        gameState.status === 'won' ? 'bg-yellow-500 text-black' : 'bg-red-600 text-white'
    }`;

    renderGrid();
    renderTasks();
    renderActionLog();
    updateActionButtons();

    if (gameState.status === 'won' || gameState.status === 'lost') {
        showGameOverModal();
    }
}

function updateActionButtons() {
    const startBtn = document.getElementById('start-attack-btn');
    const nextBtn = document.getElementById('next-turn-btn');
    const reportBtn = document.getElementById('report-btn');
    const replayBtn = document.getElementById('replay-btn');
    const restartBtn = document.getElementById('restart-btn');

    if (!startBtn || !nextBtn) return;

    startBtn.classList.add('hidden');
    nextBtn.classList.add('hidden');
    reportBtn.classList.add('hidden');
    replayBtn.classList.add('hidden');
    restartBtn.classList.add('hidden');

    if (gameState.status === 'setup') {
        startBtn.classList.remove('hidden');
    } else if (gameState.status === 'playing') {
        nextBtn.classList.remove('hidden');
    } else if (gameState.status === 'won' || gameState.status === 'lost') {
        reportBtn.classList.remove('hidden');
        replayBtn.classList.remove('hidden');
        restartBtn.classList.remove('hidden');
    }
}

function renderGrid() {
    const grid = document.getElementById('game-grid');
    if (!grid) return;

    grid.innerHTML = '';
    grid.style.width = `${GRID_WIDTH * CELL_SIZE}px`;
    grid.style.height = `${GRID_HEIGHT * CELL_SIZE}px`;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', GRID_WIDTH * CELL_SIZE);
    svg.setAttribute('height', GRID_HEIGHT * CELL_SIZE);
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';

    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', x * CELL_SIZE);
            rect.setAttribute('y', y * CELL_SIZE);
            rect.setAttribute('width', CELL_SIZE);
            rect.setAttribute('height', CELL_SIZE);
            rect.setAttribute('fill', (x + y) % 2 === 0 ? '#1e293b' : '#0f172a');
            rect.setAttribute('stroke', '#334155');
            rect.setAttribute('stroke-width', '1');
            svg.appendChild(rect);

            const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            const cx = x * CELL_SIZE + CELL_SIZE / 2;
            const cy = y * CELL_SIZE + CELL_SIZE / 2;
            const size = CELL_SIZE * 0.35;
            if ((x + y) % 2 === 0) {
                poly.setAttribute('points', `${cx},${cy-size} ${cx+size},${cy} ${cx},${cy+size} ${cx-size},${cy}`);
                poly.setAttribute('fill', 'rgba(99, 102, 241, 0.08)');
            } else {
                poly.setAttribute('points', `${cx-size},${cy-size} ${cx+size},${cy-size} ${cx},${cy+size}`);
                poly.setAttribute('fill', 'rgba(139, 92, 246, 0.08)');
            }
            svg.appendChild(poly);
        }
    }

    for (let i = 0; i < GRID_HEIGHT; i++) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        let d = '';
        for (let x = 0; x < WALL_X; x++) {
            const y = i * CELL_SIZE + CELL_SIZE / 2;
            if (x === 0) d += `M ${x * CELL_SIZE + CELL_SIZE/2},${y}`;
            else d += ` L ${x * CELL_SIZE + CELL_SIZE/2},${y}`;
        }
        path.setAttribute('d', d);
        path.setAttribute('stroke', 'rgba(239, 68, 68, 0.3)');
        path.setAttribute('stroke-width', '3');
        path.setAttribute('stroke-dasharray', '10,5');
        path.setAttribute('fill', 'none');
        svg.appendChild(path);
    }

    const wallX = WALL_X * CELL_SIZE;
    for (let y = 0; y < GRID_HEIGHT; y++) {
        const tower = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const bx = wallX + CELL_SIZE / 2;
        const by = y * CELL_SIZE + CELL_SIZE / 2;
        const h = CELL_SIZE * 0.8;
        const w = CELL_SIZE * 0.6;
        const healthPct = gameState.wall_health / gameState.max_wall_health;
        const r = Math.floor(234 * (1 - healthPct));
        const g = Math.floor(179 * healthPct + 52 * (1 - healthPct));
        const b = Math.floor(179 * healthPct);
        tower.setAttribute('points', `${bx-w/2},${by+h/2} ${bx-w/2},${by-h/3} ${bx},${by-h/2} ${bx+w/2},${by-h/3} ${bx+w/2},${by+h/2}`);
        tower.setAttribute('fill', `rgb(${r}, ${g}, ${b})`);
        tower.setAttribute('stroke', '#1e293b');
        tower.setAttribute('stroke-width', '2');
        svg.appendChild(tower);
    }

    grid.appendChild(svg);

    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < WALL_X; x++) {
            const cell = document.createElement('div');
            cell.className = 'absolute cell-hover';
            cell.style.left = `${x * CELL_SIZE}px`;
            cell.style.top = `${y * CELL_SIZE}px`;
            cell.style.width = `${CELL_SIZE}px`;
            cell.style.height = `${CELL_SIZE}px`;
            cell.dataset.x = x;
            cell.dataset.y = y;
            cell.addEventListener('click', () => handleCellClick(x, y));
            grid.appendChild(cell);
        }
    }

    gameState.traps.forEach(trap => {
        const div = document.createElement('div');
        div.className = 'absolute flex items-center justify-center text-3xl transform transition-all duration-300 cursor-pointer';
        div.style.left = `${trap.x * CELL_SIZE}px`;
        div.style.top = `${trap.y * CELL_SIZE}px`;
        div.style.width = `${CELL_SIZE}px`;
        div.style.height = `${CELL_SIZE}px`;
        div.style.color = trap.color;
        div.innerHTML = `<span class="drop-shadow-lg float">${trap.emoji}</span>`;
        div.title = `${trap.type_name} (点击移除, 返还50%金币)`;
        div.addEventListener('click', (e) => {
            e.stopPropagation();
            handleRemoveTrap(trap.id);
        });

        const cooldown = gameState.turn - trap.last_triggered;
        if (cooldown < trap.cooldown) {
            div.style.opacity = '0.5';
            const indicator = document.createElement('div');
            indicator.className = 'absolute bottom-0 right-0 bg-slate-900/80 text-white text-xs px-1 rounded';
            indicator.textContent = `${trap.cooldown - cooldown}`;
            div.appendChild(indicator);
        }

        grid.appendChild(div);
    });

    gameState.enemies.forEach(enemy => {
        if (!enemy.is_alive) return;
        const div = document.createElement('div');
        div.className = 'absolute transition-all duration-500 enemy-spawn';
        div.style.left = `${enemy.x * CELL_SIZE}px`;
        div.style.top = `${enemy.y * CELL_SIZE}px`;
        div.style.width = `${CELL_SIZE}px`;
        div.style.height = `${CELL_SIZE}px`;

        const emoji = enemy.type === 'grunt' ? '👹' :
                     enemy.type === 'fast' ? '🏃' :
                     enemy.type === 'tank' ? '🛡️' : '👑';
        const bgColor = enemy.type === 'grunt' ? 'bg-red-900/80' :
                       enemy.type === 'fast' ? 'bg-yellow-900/80' :
                       enemy.type === 'tank' ? 'bg-slate-700/80' : 'bg-purple-900/80';

        div.innerHTML = `
            <div class="w-full h-full flex flex-col items-center justify-center ${bgColor} rounded-lg border-2 border-slate-600">
                <span class="text-2xl">${emoji}</span>
                <div class="w-12 h-1.5 bg-slate-700 rounded-full mt-1 overflow-hidden">
                    <div class="h-full bg-red-500 transition-all" style="width: ${(enemy.health / enemy.max_health) * 100}%"></div>
                </div>
            </div>
        `;
        grid.appendChild(div);
    });

    updateTrapCards();
}

function updateTrapCards() {
    document.querySelectorAll('.trap-card').forEach(card => {
        const cost = parseInt(card.dataset.cost);
        if (gameState && cost > gameState.gold) {
            card.classList.add('disabled');
        } else {
            card.classList.remove('disabled');
        }
    });
}

function renderTasks() {
    const panel = document.getElementById('active-tasks-panel');
    const list = document.getElementById('active-tasks-list');

    if (!gameState || !gameState.tasks || gameState.tasks.length === 0) {
        panel.classList.add('hidden');
        return;
    }

    panel.classList.remove('hidden');
    list.innerHTML = '';

    gameState.tasks.forEach(task => {
        const div = document.createElement('div');
        div.className = 'bg-slate-700/50 rounded-lg p-3 border border-slate-600';
        const progress = Math.min(task.progress / task.total, 1);
        const remaining = Math.max(0, task.end_turn - gameState.turn);
        div.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <span class="text-white font-semibold">${task.name}</span>
                <span class="text-xs text-slate-400">${remaining > 0 ? `${remaining}回合` : '完成'}</span>
            </div>
            <div class="w-full h-2 bg-slate-600 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-blue-500 to-cyan-400 progress-bar-striped"
                     style="width: ${progress * 100}%"></div>
            </div>
            <p class="text-xs text-slate-400 mt-2">${task.description}</p>
        `;
        list.appendChild(div);
    });
}

function renderActionLog() {
    const log = document.getElementById('action-log');
    if (!log || !gameState || !gameState.recent_actions) return;

    log.innerHTML = '';
    gameState.recent_actions.slice().reverse().forEach(action => {
        const div = document.createElement('div');
        div.className = 'py-1 border-b border-slate-800';
        const color = actionColors[action.type] || 'text-slate-400';
        const name = actionNames[action.type] || action.type;
        let detailStr = '';
        if (action.details.message) {
            detailStr = action.details.message;
        } else if (action.details.trap_type) {
            detailStr = `${action.details.trap_type} (${action.details.x}, ${action.details.y})`;
            if (action.details.enemies_hit) detailStr += ` 击中${action.details.enemies_hit}个敌人`;
            if (action.details.cost) detailStr += ` 花费${action.details.cost}金`;
            if (action.details.refund) detailStr += ` 返还${action.details.refund}金`;
        } else if (action.details.task_name) {
            detailStr = action.details.task_name;
            if (action.details.reward_gold) detailStr += ` +${action.details.reward_gold}金`;
            if (action.details.reward_score) detailStr += ` +${action.details.reward_score}分`;
        } else if (action.details.enemy_type) {
            detailStr = `${action.details.enemy_type}`;
            if (action.details.damage) detailStr += ` 伤害:${action.details.damage}`;
            if (action.details.new_x !== undefined) detailStr += ` →(${action.details.new_x}, ${action.details.y})`;
        } else if (action.details.turn) {
            detailStr = `回合 ${action.details.turn}`;
        }
        div.innerHTML = `<span class="text-slate-500">[T${action.turn}]</span> <span class="${color} font-semibold">${name}</span>: <span class="text-slate-300">${detailStr}</span>`;
        log.appendChild(div);
    });
}

function showGameOverModal() {
    const modal = document.getElementById('game-over-modal');
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.querySelector('.bg-slate-800').classList.add('modal-enter');

    const isWon = gameState.status === 'won';
    document.getElementById('modal-icon').textContent = isWon ? '🏆' : '💀';
    document.getElementById('modal-title').textContent = isWon ? '胜利!' : '失败...';
    document.getElementById('modal-subtitle').textContent = isWon ? '你成功守住了城堡！' : '城堡被敌人攻陷了...';
    document.getElementById('modal-score').textContent = gameState.score;
    document.getElementById('modal-kills').textContent = gameState.enemies_killed;
}

async function handleCellClick(x, y) {
    if (gameState.status !== 'setup' && gameState.status !== 'playing') {
        showToast('游戏已结束', 'warning');
        return;
    }

    if (!selectedTrap) {
        showToast('请先选择一个陷阱', 'info');
        return;
    }

    const cost = parseInt(selectedTrap.dataset.cost);
    if (cost > gameState.gold) {
        showToast('金币不足', 'error');
        return;
    }

    try {
        const response = await fetch(`/api/place_trap/${SESSION_ID}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': CSRF_TOKEN,
            },
            body: JSON.stringify({
                trap_type_id: parseInt(selectedTrap.dataset.trapId),
                x: x,
                y: y,
            }),
        });

        const result = await response.json();
        if (result.success) {
            showToast(`放置 ${selectedTrap.dataset.name} 成功！`, 'success');
            await fetchGameState();
        } else {
            showToast(result.message || '放置失败', 'error');
        }
    } catch (error) {
        console.error('Failed to place trap:', error);
        showToast('放置陷阱失败', 'error');
    }
}

async function handleRemoveTrap(trapId) {
    if (gameState.status !== 'setup' && gameState.status !== 'playing') {
        showToast('游戏已结束', 'warning');
        return;
    }

    if (!confirm('确定要移除这个陷阱吗？只能返还50%金币')) return;

    try {
        const response = await fetch(`/api/remove_trap/${SESSION_ID}/${trapId}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': CSRF_TOKEN,
            },
        });

        const result = await response.json();
        if (result.success) {
            showToast(`陷阱已移除，返还 ${result.refund} 金币`, 'success');
            await fetchGameState();
        } else {
            showToast(result.message || '移除失败', 'error');
        }
    } catch (error) {
        console.error('Failed to remove trap:', error);
        showToast('移除陷阱失败', 'error');
    }
}

async function handleStartAttack() {
    try {
        const response = await fetch(`/api/start_attack/${SESSION_ID}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': CSRF_TOKEN,
            },
        });

        const result = await response.json();
        if (result.success) {
            showToast('敌人开始进攻！', 'warning');
            await fetchGameState();
        } else {
            showToast(result.message || '开始失败', 'error');
        }
    } catch (error) {
        console.error('Failed to start attack:', error);
        showToast('开始进攻失败', 'error');
    }
}

async function handleNextTurn() {
    if (gameState.status !== 'playing') {
        showToast('游戏不在进行中', 'warning');
        return;
    }

    try {
        const clientChecksum = await generateClientChecksum(gameState);
        const response = await fetch(`/api/next_turn/${SESSION_ID}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': CSRF_TOKEN,
            },
            body: JSON.stringify({
                checksum: clientChecksum,
            }),
        });

        const result = await response.json();
        if (result.success) {
            if (result.kills > 0) {
                showToast(`本回合击杀 ${result.kills} 个敌人！`, 'success');
            }
            if (result.wall_damage > 0) {
                showToast(`城墙受到 ${result.wall_damage} 点伤害！`, 'error');
                document.getElementById('wall-health-bar').parentElement.classList.add('shake');
                setTimeout(() => {
                    document.getElementById('wall-health-bar').parentElement.classList.remove('shake');
                }, 300);
            }
            if (result.spawned > 0) {
                showToast(`新的敌人出现了！(${result.spawned}个)`, 'warning');
            }
            if (result.result === 'won') {
                showToast('🎉 胜利！你成功守住了城堡！', 'success');
            } else if (result.result === 'lost') {
                showToast('💀 失败...城堡被攻陷了', 'error');
            }
            await fetchGameState();
        } else {
            if (result.validation && !result.validation.valid) {
                showToast('状态校验失败，页面将刷新', 'error');
                setTimeout(() => location.reload(), 1500);
            } else {
                showToast(result.message || '操作失败', 'error');
            }
        }
    } catch (error) {
        console.error('Failed to next turn:', error);
        showToast('推进回合失败', 'error');
    }
}

async function handleStartTask(taskName, cost) {
    if (gameState.status !== 'setup' && gameState.status !== 'playing') {
        showToast('游戏已结束', 'warning');
        return;
    }

    if (cost > gameState.gold) {
        showToast('金币不足', 'error');
        return;
    }

    if (gameState.tasks && gameState.tasks.length >= 2) {
        showToast('最多同时进行2个任务', 'warning');
        return;
    }

    try {
        const response = await fetch(`/api/start_task/${SESSION_ID}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': CSRF_TOKEN,
            },
            body: JSON.stringify({
                task_name: taskName,
            }),
        });

        const result = await response.json();
        if (result.success) {
            showToast('任务已开始', 'success');
            await fetchGameState();
        } else {
            showToast(result.message || '任务启动失败', 'error');
        }
    } catch (error) {
        console.error('Failed to start task:', error);
        showToast('任务启动失败', 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.trap-card').forEach(card => {
        card.addEventListener('click', () => {
            if (card.classList.contains('disabled')) {
                showToast('金币不足', 'error');
                return;
            }
            document.querySelectorAll('.trap-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedTrap = card;
            document.getElementById('trap-hint').textContent = `已选择 ${card.dataset.name}，点击网格放置`;
            document.getElementById('trap-hint').classList.add('text-indigo-400');
        });
    });

    document.querySelectorAll('.craftsman-task').forEach(btn => {
        btn.addEventListener('click', () => {
            const taskName = btn.dataset.task;
            const cost = parseInt(btn.dataset.cost);
            handleStartTask(taskName, cost);
        });
    });

    const startAttackBtn = document.getElementById('start-attack-btn');
    if (startAttackBtn) {
        startAttackBtn.addEventListener('click', handleStartAttack);
    }

    const nextTurnBtn = document.getElementById('next-turn-btn');
    if (nextTurnBtn) {
        nextTurnBtn.addEventListener('click', handleNextTurn);
    }

    fetchGameState();

    if (gameState && (gameState.status === 'setup' || gameState.status === 'playing')) {
        setInterval(fetchGameState, 5000);
    }
});
