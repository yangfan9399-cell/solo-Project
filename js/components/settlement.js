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
        this.container.innerHTML = '<div class="settlement-empty">游戏结束后结算簿将自动归档</div>';
    },

    showSettlement: function(state, steps, hiddenTriggered, backendResult) {
        if (!this.levelConfig || !this.levelConfig.settlementFormula) {
            return;
        }

        var result = backendResult || this.levelConfig.settlementFormula(state, hiddenTriggered);
        var isBackend = !!backendResult;

        var html = '<div class="settlement-content-inner">';
        html += '<div class="settlement-title">📊 本局结算' + (isBackend ? '（后端重算结果）' : '') + '</div>';

        if (isBackend && result.formula) {
            html += '<div style="font-size: 0.8rem; color: #666; text-align: center; margin-bottom: 12px;">结算公式：' + result.formula + '</div>';
        }
        
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
            html += '<div class="settlement-row"><span class="settlement-label">丁号奖励倍率</span><span class="settlement-value">×' + (typeof result.rewardMultiplier === 'number' ? result.rewardMultiplier.toFixed(1) : result.rewardMultiplier) + '</span></div>';
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

        if (!isBackend) {
            html += '<div style="margin-top: 16px; text-align: center;">';
            html += '<button id="btn-recalculate" class="btn btn-secondary" style="font-size: 0.85rem;">🔄 请求后端重算结算</button>';
            html += '</div>';
        } else {
            html += '<div style="margin-top: 16px; padding: 10px; background: #e8f5e9; border-radius: 6px; font-size: 0.85rem; color: #2e7d32; text-align: center;">';
            html += '✓ 已通过后端 /api/recalculate 接口重算完成';
            if (result.steps !== undefined) {
                html += '，共推演 ' + result.steps + ' 个步骤';
            }
            html += '</div>';
        }
        
        html += '</div>';
        
        this.container.innerHTML = html;
        if (!isBackend) {
            this.bindRecalculateButton();
        }
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

    recalculateFromBackend: function(levelId, history, hiddenTriggered, callback) {
        var btn = document.getElementById('btn-recalculate');
        if (btn) {
            btn.textContent = '⏳ 请求后端重算中...';
            btn.disabled = true;
        }

        var self = this;
        var payload = {
            levelId: levelId,
            history: history,
            hiddenTriggered: hiddenTriggered
        };

        fetch('/api/recalculate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(function(response) {
            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }
            return response.json();
        })
        .then(function(data) {
            if (data.status === 'success' && data.settlement) {
                if (callback) {
                    callback(data);
                }
            } else {
                throw new Error(data.error || '后端重算失败');
            }
        })
        .catch(function(error) {
            console.error('后端重算错误:', error);
            if (btn) {
                btn.textContent = '❌ 后端请求失败，点击重试';
                btn.disabled = false;
            }
            self.showErrorNotice('后端重算请求失败：' + error.message);
        });
    },

    showErrorNotice: function(message) {
        this.clearErrorNotice();
        var notice = document.createElement('div');
        notice.id = 'settlement-error-notice';
        notice.style.cssText = 'margin-top: 8px; padding: 6px 12px; background: #ffebee; color: #c62828; border-radius: 4px; font-size: 0.8rem; text-align: center;';
        notice.textContent = message;

        var settlementInner = this.container.querySelector('.settlement-content-inner');
        if (settlementInner) {
            var btn = settlementInner.querySelector('#btn-recalculate');
            if (btn && btn.parentNode) {
                btn.parentNode.appendChild(notice);
            }
        }
    },

    clearErrorNotice: function() {
        var old = document.getElementById('settlement-error-notice');
        if (old && old.parentNode) {
            old.parentNode.removeChild(old);
        }
    }
};
