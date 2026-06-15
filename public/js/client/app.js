import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { MapCanvas } from './components/MapCanvas.js';
import { LayerPanel } from './components/LayerPanel.js';
import { InfoPanel } from './components/InfoPanel.js';
import { HistoryPanel } from './components/HistoryPanel.js';
import { ResultPanel } from './components/ResultPanel.js';
const TOOL_STEPS = [
    { id: 'import', label: '导入底图', icon: '📥', desc: '导入手绘地形图' },
    { id: 'scale', label: '标定比例尺', icon: '📏', desc: '标定比例尺' },
    { id: 'contour', label: '描绘等高线', icon: '🌀', desc: '描绘等高线' },
    { id: 'ridge', label: '描绘山脊', icon: '⛰️', desc: '描绘山脊线' },
    { id: 'aspect', label: '测量坡向', icon: '🧭', desc: '测量坡向' },
    { id: 'profile', label: '生成剖面', icon: '📊', desc: '生成剖面图' },
];
function App() {
    const [masters, setMasters] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [fullData, setFullData] = useState(null);
    const [activeTab, setActiveTab] = useState('layers');
    const [rollbackNotice, setRollbackNotice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTool, setActiveTool] = useState('none');
    const [toolMessage, setToolMessage] = useState(null);
    const [drawPoints, setDrawPoints] = useState([]);
    useEffect(() => {
        fetchMasters();
    }, []);
    useEffect(() => {
        if (selectedId) {
            fetchFullData(selectedId);
        }
        else {
            setFullData(null);
        }
    }, [selectedId]);
    async function fetchMasters() {
        setLoading(true);
        try {
            const res = await fetch('/api/masters');
            const data = await res.json();
            setMasters(data);
            if (data.length > 0) {
                setSelectedId(data[0].id);
            }
        }
        catch (e) {
            console.error('加载主记录失败:', e);
        }
        setLoading(false);
    }
    async function fetchFullData(id) {
        try {
            const res = await fetch(`/api/masters/${id}/full`);
            const data = await res.json();
            setFullData(data);
        }
        catch (e) {
            console.error('加载详情失败:', e);
        }
    }
    async function handleCreateSnapshot() {
        if (!selectedId || !fullData)
            return;
        const name = 'v' + fullData.master.version + ' - ' + new Date().toLocaleString('zh-CN');
        try {
            await fetch('/api/snapshots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ masterId: selectedId, name: name }),
            });
            fetchFullData(selectedId);
            showMessage('快照创建成功');
        }
        catch (e) {
            console.error('创建快照失败:', e);
        }
    }
    async function handleRestoreSnapshot(snapshotId) {
        if (!selectedId)
            return;
        try {
            await fetch('/api/snapshots/' + snapshotId + '/restore', { method: 'POST' });
            setRollbackNotice('已从历史版本回滚，数据已恢复到快照版本');
            fetchFullData(selectedId);
            setTimeout(function () { setRollbackNotice(null); }, 5000);
        }
        catch (e) {
            console.error('回滚失败:', e);
        }
    }
    async function handleToggleError(errorId) {
        if (!selectedId || !fullData)
            return;
        const updatedNotes = fullData.result.errorNotes.map(function (n) {
            return n.id === errorId ? Object.assign({}, n, { resolved: !n.resolved }) : n;
        });
        try {
            await fetch('/api/results/' + selectedId, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ errorNotes: updatedNotes }),
            });
            fetchFullData(selectedId);
        }
        catch (e) {
            console.error('更新错误备注失败:', e);
        }
    }
    async function handleToggleLayer(layerId) {
        if (!selectedId || !fullData)
            return;
        const updatedLayers = fullData.result.layers.map(function (l) {
            return l.layerId === layerId ? Object.assign({}, l, { visible: !l.visible }) : l;
        });
        try {
            await fetch('/api/results/' + selectedId, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ layers: updatedLayers }),
            });
            fetchFullData(selectedId);
        }
        catch (e) {
            console.error('更新图层状态失败:', e);
        }
    }
    function handleExportImage() {
        const svg = document.querySelector('.map-svg');
        if (!svg || !fullData)
            return;
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        img.onload = function () {
            canvas.width = svg.viewBox.baseVal.width || 800;
            canvas.height = svg.viewBox.baseVal.height || 600;
            if (ctx) {
                ctx.fillStyle = '#0f1621';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            }
            URL.revokeObjectURL(url);
            const link = document.createElement('a');
            link.download = (fullData.master.name || 'contour-map') + '.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            showMessage('图片导出成功');
        };
        img.src = url;
    }
    function handleExportData() {
        if (!fullData)
            return;
        const dataStr = JSON.stringify(fullData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = fullData.master.name + '_data.json';
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    }
    function showMessage(msg) {
        setToolMessage(msg);
        setTimeout(function () { setToolMessage(null); }, 3000);
    }
    function activateTool(tool) {
        const newTool = activeTool === tool ? 'none' : tool;
        setActiveTool(newTool);
        setDrawPoints([]);
        if (newTool === 'import') {
            showMessage('请选择或拖拽上传手绘地形图（当前使用当前记录）');
        }
        else if (newTool === 'scale') {
            showMessage('请在地图上点击比例尺两端点标定距离');
        }
        else if (newTool === 'contour') {
            showMessage('请在地图上点击描出等高线路径，完成后点击"完成"');
        }
        else if (newTool === 'ridge') {
            showMessage('请在地图上点击描出山脊线，完成后点击"完成"');
        }
        else if (newTool === 'profile') {
            showMessage('请在地图上点击两点确定剖面线');
        }
        else if (newTool === 'aspect') {
            showMessage('请在地图上点击测量坡向点');
        }
    }
    function handleCanvasClick(e) {
        if (!fullData || activeTool === 'none')
            return;
        const svg = e.currentTarget;
        const rect = svg.getBoundingClientRect();
        const vb = svg.viewBox.baseVal;
        const x = (e.clientX - rect.left) * (vb.width / rect.width);
        const y = (e.clientY - rect.top) * (vb.height / rect.height);
        const pt = { x: x, y: y };
        if (activeTool === 'scale') {
            const newPoints = drawPoints.concat([pt]);
            setDrawPoints(newPoints);
            if (newPoints.length === 2) {
                showMessage('已标定比例尺两端点，完成请点击"完成"');
            }
        }
        else if (activeTool === 'contour' || activeTool === 'ridge') {
            setDrawPoints(drawPoints.concat([pt]));
        }
        else if (activeTool === 'profile') {
            const newPoints = drawPoints.concat([pt]);
            setDrawPoints(newPoints);
            if (newPoints.length === 2) {
                showMessage('已设定剖面起点和终点');
            }
        }
        else if (activeTool === 'aspect') {
            setDrawPoints([pt]);
            showMessage('已选择坡向测量点');
        }
    }
    function finishDraw() {
        if (!fullData) {
            setDrawPoints([]);
            return;
        }
        if (activeTool === 'contour') {
            showMessage('已记录 ' + drawPoints.length + ' 个等高线点');
        }
        else if (activeTool === 'ridge') {
            showMessage('已描绘山脊线（' + drawPoints.length + ' 点）');
        }
        else if (activeTool === 'profile') {
            showMessage('剖面线已设定');
        }
        else if (activeTool === 'scale') {
            showMessage('比例尺已标定');
        }
        setDrawPoints([]);
    }
    function cancelDraw() {
        setDrawPoints([]);
        setActiveTool('none');
    }
    function getStatusBadge(status) {
        const colors = {
            draft: 'status-draft',
            processing: 'status-processing',
            completed: 'status-completed',
            error: 'status-error',
        };
        const labels = {
            draft: '草稿',
            processing: '处理中',
            completed: '已完成',
            error: '异常',
        };
        return React.createElement('span', { className: 'status-badge ' + (colors[status] || '') }, labels[status] || status);
    }
    const hasHighErrors = fullData ? fullData.result.errorNotes.some(function (n) { return n.severity === 'high' && !n.resolved; }) : false;
    return React.createElement('div', { className: 'app-container' }, React.createElement('header', { className: 'app-header' }, React.createElement('div', { className: 'header-left' }, React.createElement('h1', null, '沙盘地形等高线描绘工具'), React.createElement('span', { className: 'header-subtitle' }, 'Sandbox Topographic Contour Tool')), React.createElement('div', { className: 'header-right' }, React.createElement('span', { className: 'header-info' }, '共 ' + masters.length + ' 个记录'))), React.createElement('div', { className: 'workflow-bar' }, TOOL_STEPS.map(function (step, idx) {
        return React.createElement(React.Fragment, { key: step.id }, React.createElement('button', {
            className: 'workflow-step' + (activeTool === step.id ? ' active' : ''),
            onClick: function () { activateTool(step.id); },
            title: step.desc,
        }, React.createElement('span', { className: 'wf-icon' }, step.icon), React.createElement('span', { className: 'wf-label' }, step.label), React.createElement('span', { className: 'wf-num' }, String(idx + 1))), idx < TOOL_STEPS.length - 1 ? React.createElement('div', { className: 'wf-connector' }) : null);
    }), activeTool !== 'none' ? React.createElement('div', { className: 'workflow-actions' }, drawPoints.length > 0 ? React.createElement('button', { className: 'btn-small btn-primary', onClick: finishDraw }, '完成') : null, React.createElement('button', { className: 'btn-tiny', onClick: cancelDraw }, '取消')) : null), rollbackNotice ? React.createElement('div', { className: 'rollback-banner' }, React.createElement('span', null, '\u21BA ' + rollbackNotice)) : null, hasHighErrors ? React.createElement('div', { className: 'error-banner' }, React.createElement('span', null, '\u26A0 存在未解决的高优先级误差备注，请检查"结果"面板')) : null, toolMessage && !rollbackNotice && !hasHighErrors ? React.createElement('div', { className: 'tool-banner' }, React.createElement('span', null, '\uD83D\uDEE0 ' + toolMessage)) : null, React.createElement('div', { className: 'main-content' }, React.createElement('aside', { className: 'sidebar left-sidebar' }, React.createElement('div', { className: 'sidebar-title' }, '记录列表'), React.createElement('div', { className: 'record-list' }, loading ? React.createElement('div', { className: 'loading' }, '加载中...') : null, !loading ? masters.map(function (m) {
        return React.createElement('div', {
            key: m.id,
            className: 'record-item' + (selectedId === m.id ? ' active' : ''),
            onClick: function () { setSelectedId(m.id); },
        }, React.createElement('div', { className: 'record-name' }, m.name), React.createElement('div', { className: 'record-meta' }, React.createElement('span', { className: 'record-batch' }, m.batch), getStatusBadge(m.status)), React.createElement('div', { className: 'record-version' }, 'v' + m.version + ' \u00B7 ' + m.terrainType));
    }) : null), fullData ? React.createElement('div', { className: 'data-structure-hint' }, React.createElement('div', { className: 'hint-title' }, '数据结构'), React.createElement('div', { className: 'hint-item' }, React.createElement('span', { className: 'hint-dot master' }), '主记录 \u00B7 地形图'), React.createElement('div', { className: 'hint-item' }, React.createElement('span', { className: 'hint-dot detail' }), '明细 \u00B7 ' + fullData.details.length + ' 条等高线'), React.createElement('div', { className: 'hint-item' }, React.createElement('span', { className: 'hint-dot history' }), '历史 \u00B7 ' + fullData.histories.length + ' 条操作'), React.createElement('div', { className: 'hint-item' }, React.createElement('span', { className: 'hint-dot result' }), '结果 \u00B7 ' + fullData.result.pointLabels.length + ' 标签')) : null), React.createElement('main', { className: 'canvas-area' }, fullData ? React.createElement(MapCanvas, {
        master: fullData.master,
        details: fullData.details,
        histories: fullData.histories,
        result: fullData.result,
        drawPoints: drawPoints,
        activeTool: activeTool,
        onCanvasClick: handleCanvasClick,
    }) : React.createElement('div', { className: 'empty-state' }, React.createElement('div', { className: 'empty-icon' }, '\uD83D\uDDFA\uFE0F'), React.createElement('h3', null, '选择一个记录开始'), React.createElement('p', null, '从左侧列表选择一个沙盘地形记录'))), React.createElement('aside', { className: 'sidebar right-sidebar' }, React.createElement('div', { className: 'tab-bar' }, ['layers', 'info', 'history', 'result'].map(function (tab) {
        const labels = { layers: '图层', info: '信息', history: '历史', result: '结果' };
        return React.createElement('button', {
            key: tab,
            className: 'tab-btn' + (activeTab === tab ? ' active' : ''),
            onClick: function () { setActiveTab(tab); },
        }, labels[tab]);
    })), React.createElement('div', { className: 'tab-content' }, fullData && activeTab === 'layers' ? React.createElement(LayerPanel, {
        details: fullData.details,
        result: fullData.result,
        onToggleLayer: handleToggleLayer,
    }) : null, fullData && activeTab === 'info' ? React.createElement(InfoPanel, {
        master: fullData.master,
        snapshots: fullData.snapshots,
        onCreateSnapshot: handleCreateSnapshot,
        onRestoreSnapshot: handleRestoreSnapshot,
    }) : null, fullData && activeTab === 'history' ? React.createElement(HistoryPanel, { histories: fullData.histories }) : null, fullData && activeTab === 'result' ? React.createElement(ResultPanel, {
        result: fullData.result,
        onToggleError: handleToggleError,
        onExportImage: handleExportImage,
        onExportData: handleExportData,
    }) : null, !fullData ? React.createElement('div', { className: 'empty-tab' }, '请选择记录') : null))));
}
const root = createRoot(document.getElementById('root'));
root.render(React.createElement(App));
