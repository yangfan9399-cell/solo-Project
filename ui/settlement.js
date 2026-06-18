var MeteorWorkshop = MeteorWorkshop || {};

(function(ns) {
    var API_BASE = 'http://localhost:3009';

    ns.SettlementUI = {
        onRecalculate: null,
        lastResult: null,

        render: function() {
            this.callBackendRecalculate();
        },

        callBackendRecalculate: function() {
            var self = this;
            var sessionId = ns.StateManager.currentSessionId;
            var history = ns.StateManager.history;

            var payload = JSON.stringify({
                sessionId: sessionId,
                history: history
            });

            var container = document.getElementById('settlement-content');
            container.innerHTML = '<div class="settle-loading">正在向后端请求结算重算...</div>';

            var xhr = new XMLHttpRequest();
            xhr.open('POST', API_BASE + '/api/recalculate', true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.timeout = 5000;

            xhr.onload = function() {
                if (xhr.status === 200) {
                    try {
                        var result = JSON.parse(xhr.responseText);
                        result._source = 'backend';
                        self.lastResult = result;
                        self.renderWithResult(result);
                        self.bindEvents();
                    } catch (e) {
                        self.fallbackToLocal('后端返回数据解析失败: ' + e.message);
                    }
                } else {
                    self.fallbackToLocal('后端返回错误状态: ' + xhr.status);
                }
            };

            xhr.onerror = function() {
                self.fallbackToLocal('无法连接后端服务，请确认 server.js 已启动 (node server.js)');
            };

            xhr.ontimeout = function() {
                self.fallbackToLocal('后端请求超时');
            };

            xhr.send(payload);
        },

        fallbackToLocal: function(reason) {
            var result = ns.Engine.backendRecalculate();
            result._source = 'local_fallback';
            result._fallbackReason = reason;
            this.lastResult = result;
            this.renderWithResult(result);
            this.bindEvents();
        },

        renderWithResult: function(result) {
            var container = document.getElementById('settlement-content');
            var state = result.state;
            var statusText = result.status === 'win' ? '✦ 胜 利 ✦' : (result.status === 'lose' ? '☠ 失 败 ☠' : '运 营 中');
            var statusClass = 'settle-' + result.status;

            var sourceLabel = result._source === 'backend' ? '后端服务' : '本地回退';
            var sourceClass = result._source === 'backend' ? 'source-backend' : 'source-local';
            var tsLabel = result.serverTimestamp ? new Date(result.serverTimestamp).toLocaleString('zh-CN') : new Date().toLocaleString('zh-CN');

            var html = '<div class="settle-header ' + statusClass + '">' +
                '<div class="settle-title">结算簿 · ' + result.sessionName + '</div>' +
                '<div class="settle-status">' + statusText + '</div>' +
            '</div>';

            html += '<div class="settle-source-bar ' + sourceClass + '">' +
                '<span class="source-label">数据来源: ' + sourceLabel + '</span>' +
                '<span class="source-ts">' + tsLabel + '</span>' +
            '</div>';

            if (result._fallbackReason) {
                html += '<div class="settle-fallback-warn">⚠ ' + result._fallbackReason + '</div>';
            }

            html += '<div class="settle-section">' +
                '<div class="settle-section-title">◢ 最终局面字段 ◣</div>' +
                '<div class="settle-fields">' +
                    this.renderFinalField('unlockValue', state.unlockValue) +
                    this.renderFinalField('unlockSlot', state.unlockSlot) +
                    this.renderFinalField('traceMark', state.traceMark) +
                    this.renderFinalField('renRisk', state.renRisk) +
                    this.renderFinalField('dingReward', state.dingReward) +
                    this.renderFinalField('maoFailure', state.maoFailure) +
                '</div>' +
            '</div>';

            html += '<div class="settle-section">' +
                '<div class="settle-section-title">◢ 竞速经营统计 ◣</div>' +
                '<div class="settle-stats">' +
                    '<div class="stat-row"><span class="stat-label">总步数</span><span class="stat-val">' + result.steps + '</span></div>' +
                    '<div class="stat-row"><span class="stat-label">触发事件数</span><span class="stat-val">' + result.events.length + '</span></div>' +
                    '<div class="stat-row"><span class="stat-label">综合评分</span><span class="stat-val stat-score">' + result.score + '</span></div>' +
                '</div>' +
            '</div>';

            html += '<div class="settle-section">' +
                '<div class="settle-section-title">◢ 事件执行序列 ◣</div>' +
                '<div class="settle-events">';
            if (result.events.length === 0) {
                html += '<div class="settle-empty">尚未执行任何事件。</div>';
            } else {
                for (var i = 0; i < result.events.length; i++) {
                    var ev = result.events[i];
                    html += '<div class="settle-ev-row">' +
                        '<span class="settle-ev-step">#' + ev.step + '</span>' +
                        '<span class="settle-ev-name">' + ev.eventName + '</span>' +
                    '</div>';
                }
            }
            html += '</div></div>';

            html += '<div class="settle-section settle-note">' +
                '<div class="settle-section-title">◢ 后端重算说明 ◣</div>' +
                '<div class="settle-note-text">' +
                    '结算由后端服务按"陨铁工坊解锁值"、各局面字段与"竞速经营步骤数"独立重算。' +
                    '后端从初始局面开始，依据完整事件序列逐步重放，计算最终状态与评分，确保结果不被前端篡改。' +
                    '点击下方按钮可向后端服务请求重新校验。' +
                '</div>' +
            '</div>';

            container.innerHTML = html;
        },

        renderFinalField: function(key, val) {
            var color = ns.FieldColors[key] || '#ccc';
            return '<div class="final-field">' +
                '<div class="ff-label">' + ns.FieldLabels[key] + '</div>' +
                '<div class="ff-value" style="color:' + color + '">' + (val || 0) + '</div>' +
            '</div>';
        },

        bindEvents: function() {
            var self = this;
            var btn = document.getElementById('recalc-btn');
            if (btn) {
                btn.onclick = function() {
                    if (self.onRecalculate) self.onRecalculate();
                };
            }
        },

        refresh: function() {
            this.render();
        }
    };
})(MeteorWorkshop);
