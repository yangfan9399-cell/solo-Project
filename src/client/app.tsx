import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import type { MasterRecord, DetailRecord, HistoryRecord, ResultRecord, Snapshot, ErrorNote } from '../shared/types.js';
import { MapCanvas } from './components/MapCanvas.js';
import { LayerPanel } from './components/LayerPanel.js';
import { InfoPanel } from './components/InfoPanel.js';
import { HistoryPanel } from './components/HistoryPanel.js';
import { ResultPanel } from './components/ResultPanel.js';

type TabType = 'layers' | 'info' | 'history' | 'result';

interface FullData {
  master: MasterRecord;
  details: DetailRecord[];
  histories: HistoryRecord[];
  result: ResultRecord;
  snapshots: Snapshot[];
}

function App() {
  const [masters, setMasters] = useState<MasterRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fullData, setFullData] = useState<FullData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('layers');
  const [rollbackNotice, setRollbackNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMasters();
  }, []);

  useEffect(() => {
    if (selectedId) {
      fetchFullData(selectedId);
    } else {
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
    } catch (e) {
      console.error('加载主记录失败:', e);
    }
    setLoading(false);
  }

  async function fetchFullData(id: string) {
    try {
      const res = await fetch(`/api/masters/${id}/full`);
      const data = await res.json();
      setFullData(data);
    } catch (e) {
      console.error('加载详情失败:', e);
    }
  }

  async function handleCreateSnapshot() {
    if (!selectedId || !fullData) return;
    const name = `v${fullData.master.version} - ${new Date().toLocaleString('zh-CN')}`;
    try {
      await fetch('/api/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterId: selectedId, name }),
      });
      fetchFullData(selectedId);
    } catch (e) {
      console.error('创建快照失败:', e);
    }
  }

  async function handleRestoreSnapshot(snapshotId: string) {
    if (!selectedId) return;
    try {
      await fetch(`/api/snapshots/${snapshotId}/restore`, { method: 'POST' });
      setRollbackNotice('已从历史版本回滚，数据已恢复到快照版本');
      fetchFullData(selectedId);
      setTimeout(() => setRollbackNotice(null), 5000);
    } catch (e) {
      console.error('回滚失败:', e);
    }
  }

  async function handleToggleError(errorId: string) {
    if (!selectedId || !fullData) return;
    const updatedNotes = fullData.result.errorNotes.map(n =>
      n.id === errorId ? { ...n, resolved: !n.resolved } : n
    );
    try {
      await fetch(`/api/results/${selectedId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errorNotes: updatedNotes }),
      });
      fetchFullData(selectedId);
    } catch (e) {
      console.error('更新错误备注失败:', e);
    }
  }

  async function handleToggleLayer(layerId: string) {
    if (!selectedId || !fullData) return;
    const updatedLayers = fullData.result.layers.map(l =>
      l.layerId === layerId ? { ...l, visible: !l.visible } : l
    );
    try {
      await fetch(`/api/results/${selectedId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layers: updatedLayers }),
      });
      fetchFullData(selectedId);
    } catch (e) {
      console.error('更新图层状态失败:', e);
    }
  }

  function handleExportImage() {
    const svg = document.querySelector('.map-svg') as SVGSVGElement;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = function() {
      canvas.width = svg.viewBox.baseVal.width || 800;
      canvas.height = svg.viewBox.baseVal.height || 600;
      ctx!.fillStyle = '#0f1621';
      ctx!.fillRect(0, 0, canvas.width, canvas.height);
      ctx!.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      const link = document.createElement('a');
      link.download = `${fullData?.master.name || 'contour-map'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src = url;
  }

  function handleExportData() {
    if (!fullData) return;
    const dataStr = JSON.stringify(fullData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${fullData.master.name}_data.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }

  function getStatusBadge(status: string) {
    const colors: Record<string, string> = {
      draft: 'status-draft',
      processing: 'status-processing',
      completed: 'status-completed',
      error: 'status-error',
    };
    const labels: Record<string, string> = {
      draft: '草稿',
      processing: '处理中',
      completed: '已完成',
      error: '异常',
    };
    return <span className={`status-badge ${colors[status] || ''}`}>{labels[status] || status}</span>;
  }

  const hasHighErrors = fullData?.result.errorNotes.some(n => n.severity === 'high' && !n.resolved);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <h1>沙盘地形等高线描绘工具</h1>
          <span className="header-subtitle">Sandbox Topographic Contour Tool</span>
        </div>
        <div className="header-right">
          <span className="header-info">共 {masters.length} 个记录</span>
        </div>
      </header>

      {rollbackNotice && (
        <div className="rollback-banner">
          <span>↺ {rollbackNotice}</span>
        </div>
      )}

      {hasHighErrors && (
        <div className="error-banner">
          <span>⚠ 存在未解决的高优先级误差备注，请检查"结果"面板</span>
        </div>
      )}

      <div className="main-content">
        <aside className="sidebar left-sidebar">
          <div className="sidebar-title">记录列表</div>
          <div className="record-list">
            {loading && <div className="loading">加载中...</div>}
            {!loading && masters.map(m => (
              <div
                key={m.id}
                className={`record-item ${selectedId === m.id ? 'active' : ''}`}
                onClick={() => setSelectedId(m.id)}
              >
                <div className="record-name">{m.name}</div>
                <div className="record-meta">
                  <span className="record-batch">{m.batch}</span>
                  {getStatusBadge(m.status)}
                </div>
                <div className="record-version">v{m.version} · {m.terrainType}</div>
              </div>
            ))}
          </div>

          {fullData && (
            <div className="data-structure-hint">
              <div className="hint-title">数据结构</div>
              <div className="hint-item">
                <span className="hint-dot master"></span>
                主记录 · 地形图
              </div>
              <div className="hint-item">
                <span className="hint-dot detail"></span>
                明细 · {fullData.details.length} 条等高线
              </div>
              <div className="hint-item">
                <span className="hint-dot history"></span>
                历史 · {fullData.histories.length} 条操作
              </div>
              <div className="hint-item">
                <span className="hint-dot result"></span>
                结果 · {fullData.result.pointLabels.length} 标签
              </div>
            </div>
          )}
        </aside>

        <main className="canvas-area">
          {fullData ? (
            <MapCanvas
              master={fullData.master}
              details={fullData.details}
              histories={fullData.histories}
              result={fullData.result}
            />
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🗺️</div>
              <h3>选择一个记录开始</h3>
              <p>从左侧列表选择一个沙盘地形记录</p>
            </div>
          )}
        </main>

        <aside className="sidebar right-sidebar">
          <div className="tab-bar">
            {(['layers', 'info', 'history', 'result'] as TabType[]).map(tab => (
              <button
                key={tab}
                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'layers' && '图层'}
                {tab === 'info' && '信息'}
                {tab === 'history' && '历史'}
                {tab === 'result' && '结果'}
              </button>
            ))}
          </div>

          <div className="tab-content">
            {fullData && activeTab === 'layers' && (
              <LayerPanel
                details={fullData.details}
                result={fullData.result}
                onToggleLayer={handleToggleLayer}
              />
            )}
            {fullData && activeTab === 'info' && (
              <InfoPanel
                master={fullData.master}
                snapshots={fullData.snapshots}
                onCreateSnapshot={handleCreateSnapshot}
                onRestoreSnapshot={handleRestoreSnapshot}
              />
            )}
            {fullData && activeTab === 'history' && (
              <HistoryPanel histories={fullData.histories} />
            )}
            {fullData && activeTab === 'result' && (
              <ResultPanel
                result={fullData.result}
                onToggleError={handleToggleError}
                onExportImage={handleExportImage}
                onExportData={handleExportData}
              />
            )}
            {!fullData && (
              <div className="empty-tab">请选择记录</div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
