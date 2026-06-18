var MeteorWorkshop = MeteorWorkshop || {};

(function(ns) {
    ns.SettlementUI = {
        onRecalculate: null,
        lastResult: null,

        render: function() {
            this.lastResult = ns.Engine.backendRecalculate();
            this.renderWithResult(this.lastResult);
            this.bindEvents();
        },

        renderWithResult: function(result) {
            var container = document.getElementById('settlement-content');
            var state = result.state;
            var statusText = result.status === 'win' ? '✦ 胜 利 ✦' : (result.status === 'lose' ? '☠ 失 败 ☠' : '运 营 中');
            var statusClass = 'settle-' + result.status;

            var html = '<div class="settle-header ' + statusClass + '">' +
                '<div class="settle-title">结算簿 · ' + result.sessionName + '</div>' +
                '<div class="settle-status">' + statusText + '</div>' +
            '</div>';

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
                '<div class="settle-note-text">结算基于"陨铁工坊解锁值"、各局面字段与"竞速经营步骤数"综合重算。点击下方按钮可强制后端重新校验。</div>' +
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
