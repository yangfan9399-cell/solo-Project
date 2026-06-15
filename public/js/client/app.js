import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { MapCanvas } from './components/MapCanvas.js';
import { LayerPanel } from './components/LayerPanel.js';
import { InfoPanel } from './components/InfoPanel.js';
import { HistoryPanel } from './components/HistoryPanel.js';
import { ResultPanel } from './components/ResultPanel.js';
function App() {
    const [masters, setMasters] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [fullData, setFullData] = useState(null);
    const [activeTab, setActiveTab] = useState('layers');
    const [rollbackNotice, setRollbackNotice] = useState(null);
    const [loading, setLoading] = useState(true);
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
            if (data.length > 0 && !selectedId) {
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
        const name = `v${fullData.master.version} - ${new Date().toLocaleString('zh-CN')}`;
        try {
            await fetch('/api/snapshots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ masterId: selectedId, name }),
            });
            fetchFullData(selectedId);
        }
        catch (e) {
            console.error('创建快照失败:', e);
        }
    }
    async function handleRestoreSnapshot(snapshotId) {
        if (!selectedId)
            return;
        try {
            await fetch(`/api/snapshots/${snapshotId}/restore`, { method: 'POST' });
            setRollbackNotice('已从历史版本回滚，数据已恢复到快照版本');
            fetchFullData(selectedId);
            setTimeout(() => setRollbackNotice(null), 5000);
        }
        catch (e) {
            console.error('回滚失败:', e);
        }
    }
    async function handleToggleError(errorId) {
        if (!selectedId || !fullData)
            return;
        const updatedNotes = fullData.result.errorNotes.map(n => n.id === errorId ? { ...n, resolved: !n.resolved } : n);
        try {
            await fetch(`/api/results/${selectedId}`, {
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
        const updatedLayers = fullData.result.layers.map(l => l.layerId === layerId ? { ...l, visible: !l.visible } : l);
        try {
            await fetch(`/api/results/${selectedId}`, {
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
        if (!svg)
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
            ctx.fillStyle = '#0f1621';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
            const link = document.createElement('a');
            link.download = `${fullData?.master.name || 'contour-map'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
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
        link.download = `${fullData.master.name}_data.json`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
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
        return React.createElement("span", { className: `status-badge ${colors[status] || ''}` }, labels[status] || status);
    }
    const hasHighErrors = fullData?.result.errorNotes.some(n => n.severity === 'high' && !n.resolved);
    return (React.createElement("div", { className: "app-container" },
        React.createElement("header", { className: "app-header" },
            React.createElement("div", { className: "header-left" },
                React.createElement("h1", null, "\u6C99\u76D8\u5730\u5F62\u7B49\u9AD8\u7EBF\u63CF\u7ED8\u5DE5\u5177"),
                React.createElement("span", { className: "header-subtitle" }, "Sandbox Topographic Contour Tool")),
            React.createElement("div", { className: "header-right" },
                React.createElement("span", { className: "header-info" },
                    "\u5171 ",
                    masters.length,
                    " \u4E2A\u8BB0\u5F55"))),
        rollbackNotice && (React.createElement("div", { className: "rollback-banner" },
            React.createElement("span", null,
                "\u21BA ",
                rollbackNotice))),
        hasHighErrors && (React.createElement("div", { className: "error-banner" },
            React.createElement("span", null, "\u26A0 \u5B58\u5728\u672A\u89E3\u51B3\u7684\u9AD8\u4F18\u5148\u7EA7\u8BEF\u5DEE\u5907\u6CE8\uFF0C\u8BF7\u68C0\u67E5\"\u7ED3\u679C\"\u9762\u677F"))),
        React.createElement("div", { className: "main-content" },
            React.createElement("aside", { className: "sidebar left-sidebar" },
                React.createElement("div", { className: "sidebar-title" }, "\u8BB0\u5F55\u5217\u8868"),
                React.createElement("div", { className: "record-list" },
                    loading && React.createElement("div", { className: "loading" }, "\u52A0\u8F7D\u4E2D..."),
                    !loading && masters.map(m => (React.createElement("div", { key: m.id, className: `record-item ${selectedId === m.id ? 'active' : ''}`, onClick: () => setSelectedId(m.id) },
                        React.createElement("div", { className: "record-name" }, m.name),
                        React.createElement("div", { className: "record-meta" },
                            React.createElement("span", { className: "record-batch" }, m.batch),
                            getStatusBadge(m.status)),
                        React.createElement("div", { className: "record-version" },
                            "v",
                            m.version,
                            " \u00B7 ",
                            m.terrainType))))),
                fullData && (React.createElement("div", { className: "data-structure-hint" },
                    React.createElement("div", { className: "hint-title" }, "\u6570\u636E\u7ED3\u6784"),
                    React.createElement("div", { className: "hint-item" },
                        React.createElement("span", { className: "hint-dot master" }),
                        "\u4E3B\u8BB0\u5F55 \u00B7 \u5730\u5F62\u56FE"),
                    React.createElement("div", { className: "hint-item" },
                        React.createElement("span", { className: "hint-dot detail" }),
                        "\u660E\u7EC6 \u00B7 ",
                        fullData.details.length,
                        " \u6761\u7B49\u9AD8\u7EBF"),
                    React.createElement("div", { className: "hint-item" },
                        React.createElement("span", { className: "hint-dot history" }),
                        "\u5386\u53F2 \u00B7 ",
                        fullData.histories.length,
                        " \u6761\u64CD\u4F5C"),
                    React.createElement("div", { className: "hint-item" },
                        React.createElement("span", { className: "hint-dot result" }),
                        "\u7ED3\u679C \u00B7 ",
                        fullData.result.pointLabels.length,
                        " \u6807\u7B7E")))),
            React.createElement("main", { className: "canvas-area" }, fullData ? (React.createElement(MapCanvas, { master: fullData.master, details: fullData.details, histories: fullData.histories, result: fullData.result })) : (React.createElement("div", { className: "empty-state" },
                React.createElement("div", { className: "empty-icon" }, "\uD83D\uDDFA\uFE0F"),
                React.createElement("h3", null, "\u9009\u62E9\u4E00\u4E2A\u8BB0\u5F55\u5F00\u59CB"),
                React.createElement("p", null, "\u4ECE\u5DE6\u4FA7\u5217\u8868\u9009\u62E9\u4E00\u4E2A\u6C99\u76D8\u5730\u5F62\u8BB0\u5F55")))),
            React.createElement("aside", { className: "sidebar right-sidebar" },
                React.createElement("div", { className: "tab-bar" }, ['layers', 'info', 'history', 'result'].map(tab => (React.createElement("button", { key: tab, className: `tab-btn ${activeTab === tab ? 'active' : ''}`, onClick: () => setActiveTab(tab) },
                    tab === 'layers' && '图层',
                    tab === 'info' && '信息',
                    tab === 'history' && '历史',
                    tab === 'result' && '结果')))),
                React.createElement("div", { className: "tab-content" },
                    fullData && activeTab === 'layers' && (React.createElement(LayerPanel, { details: fullData.details, result: fullData.result, onToggleLayer: handleToggleLayer })),
                    fullData && activeTab === 'info' && (React.createElement(InfoPanel, { master: fullData.master, snapshots: fullData.snapshots, onCreateSnapshot: handleCreateSnapshot, onRestoreSnapshot: handleRestoreSnapshot })),
                    fullData && activeTab === 'history' && (React.createElement(HistoryPanel, { histories: fullData.histories })),
                    fullData && activeTab === 'result' && (React.createElement(ResultPanel, { result: fullData.result, onToggleError: handleToggleError, onExportImage: handleExportImage, onExportData: handleExportData })),
                    !fullData && (React.createElement("div", { className: "empty-tab" }, "\u8BF7\u9009\u62E9\u8BB0\u5F55")))))));
}
const root = createRoot(document.getElementById('root'));
root.render(React.createElement(App, null));
