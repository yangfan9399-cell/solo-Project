var MeteorWorkshop = MeteorWorkshop || {};

(function(ns) {
    ns.EventsUI = {
        onEventClick: null,

        render: function() {
            var container = document.getElementById('event-list');
            var events = ns.Engine.getAvailableEvents();
            var status = ns.Engine.checkGameStatus();
            var isGameOver = status.status !== 'playing';
            var isLatest = ns.StateManager.isAtLatest();

            var html = '';
            for (var i = 0; i < events.length; i++) {
                var item = events[i];
                var ev = item.event;
                var catLabel = ns.EventCategoryLabels[ev.category] || ev.category;
                var disabled = !item.available || isGameOver || !isLatest;
                html += this.renderEventCard(ev, catLabel, disabled, i);
            }

            if (isGameOver) {
                html = '<div class="event-gameover-hint">本局已结束，请查看结算簿或重置。</div>' + html;
            } else if (!isLatest) {
                html = '<div class="event-replay-hint">回放模式：跳回最新步骤后可继续操作。</div>' + html;
            }

            container.innerHTML = html;
            this.bindEvents();
        },

        renderEventCard: function(ev, catLabel, disabled, index) {
            var costHtml = this.renderDelta(ev.cost, true);
            var effectHtml = this.renderDelta(ev.effect, false);

            return '<div class="event-card' + (disabled ? ' disabled' : '') + '" data-event-index="' + index + '">' +
                '<div class="event-header">' +
                    '<span class="event-cat">' + catLabel + '</span>' +
                    '<span class="event-name">' + ev.name + '</span>' +
                '</div>' +
                '<div class="event-desc">' + ev.description + '</div>' +
                '<div class="event-deltas">' +
                    (costHtml ? '<div class="event-cost">消耗: ' + costHtml + '</div>' : '') +
                    (effectHtml ? '<div class="event-effect">获得: ' + effectHtml + '</div>' : '') +
                '</div>' +
                (disabled ? '<div class="event-disabled-mask"></div>' : '') +
            '</div>';
        },

        renderDelta: function(delta, isCost) {
            if (!delta) return '';
            var parts = [];
            for (var key in delta) {
                if (delta.hasOwnProperty(key)) {
                    var label = ns.FieldLabels[key] || key;
                    var val = delta[key];
                    var color = ns.FieldColors[key] || '#ccc';
                    var sign = isCost ? '-' : '+';
                    if (!isCost && val < 0) { sign = ''; }
                    parts.push('<span class="delta-item" style="color:' + color + '">' + label + ' ' + sign + val + '</span>');
                }
            }
            return parts.join('，');
        },

        bindEvents: function() {
            var self = this;
            var cards = document.querySelectorAll('.event-card');
            cards.forEach(function(card) {
                card.addEventListener('click', function() {
                    if (card.classList.contains('disabled')) return;
                    var idx = parseInt(card.getAttribute('data-event-index'), 10);
                    if (self.onEventClick) self.onEventClick(idx);
                });
            });
        }
    };
})(MeteorWorkshop);
