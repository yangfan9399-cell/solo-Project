const EventUI = {
    listElement: null,
    countElement: null,

    init() {
        this.listElement = document.getElementById('eventList');
        this.countElement = document.getElementById('eventCount');
    },

    render(events) {
        if (!this.listElement || !this.countElement) return;

        this.countElement.textContent = events.length;

        if (events.length === 0) {
            this.listElement.innerHTML = '<div class="event-empty">尚无事件触发</div>';
            return;
        }

        this.listElement.innerHTML = '';

        events.slice().reverse().forEach((event, index) => {
            const eventItem = document.createElement('div');
            eventItem.className = `event-item ${event.type}`;
            eventItem.style.animationDelay = `${index * 0.05}s`;

            const typeMap = {
                'positive': '增益',
                'negative': '减益',
                'neutral': '中性',
                'special': '特殊'
            };

            let effectsHTML = '';
            if (event.effects) {
                const effectTexts = [];
                if (event.effects.balanceValue) {
                    effectTexts.push(`配平 ${event.effects.balanceValue > 0 ? '+' : ''}${event.effects.balanceValue}`);
                }
                if (event.effects.infectionTank) {
                    effectTexts.push(`熏染 ${event.effects.infectionTank > 0 ? '+' : ''}${event.effects.infectionTank}`);
                }
                if (event.effects.mergeMark) {
                    effectTexts.push(`归并 +${event.effects.mergeMark}`);
                }
                if (event.effects.ziRisk) {
                    effectTexts.push(`风险 +${event.effects.ziRisk}`);
                }
                if (event.effects.maoReward) {
                    effectTexts.push(`奖励 +${event.effects.maoReward}`);
                }
                if (event.effects.chouFailFactor) {
                    effectTexts.push(`失败因子 +${event.effects.chouFailFactor}`);
                }
                effectsHTML = `<div class="event-effect">${effectTexts.join(' · ')}</div>`;
            }

            eventItem.innerHTML = `
                <div class="event-title">
                    <span class="event-type-badge">[${typeMap[event.type] || '事件'}]</span>
                    ${event.nodeName || ''} · ${event.title}
                </div>
                <div class="event-desc">${event.description}</div>
                ${effectsHTML}
            `;

            this.listElement.appendChild(eventItem);
        });
    },

    addEvent(event) {
    }
};
