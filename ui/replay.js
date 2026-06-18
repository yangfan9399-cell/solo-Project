var MeteorWorkshop = MeteorWorkshop || {};

(function(ns) {
    ns.ReplayUI = {
        onStepBack: null,
        onStepForward: null,
        onJumpTo: null,
        onReset: null,

        render: function() {
            this.renderControls();
            this.renderTimeline();
            this.renderStatus();
            this.bindEvents();
        },

        renderControls: function() {
            var container = document.getElementById('replay-controls');
            var historyLen = ns.StateManager.getHistoryLength();
            var curIdx = ns.StateManager.currentIndex;
            var canBack = curIdx > 0;
            var canForward = curIdx < historyLen - 1;
            var isLatest = ns.StateManager.isAtLatest();

            container.innerHTML =
                '<div class="replay-btn-row">' +
                    '<button class="rp-btn" id="rp-back" ' + (canBack ? '' : 'disabled') + '>◀ 上一步</button>' +
                    '<button class="rp-btn" id="rp-forward" ' + (canForward ? '' : 'disabled') + '>下一步 ▶</button>' +
                    '<button class="rp-btn rp-latest" id="rp-latest" ' + (isLatest ? 'disabled' : '') + '>跳到最新</button>' +
                    '<button class="rp-btn rp-reset" id="rp-reset">重置本局</button>' +
                '</div>';
        },

        renderTimeline: function() {
            var container = document.getElementById('replay-timeline');
            var historyLen = ns.StateManager.getHistoryLength();
            var curIdx = ns.StateManager.currentIndex;
            var sessionId = ns.StateManager.currentSessionId;

            var html = '<div class="timeline-scroll">';
            for (var i = 0; i < historyLen; i++) {
                var entry = ns.StateManager.getHistoryEntry(i);
                var isActive = i === curIdx;
                var isInitial = i === 0;
                var evName = isInitial ? '初始局面' : (entry.eventName || '未知事件');

                html += '<div class="tl-node' + (isActive ? ' active' : '') + '" data-step="' + i + '">' +
                    '<div class="tl-step-badge">' + i + '</div>' +
                    '<div class="tl-step-name">' + evName + '</div>' +
                    (isInitial ? '' : this.renderMiniDelta(entry)) +
                '</div>';
            }
            html += '</div>';
            container.innerHTML = html;

            setTimeout(function() {
                var active = container.querySelector('.tl-node.active');
                if (active && container.firstChild) {
                    container.firstChild.scrollLeft = active.offsetLeft - 20;
                }
            }, 0);
        },

        renderMiniDelta: function(entry) {
            if (!entry) return '';
            var parts = [];
            var effect = entry.effect || {};
            for (var k in effect) {
                if (effect.hasOwnProperty(k)) {
                    var color = ns.FieldColors[k] || '#ccc';
                    var v = effect[k];
                    parts.push('<span class="mini-delta" style="color:' + color + '">' + (v > 0 ? '+' : '') + v + '</span>');
                }
            }
            if (!parts.length) return '';
            return '<div class="tl-step-deltas">' + parts.join(' ') + '</div>';
        },

        renderStatus: function() {
            var container = document.getElementById('session-status');
            var sessionId = ns.StateManager.currentSessionId;
            var session = ns.Sessions[sessionId];
            var historyLen = ns.StateManager.getHistoryLength();
            var curIdx = ns.StateManager.currentIndex;
            var isLatest = ns.StateManager.isAtLatest();

            container.innerHTML =
                '<div class="status-row">' +
                    '<span class="status-label">进度:</span>' +
                    '<span class="status-val">' + curIdx + ' / ' + (historyLen - 1) + '</span>' +
                '</div>' +
                '<div class="status-row">' +
                    '<span class="status-label">状态:</span>' +
                    '<span class="status-val ' + (isLatest ? 'status-ok' : 'status-warn') + '">' +
                        (isLatest ? '已在最新，可继续操作' : '回放模式（操作会覆盖后续历史）') +
                    '</span>' +
                '</div>' +
                '<div class="status-row">' +
                    '<span class="status-label">存档:</span>' +
                    '<span class="status-val status-ok">localStorage 已保存 · 刷新可恢复</span>' +
                '</div>';
        },

        bindEvents: function() {
            var self = this;

            var backBtn = document.getElementById('rp-back');
            if (backBtn) backBtn.onclick = function() { if (self.onStepBack) self.onStepBack(); };

            var fwdBtn = document.getElementById('rp-forward');
            if (fwdBtn) fwdBtn.onclick = function() { if (self.onStepForward) self.onStepForward(); };

            var latestBtn = document.getElementById('rp-latest');
            if (latestBtn) latestBtn.onclick = function() {
                if (self.onJumpTo) self.onJumpTo(ns.StateManager.getHistoryLength() - 1);
            };

            var resetBtn = document.getElementById('rp-reset');
            if (resetBtn) resetBtn.onclick = function() {
                if (confirm('确定重置本局吗？当前历史将被清空。')) {
                    if (self.onReset) self.onReset();
                }
            };

            var nodes = document.querySelectorAll('.tl-node');
            nodes.forEach(function(node) {
                node.addEventListener('click', function() {
                    var step = parseInt(node.getAttribute('data-step'), 10);
                    if (self.onJumpTo) self.onJumpTo(step);
                });
            });
        }
    };
})(MeteorWorkshop);
