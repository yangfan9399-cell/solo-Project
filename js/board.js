const Board = {
    elements: {},
    mapContainer: null,

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
        this.mapContainer = document.getElementById('board-map');
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

        this.renderMap();
    },

    renderMap() {
        const config = GameState.getGameConfig();
        if (!config || !this.mapContainer) return;

        const mapType = config.mapType;
        const nodes = config.mapNodes || [];
        const currentTurn = GameState.history.length;

        let html = `<div class="map-layout map-${mapType}">`;

        if (mapType === 'tower') {
            html += '<div class="map-tower-container">';
            nodes.forEach(node => {
                const completed = node.turn <= currentTurn;
                const isCurrent = node.turn === currentTurn + 1 && !GameState.gameOver;
                html += `
                    <div class="map-node map-tower-node ${completed ? 'completed' : ''} ${isCurrent ? 'current' : ''}">
                        <div class="map-node-icon">${node.icon}</div>
                        <div class="map-node-label">${node.label}</div>
                        <div class="map-node-turn">第${node.turn}层</div>
                        ${completed ? '<div class="map-node-check">✓</div>' : ''}
                        ${isCurrent ? '<div class="map-node-pulse">●</div>' : ''}
                    </div>
                `;
            });
            html += '</div>';
        } else if (mapType === 'wasteland') {
            html += '<div class="map-wasteland-container">';
            nodes.forEach((node, index) => {
                const completed = node.turn <= currentTurn;
                const isCurrent = node.turn === currentTurn + 1 && !GameState.gameOver;
                html += `
                    <div class="map-node map-wasteland-node ${completed ? 'completed' : ''} ${isCurrent ? 'current' : ''}">
                        <div class="map-node-icon">${node.icon}</div>
                        <div class="map-node-label">${node.label}</div>
                        <div class="map-node-turn">站点${node.turn}</div>
                        ${completed ? '<div class="map-node-check">✓</div>' : ''}
                        ${isCurrent ? '<div class="map-node-pulse">●</div>' : ''}
                    </div>
                `;
                if (index < nodes.length - 1) {
                    html += '<div class="map-path-connector"></div>';
                }
            });
            html += '</div>';
        } else if (mapType === 'spiral') {
            html += '<div class="map-spiral-container">';
            const centerX = 50;
            const centerY = 50;
            nodes.forEach((node, index) => {
                const angle = (index / nodes.length) * Math.PI * 3 - Math.PI / 2;
                const radius = 15 + (index / nodes.length) * 30;
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                const completed = node.turn <= currentTurn;
                const isCurrent = node.turn === currentTurn + 1 && !GameState.gameOver;
                html += `
                    <div class="map-node map-spiral-node ${completed ? 'completed' : ''} ${isCurrent ? 'current' : ''}"
                         style="left: ${x}%; top: ${y}%;">
                        <div class="map-node-icon">${node.icon}</div>
                        <div class="map-node-label">${node.label}</div>
                        <div class="map-node-turn">${node.turn}</div>
                        ${completed ? '<div class="map-node-check">✓</div>' : ''}
                        ${isCurrent ? '<div class="map-node-pulse">●</div>' : ''}
                    </div>
                `;
            });
            html += '<div class="map-spiral-center">🌀</div>';
            html += '</div>';
        }

        html += '</div>';
        this.mapContainer.innerHTML = html;
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
