const Settlement = {
    container: null,

    init() {
        this.container = document.getElementById('settlement-content');
    },

    recalculateFromHistory() {
        const config = GameState.getGameConfig();
        if (!config) return null;

        const stats = { ...config.startStats };
        const choices = [];
        const history = GameState.history;

        for (let i = 0; i < history.length; i++) {
            const entry = history[i];
            if (entry.effects) {
                for (const [key, value] of Object.entries(entry.effects)) {
                    if (stats.hasOwnProperty(key)) {
                        stats[key] += value;
                        if (GameConfig.MAX_STATS[key]) {
                            stats[key] = Math.max(0, Math.min(stats[key], GameConfig.MAX_STATS[key]));
                        } else {
                            stats[key] = Math.max(0, stats[key]);
                        }
                    }
                }
            }
            if (entry.choice) {
                choices.push(entry.choice);
            }
        }

        const hiddenTriggered = config.hiddenCondition ? config.hiddenCondition(stats, choices) : false;
        const steps = history.length;

        return { stats, steps, hiddenTriggered, choices };
    },

    calculate() {
        const config = GameState.getGameConfig();
        if (!config) return null;

        const recalc = this.recalculateFromHistory();
        const recalcStats = recalc.stats;
        const steps = recalc.steps;
        const hiddenTriggered = recalc.hiddenTriggered;
        GameState.hiddenTriggered = hiddenTriggered;

        const score = config.victoryFormula(recalcStats, steps, hiddenTriggered);
        const rank = GameState.getRank(score);
        const isWin = config.winCondition(recalcStats);
        const isFail = config.failCondition(recalcStats);

        const storedStats = { ...GameState.stats };
        const verified = JSON.stringify(recalcStats) === JSON.stringify(storedStats);

        return {
            score,
            rank,
            isWin,
            isFail,
            hiddenTriggered,
            stats: recalcStats,
            storedStats,
            verified,
            steps,
            history: GameState.history,
            breakdown: this.getBreakdown(config, recalcStats, steps, hiddenTriggered, score)
        };
    },

    getBreakdown(config, stats, steps, hiddenTriggered, finalScore) {
        const breakdown = [];
        const gameId = GameState.currentGame;

        if (gameId === 'mao') {
            breakdown.push({ label: '基础分 (霜花塔楼试鸣值 × 10)', value: stats.shimingValue * 10, positive: true });
            breakdown.push({ label: '风险惩罚 (卯号风险 × 3)', value: -stats.maoRisk * 3, positive: false });
            breakdown.push({ label: '竞速步骤奖励 ((20-步数) × 5)', value: Math.max(0, (20 - steps) * 5), positive: true });
            breakdown.push({ label: '晶核奖励 (晶核 × 8)', value: stats.crystal * 8, positive: true });
        } else if (gameId === 'ren') {
            breakdown.push({ label: '基础分 (霜花塔楼试鸣值 × 12)', value: stats.shimingValue * 12, positive: true });
            breakdown.push({ label: '风险惩罚 (卯号风险 × 4)', value: -stats.maoRisk * 4, positive: false });
            breakdown.push({ label: '资源奖励 (能量+晶核×2+零件×3) × 10', value: (stats.energy + stats.crystal * 2 + stats.parts * 3) * 10, positive: true });
            breakdown.push({ label: '竞速步骤奖励 ((25-步数) × 4)', value: Math.max(0, (25 - steps) * 4), positive: true });
        } else if (gameId === 'shen') {
            breakdown.push({ label: '基础分 (霜花塔楼试鸣值 × 15)', value: stats.shimingValue * 15, positive: true });
            breakdown.push({ label: '风险惩罚 (卯号风险 × 3 + 申号失败因子 × 5)', value: -(stats.maoRisk * 3 + stats.shenFailure * 5), positive: false });
            breakdown.push({ label: '试鸣痕奖励 (霜花塔楼试鸣痕 × 25)', value: stats.shimingMark * 25, positive: true });
            breakdown.push({ label: '竞速步骤奖励 ((30-步数) × 6)', value: Math.max(0, (30 - steps) * 6), positive: true });
            if (hiddenTriggered) {
                breakdown.push({ label: '✨ 隐藏条件奖励', value: 500, positive: true });
            }
        }

        breakdown.push({ label: '最终得分', value: finalScore, positive: true, total: true });

        return breakdown;
    },

    render(result) {
        if (!result) {
            this.container.innerHTML = '<div class="settlement-empty">游戏结束后显示结算详情</div>';
            return;
        }

        let title, titleColor;
        if (result.isWin) {
            title = '🎉 经营成功！';
            titleColor = 'var(--success)';
        } else if (result.isFail) {
            title = '💔 经营失败';
            titleColor = 'var(--danger)';
        } else {
            title = '📊 回合结束';
            titleColor = 'var(--primary)';
        }

        let breakdownHtml = '';
        result.breakdown.forEach(item => {
            const valueClass = item.total ? '' : (item.positive ? 'positive' : 'negative');
            const totalClass = item.total ? 'breakdown-total' : '';
            breakdownHtml += `
                <div class="breakdown-item ${totalClass}">
                    <span class="breakdown-label">${item.label}</span>
                    <span class="breakdown-value ${valueClass}">${item.value >= 0 ? '+' : ''}${item.value}</span>
                </div>
            `;
        });

        const rankColors = { S: 'S', A: 'A', B: 'B', C: 'C', F: 'F' };

        let replayHtml = '<div class="settlement-replay"><div class="replay-title">后端回放验证</div>';
        replayHtml += `<div class="replay-item">初始状态加载 ✓</div>`;
        replayHtml += `<div class="replay-item">回放 ${result.steps} 个竞速经营步骤 ✓</div>`;
        replayHtml += `<div class="replay-item">重算霜花塔楼试鸣值: ${result.stats.shimingValue} ✓</div>`;
        replayHtml += `<div class="replay-item">重算卯号风险: ${result.stats.maoRisk} ✓</div>`;
        replayHtml += `<div class="replay-item">按试鸣值与步骤套用公式 ✓</div>`;
        replayHtml += `<div class="replay-item ${result.verified ? 'verified-ok' : 'verified-mismatch'}">数据校验: ${result.verified ? '回放值与存储值一致 ✓' : '存在偏差 ⚠️'}</div>`;
        replayHtml += '</div>';

        this.container.innerHTML = `
            <div class="settlement-result">
                <div class="settlement-rank ${rankColors[result.rank]}">${result.rank}</div>
                <div class="settlement-title-text" style="color: ${titleColor}">${title}</div>
                ${result.hiddenTriggered ? '<div style="color: var(--reward); margin-bottom: 12px;">✨ 隐藏结局已解锁！</div>' : ''}
                <div style="font-size: 14px; color: var(--text-light); margin-bottom: 8px;">
                    最终得分：<strong style="color: var(--primary); font-size: 20px;">${result.score}</strong>
                </div>
                <div style="font-size: 13px; color: var(--text-light);">
                    总步数：${result.steps} | 试鸣值：${result.stats.shimingValue} | 风险：${result.stats.maoRisk}
                </div>
                <div class="settlement-breakdown">
                    ${breakdownHtml}
                </div>
                ${replayHtml}
            </div>
        `;

        GameState.gameResult = result;
        GameState.save();
    },

    clear() {
        this.container.innerHTML = '<div class="settlement-empty">游戏结束后显示结算详情</div>';
    }
};
