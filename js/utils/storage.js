const Storage = {
    KEY_PREFIX: 'yinyan_darkroom_',

    save(key, value) {
        try {
            localStorage.setItem(this.KEY_PREFIX + key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage save error:', e);
            return false;
        }
    },

    load(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(this.KEY_PREFIX + key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error('Storage load error:', e);
            return defaultValue;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(this.KEY_PREFIX + key);
            return true;
        } catch (e) {
            console.error('Storage remove error:', e);
            return false;
        }
    },

    clearAll() {
        try {
            Object.keys(localStorage)
                .filter(key => key.startsWith(this.KEY_PREFIX))
                .forEach(key => localStorage.removeItem(key));
            return true;
        } catch (e) {
            console.error('Storage clear error:', e);
            return false;
        }
    },

    saveGameState(state) {
        return this.save('game_state', state);
    },

    loadGameState() {
        return this.load('game_state');
    },

    saveReplay(levelId, replay) {
        const replays = this.load('replays_' + levelId, []);
        replays.push({
            timestamp: Date.now(),
            ...replay
        });
        return this.save('replays_' + levelId, replays);
    },

    loadReplays(levelId) {
        return this.load('replays_' + levelId, []);
    },

    saveBestScore(levelId, score) {
        const best = this.load('best_' + levelId, 0);
        if (score > best) {
            this.save('best_' + levelId, score);
            return true;
        }
        return false;
    },

    loadBestScore(levelId) {
        return this.load('best_' + levelId, 0);
    }
};
