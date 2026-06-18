var Board = {
    container: null,
    levelConfig: null,

    init: function() {
        this.container = document.getElementById('board-content');
    },

    setLevelConfig: function(config) {
        this.levelConfig = config;
    },

    render: function(state, turn) {
        if (!this.levelConfig) {
            this.container.innerHTML = '<div class="board-empty">请选择一局开始游戏</div>';
            return;
        }

        var stats = this.buildStats(state);
        var intro = '';
        
        if (turn === 0) {
            intro = '<div class="intro-text">' + this.levelConfig.introText + '</div>';
        }

        var levelInfo = '<div class="stats-grid">' + stats + '</div>';
        
        var conditionInfo = '<div style="margin-top: 16px; padding-top: 12px; border-top: 1px dashed #ccc; font-size: 0.85rem; color: #666;">';
        conditionInfo += '<div><strong>胜利条件：</strong>' + this.levelConfig.victoryCondition.description + '</div>';
        conditionInfo += '<div><strong>失败条件：</strong>' + this.levelConfig.failCondition.description + '</div>';
        
        if (this.levelConfig.hiddenCondition) {
            conditionInfo += '<div class="hidden-condition-hint">提示：本局存在隐藏条件，留意溯源痕可能是关键...</div>';
        }
        
        conditionInfo += '</div>';

        this.container.innerHTML = intro + levelInfo + conditionInfo;
    },

    buildStats: function(state) {
        var html = '';
        
        var statsToShow = ['unlockValue', 'unlockSlots', 'traceMarks'];
        
        if (this.levelConfig.id === 'ren') {
            statsToShow.push('renRisk');
        } else if (this.levelConfig.id === 'ding') {
            statsToShow.push('dingReward');
        } else if (this.levelConfig.id === 'mao') {
            statsToShow.push('maoFailFactor');
        }

        for (var i = 0; i < statsToShow.length; i++) {
            var key = statsToShow[i];
            var value = state[key];
            var label = GameConfig.getStatLabel(key);
            var className = 'stat-item';
            var valueClass = 'stat-value';
            var barClass = 'stat-bar-fill';
            var barWidth = this.calculateBarWidth(key, value);

            if (key === 'renRisk' && value >= 7) {
                valueClass += ' danger';
                barClass += ' danger';
            } else if (key === 'maoFailFactor' && value >= 6) {
                valueClass += ' warning';
                barClass += ' warning';
            } else if (key === 'unlockValue' && value >= 50) {
                valueClass += ' success';
            }

            var displayValue = value;
            if (key === 'dingReward') {
                displayValue = value.toFixed(1) + 'x';
            }

            html += '<div class="' + className + '">';
            html += '<div class="stat-label">' + label + '</div>';
            html += '<div class="' + valueClass + '">' + displayValue + '</div>';
            html += '<div class="stat-bar"><div class="' + barClass + '" style="width: ' + barWidth + '%"></div></div>';
            html += '</div>';
        }

        return html;
    },

    calculateBarWidth: function(key, value) {
        var max = 100;
        
        switch (key) {
            case 'unlockValue':
                max = 100;
                break;
            case 'unlockSlots':
                max = 10;
                break;
            case 'traceMarks':
                max = 15;
                break;
            case 'renRisk':
                max = 10;
                break;
            case 'dingReward':
                max = 5;
                value = value * 20;
                return Math.min(100, value);
            case 'maoFailFactor':
                max = 10;
                break;
        }
        
        var pct = (value / max) * 100;
        return Math.min(100, Math.max(0, pct));
    }
};
