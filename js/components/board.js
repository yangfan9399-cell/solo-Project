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
            this.container.innerHTML = '<div class="board-empty">请选择一局开始经营</div>';
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
            var valueClass = 'stat-value';
            var barClass = 'stat-bar-fill';
            var barWidth = this.calculateBarWidth(key, value);

            var thresholds = this.getThresholds(key);

            if (thresholds.danger && value >= thresholds.danger) {
                valueClass += ' danger';
                barClass += ' danger';
            } else if (thresholds.warning && value >= thresholds.warning) {
                valueClass += ' warning';
                barClass += ' warning';
            } else if (thresholds.success && value >= thresholds.success) {
                valueClass += ' success';
            }

            var displayValue = value;
            if (key === 'dingReward') {
                displayValue = (Math.round(value * 10) / 10).toFixed(1) + 'x';
            }

            html += '<div class="stat-item">';
            html += '<div class="stat-label">' + label + '</div>';
            html += '<div class="' + valueClass + '">' + displayValue + '</div>';
            html += '<div class="stat-bar"><div class="' + barClass + '" style="width: ' + barWidth + '%"></div></div>';
            html += '</div>';
        }

        return html;
    },

    getThresholds: function(key) {
        var thresholds = {
            danger: null,
            warning: null,
            success: null
        };

        var vicCond = this.levelConfig.victoryCondition;
        var failCond = this.levelConfig.failCondition;

        if (key === 'unlockValue') {
            if (vicCond && vicCond.type === 'unlockValue') {
                thresholds.success = vicCond.threshold * 0.8;
            } else if (this.levelConfig.id === 'mao') {
                thresholds.success = 64;
            } else {
                thresholds.success = 50;
            }
        }

        if (key === 'renRisk' && failCond && failCond.type === 'renRisk') {
            thresholds.warning = failCond.threshold * 0.6;
            thresholds.danger = failCond.threshold * 0.8;
        }

        if (key === 'maoFailFactor' && failCond && failCond.type === 'maoFailFactor') {
            thresholds.warning = failCond.threshold * 0.6;
            thresholds.danger = failCond.threshold * 0.8;
        }

        return thresholds;
    },

    calculateBarWidth: function(key, value) {
        var max = 100;
        
        var vicCond = this.levelConfig.victoryCondition;
        var failCond = this.levelConfig.failCondition;

        switch (key) {
            case 'unlockValue':
                if (vicCond && vicCond.type === 'unlockValue') {
                    max = vicCond.threshold * 1.2;
                } else if (this.levelConfig.id === 'mao') {
                    max = 100;
                }
                break;
            case 'unlockSlots':
                max = Math.max(10, this.levelConfig.initialState.unlockSlots * 2);
                break;
            case 'traceMarks':
                if (this.levelConfig.hiddenCondition) {
                    max = this.levelConfig.hiddenCondition.traceMarksRequired * 1.5;
                } else {
                    max = 15;
                }
                break;
            case 'renRisk':
                if (failCond && failCond.type === 'renRisk') {
                    max = failCond.threshold;
                } else {
                    max = 10;
                }
                break;
            case 'dingReward':
                max = 5;
                return Math.min(100, (value / max) * 100);
            case 'maoFailFactor':
                if (failCond && failCond.type === 'maoFailFactor') {
                    max = failCond.threshold;
                } else {
                    max = 10;
                }
                break;
        }
        
        var pct = (value / max) * 100;
        return Math.min(100, Math.max(0, pct));
    }
};
