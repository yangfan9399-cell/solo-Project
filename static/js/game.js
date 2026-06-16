/**
 * 火车餐车备餐节奏游戏 - 前端逻辑
 */

class TrainDiningGame {
    constructor() {
        this.currentPlayer = null;
        this.currentSession = null;
        this.currentLevel = null;
        this.gameState = null;
        this.gameTimer = null;
        this.isPaused = false;
        this.currentLevelId = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkLoginStatus();
    }

    bindEvents() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchAuthTab(e.target.dataset.tab));
        });

        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('register-form').addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());

        document.getElementById('pause-btn').addEventListener('click', () => this.pauseGame());
        document.getElementById('resume-btn').addEventListener('click', () => this.resumeGame());
        document.getElementById('restore-btn').addEventListener('click', () => this.restoreGame());
        document.getElementById('abandon-btn').addEventListener('click', () => this.abandonGame());

        document.getElementById('replay-level-btn').addEventListener('click', () => this.replayLevel());
        document.getElementById('back-to-levels-btn').addEventListener('click', () => this.showLevelSelect());

        document.getElementById('view-history-btn').addEventListener('click', () => this.showHistory());
        document.getElementById('view-stats-btn').addEventListener('click', () => this.showStats());
        document.getElementById('back-from-history-btn').addEventListener('click', () => this.showLevelSelect());
        document.getElementById('back-from-stats-btn').addEventListener('click', () => this.showLevelSelect());
    }

    switchAuthTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.toggle('active', form.id === `${tab}-form`);
        });
        document.getElementById('auth-message').classList.add('hidden');
    }

    async apiRequest(endpoint, method = 'GET', data = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'same-origin'
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const url = endpoint.endsWith('/') ? `/api/${endpoint}` : `/api/${endpoint}/`;
            const response = await fetch(url, options);
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, message: '网络错误' };
        }
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.remove('hidden');

        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        document.getElementById(screenId).classList.remove('hidden');
    }

    async checkLoginStatus() {
        const result = await this.apiRequest('auth/current');
        if (result.success) {
            this.currentPlayer = result.player;
            this.updatePlayerInfo();
            this.showLevelSelect();
        } else {
            this.showScreen('auth-screen');
        }
    }

    updatePlayerInfo() {
        if (this.currentPlayer) {
            document.getElementById('player-info').classList.remove('hidden');
            document.getElementById('player-avatar').textContent = this.currentPlayer.avatar;
            document.getElementById('player-nickname').textContent = this.currentPlayer.nickname;
            document.getElementById('total-score').textContent = this.currentPlayer.total_score;
        } else {
            document.getElementById('player-info').classList.add('hidden');
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        const result = await this.apiRequest('auth/login', 'POST', { username, password });

        if (result.success) {
            this.currentPlayer = result.player;
            this.updatePlayerInfo();
            this.showToast('登录成功！', 'success');
            this.showLevelSelect();
        } else {
            this.showAuthMessage(result.message, 'error');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const nickname = document.getElementById('register-nickname').value;
        const password = document.getElementById('register-password').value;

        const result = await this.apiRequest('auth/register', 'POST', { username, nickname, password });

        if (result.success) {
            this.showAuthMessage('注册成功！请登录', 'success');
            this.switchAuthTab('login');
            document.getElementById('login-username').value = username;
        } else {
            this.showAuthMessage(result.message, 'error');
        }
    }

    showAuthMessage(message, type) {
        const msgEl = document.getElementById('auth-message');
        msgEl.textContent = message;
        msgEl.className = `message ${type}`;
        msgEl.classList.remove('hidden');
    }

    async handleLogout() {
        await this.apiRequest('auth/logout', 'POST');
        this.currentPlayer = null;
        this.updatePlayerInfo();
        this.stopGameLoop();
        this.showToast('已退出登录', 'info');
        this.showScreen('auth-screen');
    }

    async showLevelSelect() {
        this.stopGameLoop();
        this.showScreen('level-select-screen');
        await this.loadLevels();
    }

    async loadLevels() {
        const result = await this.apiRequest('levels');
        if (result.success) {
            this.renderLevels(result.levels);

            if (this.currentPlayer) {
                document.getElementById('highest-level').textContent = this.currentPlayer.highest_level;
                document.getElementById('games-played').textContent = this.currentPlayer.games_played;
                document.getElementById('games-won').textContent = this.currentPlayer.games_won;
            }
        }
    }

    renderLevels(levels) {
        const container = document.getElementById('levels-container');
        container.innerHTML = '';

        levels.forEach(level => {
            const card = document.createElement('div');
            card.className = `level-card ${level.unlocked ? '' : 'locked'}`;

            const difficultyLabels = {
                'easy': '简单',
                'normal': '普通',
                'hard': '困难',
                'expert': '专家'
            };

            card.innerHTML = `
                <div class="level-number">${level.level_number}</div>
                <div class="level-name">${level.name}</div>
                <div class="level-difficulty difficulty-${level.difficulty}">${difficultyLabels[level.difficulty]}</div>
                <div class="level-description">${level.description}</div>
                <div class="level-info">
                    <span>🎯 目标: ${level.target_score}</span>
                    <span>⏱️ ${level.time_limit}秒</span>
                    <span>🚉 ${level.station_count}站</span>
                </div>
            `;

            if (level.unlocked) {
                card.addEventListener('click', () => this.startGame(level.id));
            }

            container.appendChild(card);
        });
    }

    async startGame(levelId) {
        this.currentLevelId = levelId;
        const result = await this.apiRequest('game/start', 'POST', { level_id: levelId });

        if (result.success) {
            this.currentSession = result.session;
            this.gameState = result.game_state;
            this.currentLevel = result.session;

            this.showScreen('game-screen');
            this.isPaused = false;
            this.renderGame();
            this.startGameLoop();

            this.showToast(`开始游戏：${result.session.level_name}`, 'success');
        } else if (result.session_id) {
            if (confirm('存在进行中的游戏，是否继续？')) {
                this.continueGame(result.session_id);
            }
        } else {
            this.showToast(result.message, 'error');
        }
    }

    async continueGame(sessionId) {
        const result = await this.apiRequest(`game/${sessionId}/state`);
        if (result.success) {
            this.currentSession = result.session;
            this.gameState = result.game_state;
            this.currentLevelId = result.session.level_id;

            this.showScreen('game-screen');
            this.isPaused = false;
            this.renderGame();
            this.startGameLoop();
        }
    }

    startGameLoop() {
        this.stopGameLoop();
        this.gameTimer = setInterval(() => this.gameTick(), 1000);
    }

    stopGameLoop() {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
    }

    async gameTick() {
        if (this.isPaused || !this.currentSession) return;

        const result = await this.apiRequest(`game/${this.currentSession.id}/tick`, 'POST', { delta: 1 });

        if (result.success) {
            this.gameState = result.game_state;
            this.currentSession.score = result.game_state.score;
            this.renderGame();

            if (result.game_over) {
                this.stopGameLoop();
                this.showSettlement(result.settlement);
            }
        }
    }

    renderGame() {
        if (!this.gameState) return;

        const state = this.gameState;

        const currentStation = state.stations[state.current_station];
        document.getElementById('current-station').textContent = currentStation ? currentStation.name : '--';

        const timeRemaining = Math.max(0, (this.currentSession?.level?.time_limit || 200) - state.current_time);
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        document.getElementById('time-remaining').textContent =
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        document.getElementById('current-score').textContent = state.score;
        document.getElementById('target-score').textContent = this.currentSession?.level?.target_score || 0;
        document.getElementById('completed-orders').textContent = state.orders_completed;
        document.getElementById('current-money').textContent = `¥${state.money}`;

        this.renderStations();
        this.renderCarriages();
        this.renderWorkers();
        this.renderPrepStations();

        this.renderOrders('pending', state.pending_orders_detail || []);
        this.renderOrders('preparing', state.preparing_orders_detail || []);
        this.renderOrders('ready', state.ready_orders_detail || []);
        this.renderOrders('delivering', state.delivering_orders_detail || []);

        document.getElementById('pending-count').textContent = (state.pending_orders_detail || []).length;
        document.getElementById('preparing-count').textContent = (state.preparing_orders_detail || []).length;
        document.getElementById('ready-count').textContent = (state.ready_orders_detail || []).length;
        document.getElementById('delivering-count').textContent = (state.delivering_orders_detail || []).length;
    }

    renderStations() {
        const container = document.getElementById('stations-list');
        container.innerHTML = '';

        this.gameState.stations.forEach((station, idx) => {
            const div = document.createElement('div');
            let statusClass = 'status-pending';
            let statusText = '待到达';

            if (station.departed) {
                div.classList.add('departed');
                statusClass = 'status-done';
                statusText = '已离开';
            } else if (station.arrived) {
                div.classList.add('current');
                statusClass = 'status-current';
                statusText = '当前站';
            }

            div.className = `station-item ${div.className}`;
            div.innerHTML = `
                <span>${station.name}</span>
                <span class="station-status ${statusClass}">${statusText}</span>
            `;
            container.appendChild(div);
        });
    }

    renderCarriages() {
        const container = document.getElementById('carriages-list');
        container.innerHTML = '';

        const typeLabels = {
            'economy': '硬座',
            'soft': '软座',
            'sleeper': '卧铺',
            'vip': 'VIP'
        };

        this.gameState.carriages.forEach(carriage => {
            const div = document.createElement('div');
            div.className = 'carriage-item';
            div.innerHTML = `
                <span>${carriage.name}</span>
                <span class="carriage-distance">${typeLabels[carriage.type]} · ${carriage.distance}节</span>
            `;
            container.appendChild(div);
        });
    }

    renderWorkers() {
        const container = document.getElementById('workers-list');
        container.innerHTML = '';

        this.gameState.waiters.forEach(waiter => {
            const div = document.createElement('div');
            div.className = 'worker-item';
            const statusClass = waiter.status === 'idle' ? 'worker-idle' : 'worker-busy';
            const statusText = waiter.status === 'idle' ? '空闲' : '忙碌';

            div.innerHTML = `
                <span>👤 ${waiter.name}</span>
                <span class="worker-status ${statusClass}">${statusText}</span>
            `;
            container.appendChild(div);
        });
    }

    renderPrepStations() {
        const container = document.getElementById('prep-stations');
        container.innerHTML = '';

        this.gameState.prep_stations.forEach(station => {
            const div = document.createElement('div');
            div.className = `prep-station-item ${station.status === 'busy' ? 'busy' : ''}`;
            const statusText = station.status === 'idle' ? '空闲' : '忙碌';

            div.innerHTML = `
                <span>🔥 ${station.name}</span>
                <span>${statusText}</span>
            `;
            container.appendChild(div);
        });
    }

    renderOrders(type, orders) {
        const container = document.getElementById(`${type}-orders`);
        container.innerHTML = '';

        orders.forEach(order => {
            const card = document.createElement('div');
            card.className = `order-card priority-${order.priority}`;

            let timeClass = '';
            if (order.time_percentage < 30) {
                timeClass = 'danger';
            } else if (order.time_percentage < 60) {
                timeClass = 'warning';
            }

            let actionBtn = '';
            if (type === 'pending') {
                actionBtn = `<button class="btn btn-success btn-small order-action-btn" data-order="${order.id}" data-action="prep">🍳 开始备料</button>`;
            } else if (type === 'ready') {
                actionBtn = `<button class="btn btn-primary btn-small order-action-btn" data-order="${order.id}" data-action="deliver">🚚 开始配送</button>`;
            }

            const timeDisplay = order.time_remaining >= 0
                ? `${order.time_remaining}秒`
                : `超时${Math.abs(order.time_remaining)}秒`;

            let prepProgressHtml = '';
            if (type === 'preparing' && order.prep_tasks && order.prep_tasks.length > 0) {
                prepProgressHtml = this.renderPrepProgress(order);
            }

            card.innerHTML = `
                <div class="order-header">
                    <span class="order-icon">${order.recipe_icon}</span>
                    <span class="order-priority">${order.priority_display}</span>
                </div>
                <div class="order-name">${order.recipe_name}</div>
                <div class="order-carriage">🚃 ${order.carriage}</div>
                <div class="order-time-bar">
                    <div class="order-time-fill ${timeClass}" style="width: ${Math.max(0, order.time_percentage)}%"></div>
                </div>
                <div class="order-time-text">
                    <span>⏱️ ${timeDisplay}</span>
                    <span class="order-price">¥${order.base_price}</span>
                </div>
                ${prepProgressHtml}
                ${actionBtn}
            `;

            container.appendChild(card);
        });

        container.querySelectorAll('.order-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const orderId = parseInt(e.target.dataset.order);
                const action = e.target.dataset.action;
                if (action === 'prep') {
                    this.startPreparation(orderId);
                } else if (action === 'deliver') {
                    this.startDelivery(orderId);
                }
            });
        });
    }

    renderPrepProgress(order) {
        const stages = [
            { key: 'prep', label: '备料', icon: '🥗' },
            { key: 'heat', label: '加热', icon: '🔥' },
            { key: 'cook', label: '烹饪', icon: '🍳' },
            { key: 'plate', label: '装盘', icon: '🍽️' }
        ];

        const tasks = order.prep_tasks;
        const summary = order.prep_summary || { total: 0, completed: 0, processing: 0, queued: 0 };

        const ingredientTasks = tasks.filter(t => t.ingredient);
        const stageTasks = tasks.filter(t => !t.ingredient);

        let ingredientListHtml = '';
        const ingredients = [...new Set(ingredientTasks.map(t => t.ingredient))];
        
        ingredients.forEach(ingName => {
            const prepTask = ingredientTasks.find(t => t.ingredient === ingName && t.task_type === 'prep');
            const heatTask = ingredientTasks.find(t => t.ingredient === ingName && t.task_type === 'heat');
            
            let statusIcon = '⏳';
            let statusClass = 'pending';
            
            if (prepTask && prepTask.status === 'completed' && heatTask && heatTask.status === 'completed') {
                statusIcon = '✅';
                statusClass = 'completed';
            } else if (prepTask && prepTask.status === 'processing') {
                statusIcon = '🥗';
                statusClass = 'prepping';
            } else if (heatTask && heatTask.status === 'processing') {
                statusIcon = '🔥';
                statusClass = 'heating';
            }

            const prepIcon = prepTask ? (prepTask.status === 'completed' ? '✓' : (prepTask.status === 'processing' ? '→' : '○')) : '○';
            const heatIcon = heatTask ? (heatTask.status === 'completed' ? '✓' : (heatTask.status === 'processing' ? '→' : '○')) : '○';

            ingredientListHtml += `
                <div class="prep-ingredient-item ${statusClass}">
                    <span class="prep-ing-icon">${prepTask?.ingredient_icon || '🍽️'}</span>
                    <span class="prep-ing-name">${ingName}</span>
                    <span class="prep-ing-steps">
                        <span class="step prep-step ${prepTask?.status || 'pending'}">备${prepIcon}</span>
                        <span class="step heat-step ${heatTask?.status || 'pending'}">加${heatIcon}</span>
                    </span>
                </div>
            `;
        });

        let stageHtml = '';
        stages.forEach((stage, idx) => {
            const stageTask = tasks.find(t => t.task_type === stage.key && !t.ingredient);
            let stageStatus = 'pending';
            let stageProgress = 0;
            
            if (stageTask) {
                stageStatus = stageTask.status;
                stageProgress = stageTask.progress || 0;
            }
            
            if (stage.key === 'prep' || stage.key === 'heat') {
                const ingredientCount = ingredients.length;
                const completedCount = ingredients.filter(ingName => {
                    const sTask = ingredientTasks.find(t => t.ingredient === ingName && t.task_type === stage.key);
                    return sTask && sTask.status === 'completed';
                }).length;
                stageProgress = ingredientCount > 0 ? Math.round(completedCount / ingredientCount * 100) : 0;
                stageStatus = stageProgress === 100 ? 'completed' : (stageProgress > 0 ? 'processing' : 'pending');
            }

            const isActive = stageStatus === 'processing';
            const isDone = stageStatus === 'completed';
            
            stageHtml += `
                <div class="prep-stage ${stageStatus}">
                    <div class="prep-stage-icon">${stage.icon}</div>
                    <div class="prep-stage-label">${stage.label}</div>
                    <div class="prep-stage-bar">
                        <div class="prep-stage-fill" style="width: ${stageProgress}%"></div>
                    </div>
                    ${idx < stages.length - 1 ? '<div class="prep-stage-arrow">→</div>' : ''}
                </div>
            `;
        });

        const overallProgress = summary.total > 0 ? Math.round(summary.completed / summary.total * 100) : 0;

        return `
            <div class="order-prep-progress">
                <div class="prep-stages-row">
                    ${stageHtml}
                </div>
                <div class="prep-overall-bar">
                    <div class="prep-overall-fill" style="width: ${overallProgress}%"></div>
                    <span class="prep-overall-text">备料进度 ${overallProgress}%</span>
                </div>
                <div class="prep-ingredients-list">
                    ${ingredientListHtml}
                </div>
            </div>
        `;
    }

    async startPreparation(orderId) {
        if (!this.currentSession) return;

        const result = await this.apiRequest(
            `game/${this.currentSession.id}/prep`,
            'POST',
            { order_id: orderId }
        );

        if (result.success) {
            this.gameState = result.game_state;
            this.renderGame();
            this.showToast(result.message, 'success');
        } else {
            this.showToast(result.message, 'warning');
        }
    }

    async startDelivery(orderId) {
        if (!this.currentSession) return;

        const result = await this.apiRequest(
            `game/${this.currentSession.id}/deliver`,
            'POST',
            { order_id: orderId }
        );

        if (result.success) {
            this.gameState = result.game_state;
            this.renderGame();
            this.showToast(result.message, 'success');
        } else {
            this.showToast(result.message, 'warning');
        }
    }

    async pauseGame() {
        if (!this.currentSession) return;

        const result = await this.apiRequest(`game/${this.currentSession.id}/pause`, 'POST');
        if (result.success) {
            this.isPaused = true;
            document.getElementById('pause-overlay').classList.remove('hidden');
        }
    }

    async resumeGame() {
        if (!this.currentSession) return;

        const result = await this.apiRequest(`game/${this.currentSession.id}/resume`, 'POST');
        if (result.success) {
            this.isPaused = false;
            this.gameState = result.game_state;
            this.renderGame();
            document.getElementById('pause-overlay').classList.add('hidden');
        }
    }

    async restoreGame() {
        if (!this.currentSession) return;

        const result = await this.apiRequest(`game/${this.currentSession.id}/restore`, 'POST');
        if (result.success) {
            this.gameState = result.game_state;
            this.renderGame();
            this.showToast('游戏进度已从历史记录恢复', 'success');
        }
    }

    async abandonGame() {
        if (!this.currentSession) return;

        if (!confirm('确定要放弃本局游戏吗？所有进度将丢失。')) {
            return;
        }

        const result = await this.apiRequest(`game/${this.currentSession.id}/abandon`, 'POST');
        if (result.success) {
            this.stopGameLoop();
            this.currentSession = null;
            document.getElementById('pause-overlay').classList.add('hidden');
            this.showLevelSelect();
            this.showToast('已放弃游戏', 'info');
        }
    }

    showSettlement(settlement) {
        this.showScreen('settlement-screen');

        document.getElementById('settlement-title').textContent =
            `📊 ${settlement.level} - 日终账单`;

        const starsEl = document.getElementById('settlement-stars');
        starsEl.innerHTML = '⭐'.repeat(settlement.scores.stars) +
            '☆'.repeat(5 - settlement.scores.stars);

        const resultEl = document.getElementById('settlement-result');
        resultEl.textContent = settlement.result;
        resultEl.className = `result-text ${settlement.result === '通关' ? 'win' : 'lose'}`;

        document.getElementById('income-orders').textContent = `¥${settlement.income.order_income}`;
        document.getElementById('income-tips').textContent = `¥${settlement.income.tips}`;
        document.getElementById('income-total').textContent = `¥${settlement.income.total}`;

        document.getElementById('cost-ingredients').textContent = `¥${settlement.costs.ingredients}`;
        document.getElementById('cost-fines').textContent = `¥${settlement.costs.fines}`;
        document.getElementById('cost-total').textContent = `¥${settlement.costs.total}`;

        document.getElementById('profit-total').textContent = `¥${settlement.profit}`;

        document.getElementById('orders-completed').textContent = settlement.orders.completed;
        document.getElementById('orders-failed').textContent = settlement.orders.failed;
        document.getElementById('orders-perfect').textContent = settlement.orders.perfect;
        document.getElementById('orders-late').textContent = settlement.orders.late;
        document.getElementById('completion-rate').textContent = `${settlement.orders.completion_rate}%`;

        document.getElementById('score-base').textContent = settlement.scores.base_score;
        document.getElementById('score-efficiency').textContent = settlement.scores.efficiency;
        document.getElementById('score-speed').textContent = settlement.scores.speed;
        document.getElementById('score-quality').textContent = settlement.scores.quality;
        document.getElementById('score-final').textContent = settlement.scores.final;
        document.getElementById('score-target').textContent = settlement.scores.target;

        if (this.currentPlayer) {
            this.currentPlayer.total_score += settlement.scores.final;
            this.currentPlayer.games_played += 1;
            if (settlement.result === '通关') {
                this.currentPlayer.games_won += 1;
            }
            this.updatePlayerInfo();
        }
    }

    async replayLevel() {
        if (this.currentLevelId) {
            this.currentSession = null;
            await this.startGame(this.currentLevelId);
        }
    }

    async showHistory() {
        this.showScreen('history-screen');
        const result = await this.apiRequest('player/history');

        if (result.success) {
            this.renderHistory(result.history);
        }
    }

    renderHistory(history) {
        const container = document.getElementById('history-list');

        if (history.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #6b7280;">暂无游戏记录</div>';
            return;
        }

        container.innerHTML = '';

        const statusLabels = {
            'won': '通关',
            'lost': '失败',
            'abandoned': '放弃',
            'playing': '进行中',
            'paused': '暂停'
        };

        history.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';

            const stars = '⭐'.repeat(item.stars);
            const date = new Date(item.start_time).toLocaleString('zh-CN');

            div.innerHTML = `
                <div class="history-info">
                    <div class="history-level">第${item.level_number}关 - ${item.level_name}</div>
                    <div class="history-meta">
                        ${date} · 状态: ${statusLabels[item.status]} ·
                        完成: ${item.orders_completed} · 失败: ${item.orders_failed}
                    </div>
                </div>
                <div class="history-stats">
                    <span class="history-stars">${stars}</span>
                    <span class="history-score">${item.final_score}分</span>
                </div>
            `;

            container.appendChild(div);
        });
    }

    async showStats() {
        this.showScreen('stats-screen');
        const result = await this.apiRequest('player/stats');

        if (result.success) {
            this.renderStats(result.stats);
        }
    }

    renderStats(stats) {
        const container = document.getElementById('stats-content');
        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${stats.total_games}</div>
                    <div class="stat-label">总游戏次数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.games_won}</div>
                    <div class="stat-label">胜利次数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.win_rate}%</div>
                    <div class="stat-label">胜率</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.total_score}</div>
                    <div class="stat-label">累计分数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${Math.round(stats.avg_score)}</div>
                    <div class="stat-label">平均分数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.highest_level}</div>
                    <div class="stat-label">最高关卡</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.total_orders}</div>
                    <div class="stat-label">完成订单</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.total_perfect}</div>
                    <div class="stat-label">完美订单</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.order_success_rate}%</div>
                    <div class="stat-label">订单成功率</div>
                </div>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new TrainDiningGame();
});
