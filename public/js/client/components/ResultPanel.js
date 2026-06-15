import React, { useState } from 'react';
import { ProfileChart } from './ProfileChart.js';
export function ResultPanel(props) {
    const result = props.result;
    const onToggleError = props.onToggleError;
    const onExportImage = props.onExportImage;
    const onExportData = props.onExportData;
    const [tab, setTab] = useState('labels');
    const unresolvedHigh = result.errorNotes.filter(function (n) { return n.severity === 'high' && !n.resolved; }).length;
    const unresolvedCount = result.errorNotes.filter(function (n) { return !n.resolved; }).length;
    const statusLabels = {
        pending: '待处理', ready: '就绪', exported: '已导出', rolled_back: '已回滚',
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
        const map = { elevation: '高程', landmark: '地标', annotation: '注释' };
        return map[t] || t;
    }
    const tabLabels = {
        labels: '点位标签 (' + result.pointLabels.length + ')',
        errors: '误差备注 (' + unresolvedCount + '/' + result.errorNotes.length + ')',
        export: '导出',
    };
    const subTabBtns = ['labels', 'errors', 'export'].map(function (t) {
        return React.createElement('button', {
            key: t,
            className: 'sub-tab-btn' + (tab === t ? ' active' : ''),
            onClick: function () { setTab(t); },
        }, tabLabels[t]);
    });
    const labelsContent = result.pointLabels.length === 0
        ? React.createElement('p', { className: 'empty-text' }, '暂无标签')
        : React.createElement('div', { className: 'labels-list' }, result.pointLabels.map(function (label) {
            return React.createElement('div', { key: label.id, className: 'label-item' }, React.createElement('div', { className: 'label-type type-' + label.type }, getTypeLabel(label.type)), React.createElement('div', { className: 'label-info' }, React.createElement('div', { className: 'label-text' }, label.text), label.elevation !== undefined ? React.createElement('div', { className: 'label-elev' }, label.elevation + 'm') : null, React.createElement('div', { className: 'label-pos' }, '(' + label.x + ', ' + label.y + ')')));
        }));
    const errorsItems = result.errorNotes.length === 0
        ? React.createElement('p', { className: 'empty-text' }, '暂无误差备注')
        : result.errorNotes.map(function (note) {
            const sev = getSeverityLabel(note.severity);
            return React.createElement('div', {
                key: note.id,
                className: 'error-item' + (note.resolved ? ' resolved' : ''),
            }, React.createElement('div', { className: 'error-severity ' + sev.className }, sev.text), React.createElement('div', { className: 'error-content' }, React.createElement('div', { className: 'error-message' }, note.message), React.createElement('div', { className: 'error-pos' }, '位置: (' + note.x + ', ' + note.y + ')')), React.createElement('button', {
                className: 'btn-tiny',
                onClick: function () { onToggleError(note.id); },
            }, note.resolved ? '重开' : '解决'));
        });
    const errorsContent = React.createElement('div', { className: 'errors-list' }, unresolvedHigh > 0 ? React.createElement('div', { className: 'error-alert' }, React.createElement('span', null, '\u26A0 ' + unresolvedHigh + ' 个高优先级误差待处理')) : null, errorsItems);
    const visibleLayerCount = result.layers.filter(function (l) { return l.visible; }).length;
    const exportContent = React.createElement('div', { className: 'export-section' }, React.createElement('div', { className: 'export-preview' }, React.createElement('h4', { className: 'panel-subtitle' }, '剖面预览'), React.createElement(ProfileChart, { result: result })), React.createElement('div', { className: 'export-info' }, React.createElement('div', { className: 'info-row' }, React.createElement('span', { className: 'info-label' }, '导出格式'), React.createElement('span', { className: 'info-value' }, 'PNG / JSON')), React.createElement('div', { className: 'info-row' }, React.createElement('span', { className: 'info-label' }, '包含内容'), React.createElement('span', { className: 'info-value' }, visibleLayerCount + ' 个图层 \u00B7 ' + result.pointLabels.length + ' 个标签')), React.createElement('div', { className: 'info-row' }, React.createElement('span', { className: 'info-label' }, '结果状态'), React.createElement('span', { className: 'info-value' }, statusLabels[result.status] || result.status))), React.createElement('div', { className: 'export-actions' }, React.createElement('button', {
        className: 'btn-small btn-primary',
        disabled: result.status === 'rolled_back',
        onClick: onExportImage,
    }, '导出图片'), React.createElement('button', {
        className: 'btn-small',
        onClick: onExportData,
    }, '导出数据')), result.status === 'rolled_back' ? React.createElement('div', { className: 'rollback-notice' }, '\u26A0 此结果为回滚版本，请重新校验后再导出') : null);
    let activeContent = null;
    if (tab === 'labels')
        activeContent = labelsContent;
    else if (tab === 'errors')
        activeContent = errorsContent;
    else if (tab === 'export')
        activeContent = exportContent;
    return React.createElement('div', { className: 'result-panel' }, React.createElement('div', { className: 'panel-section' }, React.createElement('div', { className: 'result-header' }, React.createElement('h3', { className: 'panel-title' }, '结果记录'), React.createElement('span', { className: 'status-badge status-' + result.status }, statusLabels[result.status] || result.status)), React.createElement('div', { className: 'result-version' }, '结果版本: v' + result.version)), React.createElement('div', { className: 'sub-tab-bar' }, subTabBtns), React.createElement('div', { className: 'sub-tab-content' }, activeContent));
}
