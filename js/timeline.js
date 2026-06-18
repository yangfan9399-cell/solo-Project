const Timeline = {
    container: null,
    entries: [],

    init() {
        this.container = document.getElementById('timeline-container');
        
        document.getElementById('btn-export').addEventListener('click', () => {
            if (GameState.history.length > 0) {
                GameState.exportHistory();
            } else {
                UI.showModal('提示', '暂无记录可导出');
            }
        });

        document.getElementById('btn-clear').addEventListener('click', () => {
            if (GameState.history.length > 0) {
                UI.showModal('确认清空', '确定要清空所有回放记录吗？这将重置当前游戏进度。', () => {
                    GameState.clear();
                    this.clear();
                    Events.clear();
                    Settlement.clear();
                    Board.render();
                    UI.updateHeader();
                    UI.updateStatus('记录已清空，选择一局开始新游戏');
                    document.getElementById('btn-start').style.display = '';
                    document.getElementById('btn-restart').style.display = 'none';
                });
            }
        });
    },

    addEntry(entry) {
        this.entries.push(entry);
        this.render();
    },

    render() {
        if (this.entries.length === 0) {
            this.container.innerHTML = '<div class="timeline-empty">暂无操作记录</div>';
            return;
        }

        let html = '';
        this.entries.slice().reverse().forEach(entry => {
            const time = new Date(entry.timestamp || Date.now());
            const timeStr = time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            
            let effectsText = '';
            if (entry.effects) {
                const effectParts = [];
                for (const [key, value] of Object.entries(entry.effects)) {
                    if (value !== 0) {
                        const label = this.getEffectLabel(key);
                        const sign = value > 0 ? '+' : '';
                        effectParts.push(`${label} ${sign}${value}`);
                    }
                }
                effectsText = effectParts.join(' | ');
            }

            const hiddenClass = entry.hidden ? ' hidden-event' : '';

            html += `
                <div class="timeline-item${hiddenClass}">
                    <div class="timeline-step">步骤 ${entry.step}</div>
                    <div class="timeline-content">
                        <div><strong>${entry.event}</strong></div>
                        <div style="margin-top: 4px;">${entry.choice}</div>
                        ${effectsText ? `<div style="margin-top: 4px; color: var(--text-light); font-size: 11px;">${effectsText}</div>` : ''}
                        ${entry.hidden ? `<div style="margin-top: 4px; color: var(--reward); font-size: 11px;">✨ 隐藏事件</div>` : ''}
                    </div>
                    <div class="timeline-time">${timeStr}</div>
                </div>
            `;
        });

        this.container.innerHTML = html;
    },

    getEffectLabel(key) {
        const labels = {
            shimingValue: '试鸣值',
            calibrationSlots: '校准槽',
            shimingMark: '试鸣痕',
            maoRisk: '卯号风险',
            renReward: '壬号奖励',
            shenFailure: '申号失败',
            energy: '能量',
            crystal: '晶核',
            parts: '零件'
        };
        return labels[key] || key;
    },

    loadFromHistory() {
        this.entries = GameState.history.map((h, i) => ({
            step: i + 1,
            event: h.event,
            choice: h.choice,
            effects: h.effects,
            hidden: h.hidden,
            timestamp: h.timestamp
        }));
        this.render();
    },

    clear() {
        this.entries = [];
        this.container.innerHTML = '<div class="timeline-empty">暂无操作记录</div>';
    }
};
