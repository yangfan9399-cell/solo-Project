const ReplayUI = {
    timelineElement: null,
    onStepClick: null,
    currentStep: -1,

    init(onStepClick) {
        this.timelineElement = document.getElementById('replayTimeline');
        this.onStepClick = onStepClick;
        this.currentStep = -1;
    },

    render(steps, currentStepIndex) {
        if (!this.timelineElement) return;

        this.currentStep = currentStepIndex;

        if (steps.length === 0) {
            this.timelineElement.innerHTML = '<div class="timeline-empty">暂无记录</div>';
            return;
        }

        this.timelineElement.innerHTML = '';

        const startItem = document.createElement('div');
        startItem.className = `timeline-item ${currentStepIndex === -1 ? 'current' : ''}`;
        startItem.innerHTML = `
            <span class="timeline-step">起始</span>
            <div class="timeline-content">
                <div class="timeline-node">起点</div>
                <div class="timeline-stats">游戏开始</div>
            </div>
        `;
        startItem.addEventListener('click', () => {
            if (this.onStepClick) {
                this.onStepClick(-1);
            }
        });
        this.timelineElement.appendChild(startItem);

        steps.forEach((step, index) => {
            const stepItem = document.createElement('div');
            stepItem.className = `timeline-item ${index === currentStepIndex ? 'current' : ''}`;

            const state = step.stateAfter;
            const eventInfo = step.events.length > 0 ? step.events[0].title : '无事件';

            stepItem.innerHTML = `
                <span class="timeline-step">第${index + 1}步</span>
                <div class="timeline-content">
                    <div class="timeline-node">→ ${this.getNodeName(step.toNode)}</div>
                    <div class="timeline-stats">
                        配平: ${state.balanceValue} | 事件: ${eventInfo}
                    </div>
                </div>
            `;

            stepItem.addEventListener('click', () => {
                if (this.onStepClick) {
                    this.onStepClick(index);
                }
            });

            this.timelineElement.appendChild(stepItem);
        });
    },

    getNodeName(nodeId) {
        if (!GameEngine.level) return nodeId;
        const node = GameEngine.level.nodes.find(n => n.id === nodeId);
        return node ? node.name : nodeId;
    }
};
