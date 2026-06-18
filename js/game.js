var Game = {
    currentLevel: null,
    levelConfig: null,
    state: null,
    turn: 0,
    history: [],
    usedEventIds: [],
    isGameOver: false,
    hiddenTriggered: false,

    init: function() {
        this.bindComponents();
        this.bindGameControls();
        this.tryResume();
    },

    bindComponents: function() {
        var self = this;

        Board.init();
        EventBox.init(function(event, choice) {
            self.handleChoice(event, choice);
        });
        ReplayTimeline.init(
            function() { self.undoStep(); },
            function(step) { self.jumpToStep(step); }
        );
        Settlement.init(function() {
            self.recalculateSettlement();
        });
    },

    bindGameControls: function() {
        var self = this;

        var drawBtn = document.getElementById('btn-draw');
        if (drawBtn) {
            drawBtn.addEventListener('click', function() {
                self.drawEvent();
            });
        }

        var settleBtn = document.getElementById('btn-settle');
        if (settleBtn) {
            settleBtn.addEventListener('click', function() {
                self.settle();
            });
        }

        var resetBtn = document.getElementById('btn-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', function() {
                if (confirm('确定要重置本局吗？所有进度将被清除。')) {
                    self.resetLevel();
                }
            });
        }

        var levelButtons = document.querySelectorAll('.btn-level');
        levelButtons.forEach(function(btn) {
            btn.addEventListener('click', function() {
                var levelId = btn.getAttribute('data-level');
                self.selectLevel(levelId);
            });
        });

        var modalClose = document.getElementById('modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', function() {
                self.hideModal();
            });
        }
    },

    tryResume: function() {
        var saved = Storage.load();
        if (saved && saved.currentLevel) {
            this.currentLevel = saved.currentLevel;
            this.levelConfig = GameConfig.levels[saved.currentLevel];
            this.state = saved.state;
            this.turn = saved.turn;
            this.history = saved.history || [];
            this.usedEventIds = saved.usedEventIds || [];
            this.isGameOver = saved.isGameOver || false;
            this.hiddenTriggered = saved.hiddenTriggered || false;

            Board.setLevelConfig(this.levelConfig);
            Settlement.setLevelConfig(this.levelConfig);

            ReplayTimeline.setHistory(this.history, this.turn);

            if (this.isGameOver && this.turn > 0) {
                Settlement.showSettlement(this.state, this.turn, this.hiddenTriggered);
                EventBox.showEmpty();
            } else if (this.turn > 0) {
                EventBox.showEmpty();
            }

            this.updateUI();
            this.updateLevelButtons();
            this.showModal('继续游戏', '检测到之前的游戏进度，已自动恢复。当前局：' + this.levelConfig.name + '，已完成 ' + this.turn + ' 个回合。');
        }
    },

    selectLevel: function(levelId) {
        var config = GameConfig.levels[levelId];
        if (!config) return;

        if (this.currentLevel && this.history.length > 0 && !this.isGameOver) {
            if (!confirm('切换局将丢失当前进度，确定继续吗？')) {
                return;
            }
        }

        this.currentLevel = levelId;
        this.levelConfig = config;
        this.state = JSON.parse(JSON.stringify(config.initialState));
        this.turn = 0;
        this.history = [];
        this.usedEventIds = [];
        this.isGameOver = false;
        this.hiddenTriggered = false;

        Board.setLevelConfig(config);
        Settlement.setLevelConfig(config);

        EventBox.showEmpty();
        ReplayTimeline.clear();
        Settlement.showEmpty();

        this.updateUI();
        this.updateLevelButtons();
        this.save();
    },

    resetLevel: function() {
        if (!this.currentLevel) return;
        this.selectLevel(this.currentLevel);
    },

    drawEvent: function() {
        if (!this.levelConfig || this.isGameOver) return;
        if (this.turn >= this.levelConfig.maxTurns) return;

        var event = this.getRandomEvent();
        if (!event) {
            this.showModal('提示', '事件已用完，可以结算了。');
            return;
        }

        EventBox.showEvent(event, this.state);
    },

    getRandomEvent: function() {
        var pool = this.levelConfig.eventPool;
        var available = [];

        for (var i = 0; i < pool.length; i++) {
            if (this.usedEventIds.indexOf(pool[i].id) === -1) {
                available.push(pool[i]);
            }
        }

        if (available.length === 0) {
            return null;
        }

        var lastEvents = this.history.slice(-3);
        var hasLastEvent = false;
        
        for (var j = 0; j < available.length; j++) {
            if (available[j].id === 'mao_ev_10') {
                if (this.turn < this.levelConfig.maxTurns - 2) {
                    available.splice(j, 1);
                    j--;
                }
            }
        }

        var randomIndex = Math.floor(Math.random() * available.length);
        return available[randomIndex];
    },

    handleChoice: function(event, choice) {
        if (!event || !choice) return;

        if (choice.requires) {
            for (var reqKey in choice.requires) {
                if (this.state[reqKey] < choice.requires[reqKey]) {
                    this.showModal('条件不足', '你还不满足选择此选项的条件。');
                    return;
                }
            }
        }

        var historyEntry = {
            eventId: event.id,
            eventTitle: event.title,
            choiceIndex: event.choices.indexOf(choice),
            choiceText: choice.text,
            effect: JSON.parse(JSON.stringify(choice.effect)),
            stateBefore: JSON.parse(JSON.stringify(this.state)),
            turn: this.turn + 1
        };

        this.applyEffect(choice.effect);
        this.usedEventIds.push(event.id);
        this.turn++;
        this.history.push(historyEntry);

        if (choice.effect.hiddenTrigger) {
            this.hiddenTriggered = true;
        }

        this.checkGameEnd();
        this.updateUI();
        this.save();

        EventBox.showResult(event, choice, this.state);
        ReplayTimeline.setHistory(this.history, this.turn);
    },

    applyEffect: function(effect) {
        if (!effect) return;

        var keys = ['unlockValue', 'unlockSlots', 'traceMarks', 'renRisk', 'dingReward', 'maoFailFactor'];
        
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (effect[key] !== undefined) {
                var change = effect[key];
                
                if (key === 'unlockValue' && this.levelConfig.id === 'ding') {
                    if (change > 0) {
                        change = change * this.state.dingReward;
                    }
                }
                
                this.state[key] = Math.round((this.state[key] + change) * 100) / 100;
                
                if (key === 'unlockSlots' && this.state[key] < 0) {
                    this.state[key] = 0;
                }
                if (key === 'traceMarks' && this.state[key] < 0) {
                    this.state[key] = 0;
                }
                if (key === 'renRisk' && this.state[key] < 0) {
                    this.state[key] = 0;
                }
                if (key === 'maoFailFactor' && this.state[key] < 0) {
                    this.state[key] = 0;
                }
            }
        }
    },

    checkGameEnd: function() {
        if (this.turn >= this.levelConfig.maxTurns) {
            this.isGameOver = true;
            return;
        }

        var failCond = this.levelConfig.failCondition;
        if (failCond) {
            if (failCond.type === 'renRisk' && this.state.renRisk >= failCond.threshold) {
                this.isGameOver = true;
                return;
            }
            if (failCond.type === 'maoFailFactor' && this.state.maoFailFactor >= failCond.threshold) {
                this.isGameOver = true;
                return;
            }
            if (failCond.type === 'unlockSlots') {
                if (this.state.unlockSlots <= failCond.threshold) {
                    var canRecover = this.checkIfCanRecoverSlots();
                    if (!canRecover) {
                        this.isGameOver = true;
                        return;
                    }
                }
            }
        }

        if (this.hiddenTriggered) {
            this.isGameOver = true;
        }
    },

    checkIfCanRecoverSlots: function() {
        var remainingEvents = this.getRemainingEvents();
        for (var i = 0; i < remainingEvents.length; i++) {
            var event = remainingEvents[i];
            for (var j = 0; j < event.choices.length; j++) {
                var choice = event.choices[j];
                if (choice.effect && choice.effect.unlockSlots && choice.effect.unlockSlots > 0) {
                    return true;
                }
            }
        }
        return false;
    },

    getRemainingEvents: function() {
        var pool = this.levelConfig.eventPool;
        var remaining = [];
        for (var i = 0; i < pool.length; i++) {
            if (this.usedEventIds.indexOf(pool[i].id) === -1) {
                remaining.push(pool[i]);
            }
        }
        return remaining;
    },

    undoStep: function() {
        if (this.history.length === 0) return;

        var lastStep = this.history.pop();
        this.state = JSON.parse(JSON.stringify(lastStep.stateBefore));
        this.turn--;
        this.usedEventIds = this.usedEventIds.filter(function(id) {
            return id !== lastStep.eventId;
        });

        if (this.hiddenTriggered && lastStep.effect && lastStep.effect.hiddenTrigger) {
            this.hiddenTriggered = false;
        }

        this.isGameOver = false;
        this.updateUI();
        this.save();

        ReplayTimeline.setHistory(this.history, this.turn);
        EventBox.showEmpty();
        Settlement.showEmpty();
    },

    jumpToStep: function(stepIndex) {
    },

    settle: function() {
        if (!this.levelConfig) return;

        var wasAlreadyOver = this.isGameOver;
        this.isGameOver = true;
        Settlement.showSettlement(this.state, this.turn, this.hiddenTriggered);
        this.save();

        if (!wasAlreadyOver) {
            var result = this.levelConfig.settlementFormula(this.state, this.hiddenTriggered);
            if (result.isWin) {
                this.showModal('🎉 经营成功！', '恭喜你成功经营了苔藓邮站！最终得分：' + result.total);
            } else {
                this.showModal('😢 经营失败', '很遗憾，这次经营没有成功。再接再厉！最终得分：' + result.total);
            }
        }
    },

    recalculateSettlement: function() {
        if (!this.levelConfig || !this.isGameOver) return;

        var self = this;
        Settlement.recalculateFromBackend(
            this.currentLevel,
            this.history,
            this.hiddenTriggered,
            function(backendData) {
                Settlement.showSettlement(
                    backendData.finalState,
                    backendData.steps,
                    self.hiddenTriggered,
                    backendData.settlement
                );
                self.showModal(
                    '后端重算完成',
                    '苔藓邮站后端服务已按解锁值和竞速经营步骤重算完成。最终得分：' + backendData.settlement.total
                );
            }
        );
    },

    simulateGameFromHistory: function() {
        var simState = JSON.parse(JSON.stringify(this.levelConfig.initialState));
        
        for (var i = 0; i < this.history.length; i++) {
            var step = this.history[i];
            var effect = step.effect;
            
            var keys = ['unlockValue', 'unlockSlots', 'traceMarks', 'renRisk', 'dingReward', 'maoFailFactor'];
            for (var j = 0; j < keys.length; j++) {
                var key = keys[j];
                if (effect[key] !== undefined) {
                    var change = effect[key];
                    
                    if (key === 'unlockValue' && this.levelConfig.id === 'ding') {
                        if (change > 0) {
                            change = change * simState.dingReward;
                        }
                    }
                    
                    simState[key] = Math.round((simState[key] + change) * 100) / 100;
                    
                    if (key === 'unlockSlots' && simState[key] < 0) simState[key] = 0;
                    if (key === 'traceMarks' && simState[key] < 0) simState[key] = 0;
                    if (key === 'renRisk' && simState[key] < 0) simState[key] = 0;
                    if (key === 'maoFailFactor' && simState[key] < 0) simState[key] = 0;
                }
            }
        }
        
        return simState;
    },

    updateUI: function() {
        if (!this.levelConfig) return;

        Board.render(this.state, this.turn);

        var turnLabel = document.getElementById('turn-counter');
        if (turnLabel) {
            turnLabel.textContent = '回合：' + this.turn + ' / ' + this.levelConfig.maxTurns;
        }

        var levelLabel = document.getElementById('current-level-label');
        if (levelLabel) {
            levelLabel.textContent = '当前局：' + this.levelConfig.name;
        }

        var drawBtn = document.getElementById('btn-draw');
        if (drawBtn) {
            drawBtn.disabled = this.isGameOver || this.turn >= this.levelConfig.maxTurns || !this.currentLevel;
        }

        var settleBtn = document.getElementById('btn-settle');
        if (settleBtn) {
            if (!this.currentLevel || this.turn === 0) {
                settleBtn.disabled = true;
                settleBtn.textContent = '📊 结算';
            } else if (this.isGameOver) {
                settleBtn.disabled = false;
                settleBtn.textContent = '📊 查看结算';
            } else {
                settleBtn.disabled = false;
                settleBtn.textContent = '📊 提前结算';
            }
        }

        var undoBtn = document.getElementById('btn-undo');
        if (undoBtn) {
            undoBtn.disabled = this.history.length === 0;
        }

        var resetBtn = document.getElementById('btn-reset');
        if (resetBtn) {
            resetBtn.disabled = !this.currentLevel;
        }
    },

    updateLevelButtons: function() {
        var buttons = document.querySelectorAll('.btn-level');
        buttons.forEach(function(btn) {
            var levelId = btn.getAttribute('data-level');
            if (levelId === this.currentLevel) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }.bind(this));
    },

    save: function() {
        var saveData = {
            currentLevel: this.currentLevel,
            state: this.state,
            turn: this.turn,
            history: this.history,
            usedEventIds: this.usedEventIds,
            isGameOver: this.isGameOver,
            hiddenTriggered: this.hiddenTriggered,
            timestamp: Date.now()
        };
        Storage.save(saveData);
    },

    showModal: function(title, message) {
        var modal = document.getElementById('modal');
        var modalTitle = document.getElementById('modal-title');
        var modalMessage = document.getElementById('modal-message');
        
        if (modal && modalTitle && modalMessage) {
            modalTitle.textContent = title;
            modalMessage.textContent = message;
            modal.classList.remove('hidden');
        }
    },

    hideModal: function() {
        var modal = document.getElementById('modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
};
