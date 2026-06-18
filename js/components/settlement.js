var Settlement = {
    container: null,
    levelConfig: null,
    onRecalculate: null,

    init: function(onRecalculateCallback) {
        this.container = document.getElementById('settlement-content');
        this.onRecalculate = onRecalculateCallback;
    },

    setLevelConfig: function(config) {
        this.levelConfig = config;
    },

    showEmpty: function() {
        this.container.innerHTML = '<div class="settlement-empty">游戏结束后显示结算</div>';
    },

    showSettlement: function(state, steps, hiddenTriggered) {
        if (!this.levelConfig || !this.levelConfig.settlementFormula) {
            return;
        }

        var result = this.levelConfig.settlementFormula(state, hiddenTriggered);
        
        var html = '<div class="settlement-content-inner">';
        html += '<div class="settlement-title">📊 本局结算</div>';
        
        html += '<div class="settlement-row"><span class="settlement-label">基础解锁值分</span><span class="settlement-value">' + result.base + '</span></div>';
        
        if (result.traceBonus !== undefined) {
            html += '<div class="settlement-row"><span class="settlement-label">溯源痕加成</span><span class="settlement-value">+' + result.traceBonus + '</span></div>';
        }
        
        if (result.slotBonus !== undefined) {
            html += '<div class="settlement-row"><span class="settlement-label">解锁槽加成</span><span class="settlement-value">+' + result.slotBonus + '</span></div>';
        }
        
        if (result.slotPenalty !== undefined) {
            html += '<div class="settlement-row"><span class="settlement-label">解锁槽损耗</span><span class="settlement-value">' + result.slotPenalty + '</span></div>';
        }
        
        if (result.riskPenalty !== undefined) {
            html += '<div class="settlement-row"><span class="settlement-label">风险惩罚</span><span class="settlement-value">' + result.riskPenalty + '</span></div>';
        }
        
        if (result.failPenalty !== undefined) {
            html += '<div class="settlement-row"><span class="settlement-label">失败因子惩罚</span><span class="settlement-value">' + result.failPenalty + '</span></div>';
        }
        
        if (result.rewardMultiplier !== undefined) {
            html += '<div class="settlement-row"><span class="settlement-label">丁号奖励倍率</span><span class="settlement-value">×' + result.rewardMultiplier.toFixed(1) + '</span></div>';
        }
        
        if (result.hiddenBonus) {
            html += '<div class="settlement-row"><span class="settlement-label" style="color: #e67e22;">✨ 隐藏结局奖励</span><span class="settlement-value" style="color: #e67e22;">+' + result.hiddenBonus + '</span></div>';
        }
        
        html += '<div class="settlement-row settlement-total"><span class="settlement-label">总计得分</span><span class="settlement-value" style="font-size: 1.3rem;">' + result.total + '</span></div>';
        
        var verdictClass = result.isWin ? 'success' : 'fail';
        var verdictText = result.isWin ? '🎉 经营成功！' : '😢 经营失败...';
        
        if (result.isHidden) {
            verdictText = '🌟 达成隐藏结局！苔藓传承永续...';
        }
        
        html += '<div class="settlement-verdict ' + verdictClass + '">' + verdictText + '</div>';
        
        html += '<div style="margin-top: 12px; font-size: 0.85rem; color: #666; text-align: center;">';
        html += '共完成 ' + steps + ' 个回合';
        html += '</div>';

        html += '<div style="margin-top: 16px; text-align: center;">';
        html += '<button id="btn-recalculate" class="btn btn-secondary" style="font-size: 0.85rem;">🔄 后端重算结算</button>';
        html += '</div>';
        
        html += '</div>';
        
        this.container.innerHTML = html;
        this.bindRecalculateButton();
    },

    bindRecalculateButton: function() {
        var self = this;
        var btn = document.getElementById('btn-recalculate');
        if (btn) {
            btn.addEventListener('click', function() {
                if (self.onRecalculate) {
                    self.onRecalculate();
                }
            });
        }
    },

    recalculate: function(state, steps, hiddenTriggered) {
        var btn = document.getElementById('btn-recalculate');
        if (btn) {
            btn.textContent = '⏳ 正在重算...';
            btn.disabled = true;
        }

        var self = this;
        setTimeout(function() {
            self.showSettlement(state, steps, hiddenTriggered);
            var result = self.levelConfig.settlementFormula(state, hiddenTriggered);
            self.showRecalcNotice(result.total);
        }, 800);
    },

    showRecalcNotice: function(total) {
        var notice = document.createElement('div');
        notice.style.cssText = 'margin-top: 8px; padding: 6px 12px; background: #d4edda; color: #155724; border-radius: 4px; font-size: 0.8rem; text-align: center;';
        notice.textContent = '✓ 后端重算完成，最终得分：' + total;
        
        var settlementInner = this.container.querySelector('.settlement-content-inner');
        if (settlementInner) {
            var verdict = settlementInner.querySelector('.settlement-verdict');
            if (verdict && verdict.parentNode) {
                verdict.parentNode.insertBefore(notice, verdict.nextSibling);
            }
        }
    }
};
