var MeteorWorkshop = MeteorWorkshop || {};

(function(ns) {
    ns.BoardUI = {
        render: function() {
            this.renderScene();
            this.renderFields();
            this.renderMap();
        },

        renderScene: function() {
            var container = document.getElementById('workshop-scene');
            var sessionId = ns.StateManager.currentSessionId;
            var session = ns.Sessions[sessionId];
            var state = ns.StateManager.getCurrentState();
            var status = ns.Engine.checkGameStatus();

            var statusText = '运营中';
            var statusClass = 'status-playing';
            if (status.status === 'win') { statusText = '胜利!'; statusClass = 'status-win'; }
            if (status.status === 'lose') { statusText = '失败'; statusClass = 'status-lose'; }

            container.innerHTML =
                '<div class="scene-header">' +
                    '<div class="scene-name">' + session.name + '</div>' +
                    '<div class="scene-status ' + statusClass + '">' + statusText + '</div>' +
                '</div>' +
                '<div class="scene-desc">' + session.description + '</div>' +
                '<div class="scene-hint">' + session.hint + '</div>' +
                '<div class="scene-step">当前步数: <span class="step-num">' + ns.StateManager.getCurrentStep() + '</span></div>';
        },

        renderFields: function() {
            var container = document.getElementById('field-display');
            var state = ns.StateManager.getCurrentState();
            if (!state) return;

            var fields = [
                { key: 'unlockValue', icon: '⛏' },
                { key: 'unlockSlot', icon: '⬚' },
                { key: 'traceMark', icon: '✦' },
                { key: 'renRisk', icon: '⚠' },
                { key: 'dingReward', icon: '❖' },
                { key: 'maoFailure', icon: '☣' }
            ];

            var html = '<div class="field-grid">';
            for (var i = 0; i < fields.length; i++) {
                var f = fields[i];
                var val = state[f.key] || 0;
                var color = ns.FieldColors[f.key];
                html +=
                    '<div class="field-card" style="border-left-color:' + color + '">' +
                        '<div class="field-icon" style="color:' + color + '">' + f.icon + '</div>' +
                        '<div class="field-info">' +
                            '<div class="field-label">' + ns.FieldLabels[f.key] + '</div>' +
                            '<div class="field-value" style="color:' + color + '">' + val + '</div>' +
                        '</div>' +
                    '</div>';
            }
            html += '</div>';
            container.innerHTML = html;
        },

        renderMap: function() {
            var container = document.getElementById('map-display');
            var sessionId = ns.StateManager.currentSessionId;
            var session = ns.Sessions[sessionId];
            var nodes = session.mapNodes || [];
            var currentStep = ns.StateManager.getCurrentStep();
            var activeNode = nodes[currentStep % nodes.length];

            var html = '<div class="map-title">' + session.mapName + '</div>';
            html += '<svg class="map-svg" viewBox="0 0 100 80" preserveAspectRatio="none">';

            for (var i = 0; i < nodes.length - 1; i++) {
                var a = nodes[i];
                var b = nodes[i + 1];
                html += '<line x1="' + a.pos.x + '" y1="' + a.pos.y + '" x2="' + b.pos.x + '" y2="' + b.pos.y + '"' +
                    ' stroke="#5a4a3a" stroke-width="0.5" stroke-dasharray="1,1"/>';
            }

            for (var j = 0; j < nodes.length; j++) {
                var n = nodes[j];
                var isActive = (n.id === activeNode.id);
                html += '<circle cx="' + n.pos.x + '" cy="' + n.pos.y + '" r="3"' +
                    ' fill="' + (isActive ? '#c9a84a' : '#3a3028') + '"' +
                    ' stroke="' + (isActive ? '#f0d070' : '#5a4a3a') + '"' +
                    ' stroke-width="0.5"/>';
                html += '<text x="' + n.pos.x + '" y="' + (n.pos.y + 6) + '" text-anchor="middle"' +
                    ' fill="' + (isActive ? '#f0d070' : '#8a7a6a') + '" font-size="3">' + n.name + '</text>';
            }
            html += '</svg>';

            html += '<div class="formula-box">' +
                '<div class="formula-title">胜负公式</div>' +
                '<div class="formula-win">胜: ' + session.winFormula + '</div>' +
                '<div class="formula-lose">负: ' + session.loseFormula + '</div>' +
            '</div>';

            container.innerHTML = html;
        }
    };
})(MeteorWorkshop);
