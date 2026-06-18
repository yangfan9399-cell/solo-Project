const GameState = {
    currentGame: null,
    currentTurn: 0,
    stats: {},
    history: [],
    choices: [],
    gameOver: false,
    gameResult: null,
    hiddenTriggered: false,
    initialized: false,

    init(gameId) {
        const gameConfig = GameConfig.GAMES[gameId];
        if (!gameConfig) return false;

        this.currentGame = gameId;
        this.currentTurn = 0;
        this.stats = { ...gameConfig.startStats };
        this.history = [];
        this.choices = [];
        this.gameOver = false;
        this.gameResult = null;
        this.hiddenTriggered = false;
        this.initialized = true;
        this.save();
        return true;
    },

    load() {
        try {
            const saved = localStorage.getItem(GameConfig.STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                this.currentGame = data.currentGame;
                this.currentTurn = data.currentTurn;
                this.stats = data.stats;
                this.history = data.history || [];
                this.choices = data.choices || [];
                this.gameOver = data.gameOver || false;
                this.gameResult = data.gameResult;
                this.hiddenTriggered = data.hiddenTriggered || false;
                this.initialized = data.initialized || false;
                return true;
            }
        } catch (e) {
            console.error('加载存档失败:', e);
        }
        return false;
    },

    save() {
        try {
            const data = {
                currentGame: this.currentGame,
                currentTurn: this.currentTurn,
                stats: this.stats,
                history: this.history,
                choices: this.choices,
                gameOver: this.gameOver,
                gameResult: this.gameResult,
                hiddenTriggered: this.hiddenTriggered,
                initialized: this.initialized,
                savedAt: new Date().toISOString()
            };
            localStorage.setItem(GameConfig.STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('保存存档失败:', e);
            return false;
        }
    },

    clear() {
        localStorage.removeItem(GameConfig.STORAGE_KEY);
        this.currentGame = null;
        this.currentTurn = 0;
        this.stats = {};
        this.history = [];
        this.choices = [];
        this.gameOver = false;
        this.gameResult = null;
        this.hiddenTriggered = false;
        this.initialized = false;
    },

    updateStats(effects) {
        for (const [key, value] of Object.entries(effects)) {
            if (this.stats.hasOwnProperty(key)) {
                this.stats[key] += value;
                if (GameConfig.MAX_STATS[key]) {
                    this.stats[key] = Math.max(0, Math.min(this.stats[key], GameConfig.MAX_STATS[key]));
                } else {
                    this.stats[key] = Math.max(0, this.stats[key]);
                }
            }
        }
    },

    canAfford(cost) {
        if (!cost) return true;
        for (const [key, value] of Object.entries(cost)) {
            if (this.stats[key] < value) {
                return false;
            }
        }
        return true;
    },

    addHistory(entry) {
        this.history.push({
            ...entry,
            turn: this.currentTurn,
            timestamp: new Date().toISOString()
        });
    },

    addChoice(choiceText) {
        this.choices.push(choiceText);
    },

    getGameConfig() {
        return GameConfig.GAMES[this.currentGame];
    },

    checkWin() {
        const config = this.getGameConfig();
        if (!config) return false;
        return config.winCondition(this.stats);
    },

    checkFail() {
        const config = this.getGameConfig();
        if (!config) return false;
        return config.failCondition(this.stats);
    },

    checkHidden() {
        const config = this.getGameConfig();
        if (!config || !config.hiddenCondition) return false;
        return config.hiddenCondition(this.stats, this.choices);
    },

    calculateScore() {
        const config = this.getGameConfig();
        if (!config) return 0;
        const steps = this.history.length;
        return config.victoryFormula(this.stats, steps, this.hiddenTriggered);
    },

    getRank(score) {
        const thresholds = GameConfig.RANK_THRESHOLDS;
        if (score >= thresholds.S) return 'S';
        if (score >= thresholds.A) return 'A';
        if (score >= thresholds.B) return 'B';
        if (score >= thresholds.C) return 'C';
        return 'F';
    },

    exportHistory() {
        const config = this.getGameConfig();
        const data = {
            game: config ? config.name : '未知',
            score: this.calculateScore(),
            rank: this.getRank(this.calculateScore()),
            history: this.history,
            finalStats: this.stats,
            exportedAt: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `霜花塔楼_${this.currentGame}_${new Date().toLocaleDateString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
};
