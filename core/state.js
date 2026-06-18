var MeteorWorkshop = MeteorWorkshop || {};

(function(ns) {
    var STORAGE_KEY = 'meteor_workshop_replay_v1';

    ns.StateManager = {
        currentSessionId: null,
        history: [],
        currentIndex: -1,

        init: function(sessionId) {
            this.currentSessionId = sessionId;
            var session = ns.Sessions[sessionId];
            this.history = [{
                step: 0,
                state: Object.assign({}, session.initialState),
                eventId: null,
                timestamp: Date.now()
            }];
            this.currentIndex = 0;
            this.persist();
        },

        loadFromStorage: function() {
            try {
                var raw = localStorage.getItem(STORAGE_KEY);
                if (!raw) return false;
                var data = JSON.parse(raw);
                if (!data || !data.sessionId || !data.history) return false;
                this.currentSessionId = data.sessionId;
                this.history = data.history;
                this.currentIndex = data.currentIndex >= 0 ? data.currentIndex : this.history.length - 1;
                return true;
            } catch (e) {
                console.warn('恢复存档失败:', e);
                return false;
            }
        },

        persist: function() {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify({
                    sessionId: this.currentSessionId,
                    history: this.history,
                    currentIndex: this.currentIndex
                }));
            } catch (e) {
                console.warn('保存存档失败:', e);
            }
        },

        getCurrentState: function() {
            if (this.currentIndex < 0 || !this.history[this.currentIndex]) return null;
            return this.history[this.currentIndex].state;
        },

        getCurrentStep: function() {
            if (this.currentIndex < 0) return 0;
            return this.history[this.currentIndex].step;
        },

        canApplyEvent: function(event) {
            var state = this.getCurrentState();
            if (!state || !event) return false;
            var cost = event.cost || {};
            for (var key in cost) {
                if (cost.hasOwnProperty(key)) {
                    if (state[key] === undefined) return false;
                    if (state[key] < cost[key]) return false;
                }
            }
            return true;
        },

        applyEvent: function(event) {
            if (!this.canApplyEvent(event)) return false;

            var prev = this.history[this.currentIndex].state;
            var newState = Object.assign({}, prev);
            var cost = event.cost || {};
            var effect = event.effect || {};

            for (var ck in cost) {
                if (cost.hasOwnProperty(ck)) {
                    newState[ck] = (newState[ck] || 0) - cost[ck];
                    if (newState[ck] < 0) newState[ck] = 0;
                }
            }
            for (var ek in effect) {
                if (effect.hasOwnProperty(ek)) {
                    newState[ek] = (newState[ek] || 0) + effect[ek];
                    if (newState[ek] < 0) newState[ek] = 0;
                }
            }

            this.history = this.history.slice(0, this.currentIndex + 1);
            this.history.push({
                step: this.history.length,
                state: newState,
                eventId: event.id,
                eventName: event.name,
                cost: Object.assign({}, cost),
                effect: Object.assign({}, effect),
                timestamp: Date.now()
            });
            this.currentIndex = this.history.length - 1;
            this.persist();
            return true;
        },

        jumpToStep: function(index) {
            if (index < 0 || index >= this.history.length) return false;
            this.currentIndex = index;
            this.persist();
            return true;
        },

        stepBack: function() {
            return this.jumpToStep(this.currentIndex - 1);
        },

        stepForward: function() {
            return this.jumpToStep(this.currentIndex + 1);
        },

        reset: function() {
            this.init(this.currentSessionId);
        },

        switchSession: function(sessionId) {
            this.init(sessionId);
        },

        getHistoryLength: function() {
            return this.history.length;
        },

        getHistoryEntry: function(index) {
            return this.history[index] || null;
        },

        isAtLatest: function() {
            return this.currentIndex === this.history.length - 1;
        },

        clearStorage: function() {
            try {
                localStorage.removeItem(STORAGE_KEY);
            } catch (e) {}
        }
    };
})(MeteorWorkshop);
