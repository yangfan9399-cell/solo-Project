import React, { useState } from 'react';
export function HistoryPanel({ histories }) {
    const [filter, setFilter] = useState('all');
    const filtered = filter === 'all'
        ? histories
        : histories.filter(h => h.type === filter);
    const typeLabels = {
        ridge: '山脊线',
        profile: '剖面图',
        aspect: '坡向',
    };
    const typeColors = {
        ridge: 'timeline-ridge',
        profile: 'timeline-profile',
        aspect: 'timeline-aspect',
    };
    function formatTime(iso) {
        return new Date(iso).toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    }
    function getHistorySummary(h) {
        if (h.type === 'ridge') {
            const data = h.data;
            return `${data.name} · ${data.points.length} 个点位`;
        }
        if (h.type === 'profile') {
            const data = h.data;
            return `${data.name} · ${data.totalDistance.toFixed(0)}m`;
        }
        if (h.type === 'aspect') {
            const data = h.data;
            return `${data.direction}° · 坡度 ${data.slope}°`;
        }
        return '';
    }
    return (React.createElement("div", { className: "history-panel" },
        React.createElement("div", { className: "panel-section" },
            React.createElement("h3", { className: "panel-title" }, "\u5386\u53F2\u8BB0\u5F55"),
            React.createElement("p", { className: "panel-desc" },
                "\u5171 ",
                histories.length,
                " \u6761\u64CD\u4F5C\u8BB0\u5F55")),
        React.createElement("div", { className: "filter-bar" }, ['all', 'ridge', 'profile', 'aspect'].map(f => (React.createElement("button", { key: f, className: `filter-btn ${filter === f ? 'active' : ''}`, onClick: () => setFilter(f) }, f === 'all' ? '全部' : typeLabels[f])))),
        React.createElement("div", { className: "timeline" }, filtered.length === 0 ? (React.createElement("p", { className: "empty-text" }, "\u6682\u65E0\u8BB0\u5F55")) : (filtered.map(h => (React.createElement("div", { key: h.id, className: "timeline-item" },
            React.createElement("div", { className: `timeline-dot ${typeColors[h.type]}` }),
            React.createElement("div", { className: "timeline-content" },
                React.createElement("div", { className: "timeline-header" },
                    React.createElement("span", { className: "timeline-type" }, typeLabels[h.type]),
                    React.createElement("span", { className: "timeline-version" },
                        "v",
                        h.version)),
                React.createElement("div", { className: "timeline-summary" }, getHistorySummary(h)),
                React.createElement("div", { className: "timeline-footer" },
                    React.createElement("span", { className: "timeline-operator" }, h.operator),
                    React.createElement("span", { className: "timeline-time" }, formatTime(h.createdAt))),
                h.remark && (React.createElement("div", { className: "timeline-remark" },
                    "\u5907\u6CE8: ",
                    h.remark))))))))));
}
