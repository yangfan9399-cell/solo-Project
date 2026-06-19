const ResultUI = {
    contentElement: null,
    settleBtn: null,

    init() {
        this.contentElement = document.getElementById('resultContent');
        this.settleBtn = document.getElementById('settleBtn');
    },

    render(details) {
        if (!this.contentElement) return;

        if (!details) {
            this.contentElement.innerHTML = '<div class="result-empty">完成航线后进行结算</div>';
            return;
        }

        let resultClass = '';
        let resultTitle = '';

        if (details.won === true) {
            resultClass = 'success';
            resultTitle = '推演成功';
        } else if (details.won === 'partial') {
            resultClass = 'success';
            resultTitle = '航线达成';
        } else {
            resultClass = 'failure';
            resultTitle = '推演失败';
        }

        const d = details.details;

        this.contentElement.innerHTML = `
            <div class="result-item">
                <span class="result-label">最终配平值</span>
                <span class="result-value">${details.finalState.balanceValue}</span>
            </div>
            <div class="result-item">
                <span class="result-label">熏染槽</span>
                <span class="result-value">${details.finalState.infectionTank}</span>
            </div>
            <div class="result-item">
                <span class="result-label">归并痕</span>
                <span class="result-value">${details.finalState.mergeMark}</span>
            </div>
            <div class="result-item">
                <span class="result-label">子号风险</span>
                <span class="result-value">${details.finalState.ziRisk}</span>
            </div>
            <div class="result-item">
                <span class="result-label">卯号奖励</span>
                <span class="result-value">${details.finalState.maoReward}</span>
            </div>
            <div class="result-item">
                <span class="result-label">丑号失败因子</span>
                <span class="result-value">${details.finalState.chouFailFactor}</span>
            </div>
            <div class="result-item">
                <span class="result-label">总步数</span>
                <span class="result-value">${details.steps}</span>
            </div>
            <div class="result-item">
                <span class="result-label">触发事件</span>
                <span class="result-value">${details.eventsTriggered}</span>
            </div>
            
            <div class="result-detail-section" style="margin-top: 15px; padding-top: 10px; border-top: 1px dashed #404050;">
                <div class="result-item">
                    <span class="result-label" style="color: #606070;">基础分 (配平×10)</span>
                    <span class="result-value" style="color: #9090a0;">${d.baseScore}</span>
                </div>
                <div class="result-item">
                    <span class="result-label" style="color: #606070;">奖励加成 (卯号×25)</span>
                    <span class="result-value" style="color: #4a8c5c;">+${d.maoBonus}</span>
                </div>
                <div class="result-item">
                    <span class="result-label" style="color: #606070;">归并加成 (归并×15)</span>
                    <span class="result-value" style="color: #4a8c5c;">+${d.mergeBonus}</span>
                </div>
                <div class="result-item">
                    <span class="result-label" style="color: #606070;">风险惩罚 (风险×10)</span>
                    <span class="result-value" style="color: #c44536;">${d.riskPenalty}</span>
                </div>
                <div class="result-item">
                    <span class="result-label" style="color: #606070;">失败惩罚 (失败×20)</span>
                    <span class="result-value" style="color: #c44536;">${d.failPenalty}</span>
                </div>
                <div class="result-item">
                    <span class="result-label" style="color: #606070;">步数惩罚</span>
                    <span class="result-value" style="color: #c44536;">${d.stepPenalty}</span>
                </div>
            </div>

            <div class="result-final ${resultClass}">
                <div class="result-title">${resultTitle}</div>
                <div class="result-score">${details.score} 分</div>
            </div>
        `;
    },

    showEmpty() {
        if (this.contentElement) {
            this.contentElement.innerHTML = '<div class="result-empty">完成航线后进行结算</div>';
        }
    },

    setSettleEnabled(enabled) {
        if (this.settleBtn) {
            this.settleBtn.disabled = !enabled;
            this.settleBtn.style.opacity = enabled ? '1' : '0.5';
            this.settleBtn.style.cursor = enabled ? 'pointer' : 'not-allowed';
        }
    }
};
