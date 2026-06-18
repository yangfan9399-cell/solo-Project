var MeteorWorkshop = MeteorWorkshop || {};

(function(ns) {
    ns.Engine = {
        checkGameStatus: function() {
            var sessionId = ns.StateManager.currentSessionId;
            var session = ns.Sessions[sessionId];
            var state = ns.StateManager.getCurrentState();
            var steps = ns.StateManager.getCurrentStep();

            if (!session || !state) return { status: 'unknown' };

            if (session.winCondition(state, steps)) {
                return { status: 'win', detail: '达成胜利条件' };
            }
            if (session.loseCondition(state, steps)) {
                return { status: 'lose', detail: '触发失败条件' };
            }
            return { status: 'playing' };
        },

        backendRecalculate: function() {
            var sessionId = ns.StateManager.currentSessionId;
            var session = ns.Sessions[sessionId];
            var history = ns.StateManager.history;

            var state = Object.assign({}, session.initialState);
            var recalcSteps = 0;
            var eventSequence = [];

            for (var i = 1; i < history.length; i++) {
                var entry = history[i];
                var cost = entry.cost || {};
                var effect = entry.effect || {};

                for (var ck in cost) {
                    if (cost.hasOwnProperty(ck)) {
                        state[ck] = (state[ck] || 0) - cost[ck];
                        if (state[ck] < 0) state[ck] = 0;
                    }
                }
                for (var ek in effect) {
                    if (effect.hasOwnProperty(ek)) {
                        state[ek] = (state[ek] || 0) + effect[ek];
                        if (state[ek] < 0) state[ek] = 0;
                    }
                }
                recalcSteps = i;
                eventSequence.push({
                    step: i,
                    eventId: entry.eventId,
                    eventName: entry.eventName
                });
            }

            var finalStatus = 'playing';
            if (session.winCondition(state, recalcSteps)) {
                finalStatus = 'win';
            } else if (session.loseCondition(state, recalcSteps)) {
                finalStatus = 'lose';
            }

            var efficiencyScore = this.calculateScore(state, recalcSteps, finalStatus, session);

            return {
                state: state,
                steps: recalcSteps,
                status: finalStatus,
                events: eventSequence,
                score: efficiencyScore,
                sessionId: sessionId,
                sessionName: session.name
            };
        },

        calculateScore: function(state, steps, status, session) {
            var base = state.unlockValue * 10;
            var traceBonus = state.traceMark * 5;
            var riskPenalty = state.renRisk * 3;
            var failurePenalty = state.maoFailure * 2;
            var stepPenalty = steps * 2;
            var rewardBonus = state.dingReward * 4;
            var slotBonus = state.unlockSlot * 3;
            var raw = base + traceBonus + rewardBonus + slotBonus - riskPenalty - failurePenalty - stepPenalty;
            if (status === 'win') raw = Math.floor(raw * 1.5);
            if (status === 'lose') raw = Math.floor(raw * 0.5);
            return Math.max(0, raw);
        },

        getAvailableEvents: function() {
            var sessionId = ns.StateManager.currentSessionId;
            var allEvents = ns.Events[sessionId] || [];
            var result = [];
            for (var i = 0; i < allEvents.length; i++) {
                var ev = allEvents[i];
                result.push({
                    event: ev,
                    available: ns.StateManager.canApplyEvent(ev)
                });
            }
            return result;
        }
    };
})(MeteorWorkshop);
