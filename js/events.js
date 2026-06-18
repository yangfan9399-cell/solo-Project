const Events = {
    container: null,
    currentEvent: null,

    init() {
        this.container = document.getElementById('events-container');
    },

    getEventForTurn(turn) {
        const config = GameState.getGameConfig();
        if (!config) return null;
        return config.events.find(e => e.turn === turn);
    },

    render(event) {
        if (!event) {
            this.container.innerHTML = '<div class="events-empty">等待事件触发...</div>';
            return;
        }

        this.currentEvent = event;
        
        let typeClass = '';
        switch (event.type) {
            case 'warning': typeClass = 'warning'; break;
            case 'danger': typeClass = 'danger'; break;
            case 'success': typeClass = 'success'; break;
            default: typeClass = '';
        }

        const card = document.createElement('div');
        card.className = `event-card ${typeClass}`;
        
        let choicesHtml = '';
        event.choices.forEach((choice, index) => {
            const canAfford = GameState.canAfford(choice.cost);
            const isPrimary = index === 0;
            choicesHtml += `
                <div style="flex: 1; min-width: 120px;">
                    <button class="choice-btn ${isPrimary ? 'primary' : ''}" 
                            data-choice="${index}" 
                            ${!canAfford ? 'disabled' : ''}>
                        ${choice.text}
                    </button>
                    ${choice.teaching ? `<div class="choice-effect">💡 ${choice.teaching}</div>` : ''}
                </div>
            `;
        });

        card.innerHTML = `
            <div class="event-title">${event.title}</div>
            <div class="event-desc">${event.description}</div>
            <div class="event-choices">
                ${choicesHtml}
            </div>
        `;

        this.container.innerHTML = '';
        this.container.appendChild(card);

        card.querySelectorAll('.choice-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const choiceIndex = parseInt(e.target.dataset.choice);
                this.handleChoice(event, choiceIndex);
            });
        });
    },

    handleChoice(event, choiceIndex) {
        const choice = event.choices[choiceIndex];
        if (!choice) return;

        if (!GameState.canAfford(choice.cost)) {
            UI.showModal('资源不足', '你没有足够的资源来执行这个选择！');
            return;
        }

        let effects = { ...(choice.effect || {}) };
        
        if (choice.special) {
            effects = this.handleSpecialEffect(choice.special, effects);
        }

        GameState.updateStats(effects);
        GameState.addChoice(choice.text);
        GameState.addHistory({
            event: event.title,
            eventId: event.id,
            choice: choice.text,
            effects: effects,
            hidden: choice.hidden || false
        });

        Timeline.addEntry({
            step: GameState.history.length,
            event: event.title,
            choice: choice.text,
            effects: effects,
            hidden: choice.hidden || false
        });

        GameState.save();
        Board.render();
        
        setTimeout(() => {
            Game.checkGameState();
        }, 300);
    },

    renderEnd() {
        this.container.innerHTML = `
            <div class="event-card success" style="text-align: center; padding: 30px 16px;">
                <div style="font-size: 32px; margin-bottom: 12px;">🏁</div>
                <div class="event-title" style="font-size: 16px;">本局已结束</div>
                <div class="event-desc">查看结算簿获取详细成绩</div>
            </div>
        `;
        this.currentEvent = null;
    },

    handleSpecialEffect(specialType, baseEffects) {
        const stats = GameState.stats;
        const effects = { ...baseEffects };

        switch (specialType) {
            case 'all_in':
                const totalResources = stats.energy + stats.crystal + stats.parts;
                effects.energy = -stats.energy;
                effects.crystal = -stats.crystal;
                effects.parts = -stats.parts;
                effects.shimingValue = (effects.shimingValue || 0) + totalResources * 3;
                break;

            case 'activate_core':
                effects.energy = -10;
                effects.crystal = -stats.crystal;
                effects.shimingMark = (effects.shimingMark || 0) + 10;
                effects.shimingValue = (effects.shimingValue || 0) + 50;
                break;

            case 'final_sprint':
                const energyValue = stats.energy;
                effects.energy = -stats.energy;
                effects.shimingValue = (effects.shimingValue || 0) + energyValue * 4;
                break;
        }

        return effects;
    },

    clear() {
        this.container.innerHTML = '<div class="events-empty">等待事件触发...</div>';
        this.currentEvent = null;
    }
};
