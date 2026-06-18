const Game = {
    init(gameId) {
        if (!GameState.init(gameId)) {
            UI.showModal('错误', '无效的游戏配置');
            return false;
        }

        Timeline.clear();
        Events.clear();
        Settlement.clear();
        
        Board.render();
        UI.updateHeader();
        UI.updateStatus(`${GameState.getGameConfig().name} - 准备开始`);
        
        document.getElementById('btn-start').style.display = 'none';
        document.getElementById('btn-restart').style.display = '';
        
        this.nextTurn();

        return true;
    },

    resume() {
        if (!GameState.initialized) return false;
        
        Board.render();
        Timeline.loadFromHistory();
        UI.updateHeader();
        
        document.getElementById('btn-start').style.display = 'none';
        document.getElementById('btn-restart').style.display = '';
        document.getElementById('game-selector').value = GameState.currentGame;

        if (GameState.gameOver) {
            (async () => {
                Events.renderLoading('正在加载结算数据...');
                const result = await Settlement.calculateFromServer();
                if (result && !result.error) {
                    Settlement.render(result);
                    Events.renderEnd();
                    UI.updateStatus('游戏已结束，点击"重新开始"开始新游戏');
                } else {
                    const fallbackResult = Settlement.calculate();
                    Settlement.render(fallbackResult);
                    Events.renderEnd();
                    UI.updateStatus('游戏已结束，点击"重新开始"开始新游戏');
                }
            })();
        } else {
            const config = GameState.getGameConfig();
            const nextTurnNum = GameState.history.length + 1;

            if (nextTurnNum > config.turns) {
                this.endGame();
            } else {
                GameState.currentTurn = nextTurnNum;
                const event = Events.getEventForTurn(nextTurnNum);
                if (event) {
                    Events.render(event);
                    UI.updateStatus(`回合 ${nextTurnNum}/${config.turns} - ${event.title}`);
                    GameState.save();
                } else {
                    this.endGame();
                }
            }
        }

        return true;
    },

    nextTurn() {
        if (GameState.gameOver) return;

        const config = GameState.getGameConfig();
        GameState.currentTurn = GameState.history.length + 1;
        
        if (GameState.currentTurn > config.turns) {
            this.endGame();
            return;
        }

        const event = Events.getEventForTurn(GameState.currentTurn);
        if (!event) {
            this.endGame();
            return;
        }

        UI.updateHeader();
        Board.renderMap();
        Events.render(event);
        
        UI.updateStatus(`回合 ${GameState.currentTurn}/${config.turns} - ${event.title}`);
        
        GameState.save();
    },

    checkGameState() {
        if (GameState.gameOver) return;

        if (GameState.checkFail()) {
            this.endGame(false, 'fail');
            return;
        }

        if (GameState.checkWin()) {
            this.endGame(true, 'win');
            return;
        }

        this.nextTurn();
    },

    async endGame(forceWin = null, reason = null) {
        GameState.gameOver = true;
        
        Events.renderLoading('后端正在结算...');
        UI.updateStatus('正在请求后端结算...');

        let result = await Settlement.calculateFromServer();
        if (result && !result.error) {
            console.log('[结算] 后端结算成功:', result.score, result.rank);
        } else {
            console.warn('[结算] 后端结算失败，使用本地计算');
            result = Settlement.calculate();
        }

        let isWin = forceWin;
        if (isWin === null) {
            isWin = result.isWin;
        }

        if (result) {
            result.isWin = isWin;
            result.isFail = reason === 'fail';
        }
        
        Settlement.render(result);
        Events.renderEnd();
        GameState.save();

        let message = '';
        if (reason === 'fail') {
            message = '经营失败！风险过高或资源耗尽，塔楼无法继续运转。';
        } else if (isWin) {
            message = `恭喜！你成功经营了霜花塔楼，获得 ${result.rank} 评级！`;
            if (result.hiddenTriggered) {
                message += '\n\n✨ 你解锁了隐藏结局！霜花塔楼的秘密被你揭开了。';
            }
        } else {
            message = '游戏结束，但未达成胜利条件。再接再厉！';
        }

        UI.updateHeader();
        Board.renderMap();
        UI.updateStatus(message.split('\n')[0]);
        UI.showModal('游戏结束', message);
    },

    restart() {
        if (GameState.currentGame) {
            UI.showModal('确认重新开始', '确定要重新开始当前局吗？当前进度将被清除。', () => {
                const gameId = GameState.currentGame;
                GameState.clear();
                Timeline.clear();
                Settlement.clear();
                this.init(gameId);
            });
        }
    }
};

const UI = {
    modal: null,
    modalTitle: null,
    modalBody: null,
    modalClose: null,
    modalCallback: null,

    init() {
        this.modal = document.getElementById('modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalBody = document.getElementById('modal-body');
        this.modalClose = document.getElementById('modal-close');

        this.modalClose.addEventListener('click', () => {
            this.hideModal();
        });

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });

        document.getElementById('btn-start').addEventListener('click', () => {
            const gameId = document.getElementById('game-selector').value;
            Game.init(gameId);
        });

        document.getElementById('btn-restart').addEventListener('click', () => {
            Game.restart();
        });

        this.updateStatus('选择一局开始你的霜花塔楼之旅');
    },

    showModal(title, body, callback = null) {
        this.modalTitle.textContent = title;
        this.modalBody.innerHTML = body.replace(/\n/g, '<br>');
        this.modalCallback = callback;
        this.modal.classList.remove('hidden');
    },

    hideModal() {
        this.modal.classList.add('hidden');
        if (this.modalCallback) {
            const cb = this.modalCallback;
            this.modalCallback = null;
            cb();
        }
    },

    updateHeader() {
        const config = GameState.getGameConfig();
        document.getElementById('current-game-label').textContent = 
            `当前局：${config ? config.name : '未开始'}`;
        document.getElementById('current-turn-label').textContent = 
            `回合：${GameState.currentTurn}${config ? '/' + config.turns : ''}`;
    },

    updateStatus(message) {
        document.getElementById('game-status').textContent = message;
    }
};
