const GameMain = {
    currentLevel: 'zi',
    isReplayMode: false,
    replayStepIndex: -1,

    init() {
        BoardUI.init((nodeId) => this.handleNodeClick(nodeId));
        EventUI.init();
        ReplayUI.init((stepIndex) => this.handleReplayClick(stepIndex));
        ResultUI.init();
        ModalUI.init();

        this.setupEventListeners();

        const hasSavedState = GameEngine.loadState();
        if (hasSavedState) {
            this.currentLevel = GameEngine.level.id;
            this.updateLevelButtons();
            this.renderAll();
            
            if (GameEngine.gameOver) {
                ModalUI.show(
                    '欢迎回来',
                    `检测到上次的游戏记录。当前局已结束，是否继续？<br><br>点击「确定」查看当前结算。`,
                    () => {
                        if (GameEngine.gameOver) {
                            this.showSettlement();
                        }
                    }
                );
            } else {
                ModalUI.show(
                    '欢迎回来',
                    '检测到未完成的推演记录，已自动恢复上次进度。<br><br>继续你的银盐暗房航线推演吧！'
                );
            }
        } else {
            this.startLevel('zi');
        }
    },

    setupEventListeners() {
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const levelId = btn.dataset.level;
                if (levelId !== this.currentLevel) {
                    if (!GameEngine.gameOver && GameEngine.steps.length > 0) {
                        ModalUI.show(
                            '确认切换',
                            '当前局尚未完成，切换关卡将丢失当前进度。<br><br>确定要切换吗？',
                            () => {
                                this.startLevel(levelId);
                            }
                        );
                    } else {
                        this.startLevel(levelId);
                    }
                }
            });
        });

        document.getElementById('undoBtn').addEventListener('click', () => {
            this.handleUndo();
        });

        document.getElementById('hintBtn').addEventListener('click', () => {
            this.showHint();
        });

        document.getElementById('replayBtn').addEventListener('click', () => {
            this.toggleReplayMode();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.handleReset();
        });

        document.getElementById('settleBtn').addEventListener('click', () => {
            this.showSettlement();
        });
    },

    startLevel(levelId) {
        this.currentLevel = levelId;
        this.isReplayMode = false;
        this.replayStepIndex = -1;

        GameEngine.init(levelId);
        this.updateLevelButtons();
        this.renderAll();
        ResultUI.showEmpty();
        ResultUI.setSettleEnabled(false);

        const level = Levels.getLevel(levelId);
        if (level) {
            document.getElementById('levelName').textContent = level.name;
        }
    },

    updateLevelButtons() {
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.level === this.currentLevel);
        });
    },

    handleNodeClick(nodeId) {
        if (this.isReplayMode) {
            ModalUI.show('回放模式', '当前处于回放模式，请先退出回放再进行操作。');
            return;
        }

        const result = GameEngine.moveTo(nodeId);

        if (result.success) {
            this.renderAll();

            if (result.event) {
                setTimeout(() => {
                    this.showEventPopup(result.event);
                }, 100);
            }

            if (GameEngine.gameOver) {
                setTimeout(() => {
                    this.showGameOver();
                }, 500);
            }
        } else {
            ModalUI.show('无法移动', result.message);
        }
    },

    handleUndo() {
        if (this.isReplayMode) {
            ModalUI.show('回放模式', '当前处于回放模式，请先退出回放再进行操作。');
            return;
        }

        const result = GameEngine.undo();
        if (result.success) {
            this.renderAll();
            ResultUI.setSettleEnabled(false);
        } else {
            ModalUI.show('提示', result.message);
        }
    },

    handleReset() {
        ModalUI.show(
            '确认重置',
            '确定要重置当前局吗？所有进度将被清除。',
            () => {
                this.isReplayMode = false;
                this.replayStepIndex = -1;
                GameEngine.reset();
                this.renderAll();
                ResultUI.showEmpty();
                ResultUI.setSettleEnabled(false);
            }
        );
    },

    showHint() {
        const level = Levels.getLevel(this.currentLevel);
        if (level && level.hints && level.hints.length > 0) {
            const hintIndex = Math.min(
                Math.floor(GameEngine.steps.length / 2),
                level.hints.length - 1
            );
            ModalUI.show('推演提示', level.hints[hintIndex]);
        } else {
            ModalUI.show('提示', '暂无可用提示。');
        }
    },

    handleReplayClick(stepIndex) {
        if (!this.isReplayMode) {
            this.isReplayMode = true;
        }

        this.replayStepIndex = stepIndex;

        if (stepIndex === -1) {
            GameEngine.replayToStep(-1);
        } else {
            GameEngine.replayToStep(stepIndex);
        }

        this.renderBoard();
        this.renderStatus();
        this.renderReplay();
    },

    toggleReplayMode() {
        if (GameEngine.steps.length === 0) {
            ModalUI.show('提示', '暂无回放记录。');
            return;
        }

        if (this.isReplayMode) {
            this.exitReplayMode();
        } else {
            this.enterReplayMode();
        }
    },

    enterReplayMode() {
        this.isReplayMode = true;
        this.replayStepIndex = -1;
        GameEngine.replayToStep(-1);
        this.renderBoard();
        this.renderStatus();
        this.renderReplay();

        ModalUI.show(
            '回放模式',
            '已进入回放模式。<br>点击回放轴上的步骤可以查看当时的状态。<br><br>再次点击回放按钮可退出回放。'
        );
    },

    exitReplayMode() {
        this.isReplayMode = false;
        this.replayStepIndex = -1;
        GameEngine.loadState();
        this.renderAll();
    },

    showEventPopup(event) {
        const typeMap = {
            'positive': '增益事件',
            'negative': '减益事件',
            'neutral': '中性事件',
            'special': '特殊事件'
        };

        let effectsText = '';
        if (event.effects) {
            const effects = [];
            if (event.effects.balanceValue) {
                effects.push(`配平值 ${event.effects.balanceValue > 0 ? '+' : ''}${event.effects.balanceValue}`);
            }
            if (event.effects.infectionTank) {
                effects.push(`熏染槽 ${event.effects.infectionTank > 0 ? '+' : ''}${event.effects.infectionTank}`);
            }
            if (event.effects.mergeMark) {
                effects.push(`归并痕 +${event.effects.mergeMark}`);
            }
            if (event.effects.ziRisk) {
                effects.push(`子号风险 +${event.effects.ziRisk}`);
            }
            if (event.effects.maoReward) {
                effects.push(`卯号奖励 +${event.effects.maoReward}`);
            }
            if (event.effects.chouFailFactor) {
                effects.push(`丑号失败因子 +${event.effects.chouFailFactor}`);
            }
            effectsText = effects.join('<br>');
        }

        ModalUI.show(
            `${typeMap[event.type] || '事件'} - ${event.title}`,
            `${event.description}<br><br><strong>效果：</strong><br>${effectsText}`
        );
    },

    async showGameOver() {
        const backendResult = await this.fetchBackendSettlement();
        let score, won;
        
        if (backendResult && backendResult.valid) {
            score = backendResult.score;
            won = backendResult.gameWon;
            Storage.saveBestScore(this.currentLevel, score);
            ResultUI.render(this.convertBackendResult(backendResult));
        } else {
            const details = GameEngine.getSettlementDetails();
            score = details.score;
            won = details.won;
            Storage.saveBestScore(this.currentLevel, score);
            ResultUI.render(details);
        }

        if (won === true) {
            ModalUI.show(
                '推演成功！',
                `恭喜你完成了 ${Levels.getLevel(this.currentLevel).name}！<br><br>最终得分（后端重算）：<strong style="font-size: 1.5em; color: #d4a017;">${score} 分</strong><br><br>结算簿已显示详细信息。`
            );
        } else if (won === 'partial') {
            ModalUI.show(
                '航线达成',
                `你抵达了终点，但似乎还有未解锁的秘密...<br><br>最终得分（后端重算）：<strong style="font-size: 1.2em; color: #d4a017;">${score} 分</strong><br><br>提示：尝试收集更多归并痕以触发隐藏条件。`
            );
        } else {
            ModalUI.show(
                '推演失败',
                `这次推演失败了...<br><br>最终得分（后端重算）：<strong style="font-size: 1.2em; color: #c44536;">${score} 分</strong><br><br>不要气馁，再试一次吧！`
            );
        }
    },

    async showSettlement() {
        const result = await this.fetchBackendSettlement();
        
        if (result && result.valid) {
            ResultUI.render(this.convertBackendResult(result));
        } else {
            const details = GameEngine.getSettlementDetails();
            ResultUI.render(details);
        }
    },

    async fetchBackendSettlement() {
        try {
            const steps = GameEngine.steps.map(s => ({ toNode: s.toNode }));
            
            const response = await fetch('/api/settle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    levelId: this.currentLevel,
                    steps: steps
                })
            });

            if (response.ok) {
                const result = await response.json();
                return result;
            }
            return null;
        } catch (e) {
            console.log('后端结算不可用，使用前端结算');
            return null;
        }
    },

    convertBackendResult(backendResult) {
        return {
            won: backendResult.gameWon,
            finalState: backendResult.finalState,
            steps: GameEngine.steps.length,
            eventsTriggered: backendResult.eventLog.length,
            score: backendResult.score,
            details: backendResult.details,
            isBackendCalculated: true
        };
    },

    renderAll() {
        this.renderBoard();
        this.renderStatus();
        this.renderEvents();
        this.renderReplay();
        this.renderStepCount();

        const canSettle = GameEngine.gameOver;
        ResultUI.setSettleEnabled(canSettle);
    },

    renderBoard() {
        const gameState = {
            currentNode: GameEngine.currentNode,
            visitedNodes: [...GameEngine.visitedNodes],
            pathEdges: [...GameEngine.pathEdges],
            reachableNodes: this.isReplayMode ? [] : GameEngine.getReachableNodes()
        };
        BoardUI.render(GameEngine.level, gameState);
    },

    renderStatus() {
        document.getElementById('balanceValue').textContent = GameEngine.state.balanceValue;
        document.getElementById('infectionTank').textContent = GameEngine.state.infectionTank;
        document.getElementById('mergeMark').textContent = GameEngine.state.mergeMark;
        document.getElementById('ziRisk').textContent = GameEngine.state.ziRisk;
        document.getElementById('maoReward').textContent = GameEngine.state.maoReward;
        document.getElementById('chouFailFactor').textContent = GameEngine.state.chouFailFactor;
    },

    renderEvents() {
        EventUI.render(GameEngine.eventLog);
    },

    renderReplay() {
        const currentIndex = this.isReplayMode ? this.replayStepIndex : (GameEngine.steps.length - 1);
        ReplayUI.render(GameEngine.steps, currentIndex);
    },

    renderStepCount() {
        document.getElementById('stepCount').textContent = GameEngine.steps.length;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    GameMain.init();
});
