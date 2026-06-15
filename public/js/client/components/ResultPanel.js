import React, { useState } from 'react';
import { ProfileChart } from './ProfileChart.js';
export function ResultPanel({ result, onToggleError, onExportImage, onExportData }) {
    const [tab, setTab] = useState('labels');
    const unresolvedHigh = result.errorNotes.filter(n => n.severity === 'high' && !n.resolved).length;
    const unresolvedCount = result.errorNotes.filter(n => !n.resolved).length;
    const statusLabels = {
        pending: '待处理',
        ready: '就绪',
        exported: '已导出',
        rolled_back: '已回滚',
    };
    function getSeverityLabel(s) {
        const map = {
            high: { text: '高', className: 'sev-high' },
            medium: { text: '中', className: 'sev-medium' },
            low: { text: '低', className: 'sev-low' },
        };
        return map[s] || { text: s, className: '' };
    }
    function getTypeLabel(t) {
        const map = {
            elevation: '高程',
            landmark: '地标',
            annotation: '注释',
        };
        return map[t] || t;
    }
    return (React.createElement("div", { className: "result-panel" },
        React.createElement("div", { className: "panel-section" },
            React.createElement("div", { className: "result-header" },
                React.createElement("h3", { className: "panel-title" }, "\u7ED3\u679C\u8BB0\u5F55"),
                React.createElement("span", { className: `status-badge status-${result.status}` }, statusLabels[result.status] || result.status)),
            React.createElement("div", { className: "result-version" },
                "\u7ED3\u679C\u7248\u672C: v",
                result.version)),
        React.createElement("div", { className: "sub-tab-bar" }, ['labels', 'errors', 'export'].map(t => (React.createElement("button", { key: t, className: `sub-tab-btn ${tab === t ? 'active' : ''}`, onClick: () => setTab(t) },
            t === 'labels' && `点位标签 (${result.pointLabels.length})`,
            t === 'errors' && `误差备注 (${unresolvedCount}/${result.errorNotes.length})`,
            t === 'export' && '导出')))),
        React.createElement("div", { className: "sub-tab-content" },
            tab === 'labels' && (React.createElement("div", { className: "labels-list" }, result.pointLabels.length === 0 ? (React.createElement("p", { className: "empty-text" }, "\u6682\u65E0\u6807\u7B7E")) : (result.pointLabels.map(label => (React.createElement("div", { key: label.id, className: "label-item" },
                React.createElement("div", { className: `label-type type-${label.type}` }, getTypeLabel(label.type)),
                React.createElement("div", { className: "label-info" },
                    React.createElement("div", { className: "label-text" }, label.text),
                    label.elevation !== undefined && (React.createElement("div", { className: "label-elev" },
                        label.elevation,
                        "m")),
                    React.createElement("div", { className: "label-pos" },
                        "(",
                        label.x,
                        ", ",
                        label.y,
                        ")")))))))),
            tab === 'errors' && (React.createElement("div", { className: "errors-list" },
                unresolvedHigh > 0 && (React.createElement("div", { className: "error-alert" },
                    React.createElement("span", null,
                        "\u26A0 ",
                        unresolvedHigh,
                        " \u4E2A\u9AD8\u4F18\u5148\u7EA7\u8BEF\u5DEE\u5F85\u5904\u7406"))),
                result.errorNotes.length === 0 ? (React.createElement("p", { className: "empty-text" }, "\u6682\u65E0\u8BEF\u5DEE\u5907\u6CE8")) : (result.errorNotes.map(note => {
                    const sev = getSeverityLabel(note.severity);
                    return (React.createElement("div", { key: note.id, className: `error-item ${note.resolved ? 'resolved' : ''}` },
                        React.createElement("div", { className: `error-severity ${sev.className}` }, sev.text),
                        React.createElement("div", { className: "error-content" },
                            React.createElement("div", { className: "error-message" }, note.message),
                            React.createElement("div", { className: "error-pos" },
                                "\u4F4D\u7F6E: (",
                                note.x,
                                ", ",
                                note.y,
                                ")")),
                        React.createElement("button", { className: "btn-tiny", onClick: () => onToggleError(note.id) }, note.resolved ? '重开' : '解决')));
                })))),
            tab === 'export' && (React.createElement("div", { className: "export-section" },
                React.createElement("div", { className: "export-preview" },
                    React.createElement("h4", { className: "panel-subtitle" }, "\u5BFC\u51FA\u9884\u89C8"),
                    React.createElement(ProfileChart, { result: result })),
                React.createElement("div", { className: "export-info" },
                    React.createElement("div", { className: "info-row" },
                        React.createElement("span", { className: "info-label" }, "\u5BFC\u51FA\u683C\u5F0F"),
                        React.createElement("span", { className: "info-value" }, "PNG / SVG")),
                    React.createElement("div", { className: "info-row" },
                        React.createElement("span", { className: "info-label" }, "\u5305\u542B\u5185\u5BB9"),
                        React.createElement("span", { className: "info-value" },
                            result.layers.filter(l => l.visible).length,
                            " \u4E2A\u56FE\u5C42 \u00B7",
                            result.pointLabels.length,
                            " \u4E2A\u6807\u7B7E")),
                    React.createElement("div", { className: "info-row" },
                        React.createElement("span", { className: "info-label" }, "\u7ED3\u679C\u72B6\u6001"),
                        React.createElement("span", { className: "info-value" }, statusLabels[result.status]))),
                React.createElement("div", { className: "export-actions" },
                    React.createElement("button", { className: "btn-primary", disabled: result.status === 'rolled_back', onClick: onExportImage }, "\u5BFC\u51FA\u56FE\u7247"),
                    React.createElement("button", { className: "btn-secondary", onClick: onExportData }, "\u5BFC\u51FA\u6570\u636E")),
                result.status === 'rolled_back' && (React.createElement("div", { className: "rollback-notice" }, "\u26A0 \u6B64\u7ED3\u679C\u4E3A\u56DE\u6EDA\u7248\u672C\uFF0C\u8BF7\u91CD\u65B0\u6821\u9A8C\u540E\u518D\u5BFC\u51FA")))))));
}
