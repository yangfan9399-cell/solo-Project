const Board = {
    elements: {},

    init() {
        this.elements = {
            shimingValue: document.getElementById('shiming-value'),
            shimingBar: document.getElementById('shiming-bar'),
            calibrationSlots: document.getElementById('calibration-slots'),
            calibrationSlotsDisplay: document.getElementById('calibration-slots-display'),
            shimingMark: document.getElementById('shiming-mark'),
            shimingMarksDisplay: document.getElementById('shiming-marks-display'),
            maoRisk: document.getElementById('mao-risk'),
            maoRiskBar: document.getElementById('mao-risk-bar'),
            renReward: document.getElementById('ren-reward'),
            renRewardBar: document.getElementById('ren-reward-bar'),
            shenFailure: document.getElementById('shen-failure'),
            shenFailureBar: document.getElementById('shen-failure-bar'),
            energy: document.getElementById('resource-energy'),
            crystal: document.getElementById('resource-crystal'),
            parts: document.getElementById('resource-parts')
        };
    },

    render() {
        const stats = GameState.stats;
        
        this.updateStat('shimingValue', stats.shimingValue, 100);
        this.updateStat('maoRisk', stats.maoRisk, 100);
        this.updateStat('renReward', stats.renReward, 100);
        this.updateStat('shenFailure', stats.shenFailure, 100);
        
        this.elements.calibrationSlots.textContent = stats.calibrationSlots;
        this.renderSlots(stats.calibrationSlots);
        
        this.elements.shimingMark.textContent = stats.shimingMark;
        this.renderMarks(stats.shimingMark);
        
        this.elements.energy.textContent = stats.energy;
        this.elements.crystal.textContent = stats.crystal;
        this.elements.parts.textContent = stats.parts;
    },

    updateStat(key, value, max) {
        const el = this.elements[key];
        const bar = this.elements[key + 'Bar'];
        if (el) {
            const oldValue = parseInt(el.textContent) || 0;
            el.textContent = value;
            if (value > oldValue) {
                el.classList.add('flash');
                setTimeout(() => el.classList.remove('flash'), 500);
            }
        }
        if (bar) {
            bar.style.width = Math.min(100, (value / max) * 100) + '%';
        }
    },

    renderSlots(count) {
        const container = this.elements.calibrationSlotsDisplay;
        container.innerHTML = '';
        const maxSlots = 8;
        for (let i = 0; i < maxSlots; i++) {
            const slot = document.createElement('div');
            slot.className = 'slot' + (i < count ? ' filled' : '');
            container.appendChild(slot);
        }
    },

    renderMarks(count) {
        const container = this.elements.shimingMarksDisplay;
        container.innerHTML = '';
        const maxMarks = 12;
        for (let i = 0; i < maxMarks; i++) {
            const mark = document.createElement('div');
            mark.className = 'mark' + (i < count ? ' active' : '');
            container.appendChild(mark);
        }
    },

    highlightStat(statName) {
        const card = document.querySelector(`[data-stat="${statName}"]`);
        if (card) {
            card.classList.add('flash');
            setTimeout(() => card.classList.remove('flash'), 500);
        }
    }
};
