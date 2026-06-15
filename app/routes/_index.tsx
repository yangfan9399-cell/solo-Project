import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useState, useMemo } from "react";
import { masterService, detailService, resultService, historyService, getSnapshotsByMasterId } from "~/services.server";
import type { MasterRecord, DetailRecord, ResultRecord, HistoryRecord } from "~/types";
import MapCanvas from "~/components/MapCanvas";
import LayerPanel from "~/components/LayerPanel";
import InfoPanel from "~/components/InfoPanel";
import HistoryPanel from "~/components/HistoryPanel";
import ResultPanel from "~/components/ResultPanel";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const selectedId = url.searchParams.get('id');
  
  const masters = masterService.getAll();
  const activeMaster = selectedId 
    ? masters.find(m => m.id === selectedId) || masters[0]
    : masters[0];
  
  let details: DetailRecord[] = [];
  let result: ResultRecord | null = null;
  let histories: HistoryRecord[] = [];
  let snapshots: any[] = [];
  
  if (activeMaster) {
    details = detailService.getByMasterId(activeMaster.id);
    result = resultService.getByMasterId(activeMaster.id);
    histories = historyService.getByMasterId(activeMaster.id);
    snapshots = getSnapshotsByMasterId(activeMaster.id);
  }
  
  return json({ masters, activeMaster, details, result, histories, snapshots });
};

export default function Index() {
  const { masters, activeMaster: initialMaster, details: initialDetails, result: initialResult, histories: initialHistories, snapshots: initialSnapshots } = useLoaderData<typeof loader>();
  
  const [activeId, setActiveId] = useState<string | null>(initialMaster?.id || null);
  const [activeTab, setActiveTab] = useState<'layers' | 'info' | 'history' | 'result'>('layers');
  const [tool, setTool] = useState<'select' | 'contour' | 'ridge' | 'profile' | 'label' | 'error'>('select');
  
  const activeMaster = masters.find(m => m.id === activeId) || null;
  const activeDetails = useMemo(() => {
    if (!activeMaster) return initialDetails;
    return initialDetails.filter(d => d.masterId === activeMaster.id);
  }, [activeMaster, initialDetails]);
  
  const activeResult = useMemo(() => {
    if (!activeMaster || !initialResult) return initialResult;
    return initialResult.masterId === activeMaster.id ? initialResult : null;
  }, [activeMaster, initialResult]);
  
  const activeHistories = useMemo(() => {
    if (!activeMaster) return initialHistories;
    return initialHistories.filter(h => h.masterId === activeMaster.id);
  }, [activeMaster, initialHistories]);
  
  const isRollbackState = activeMaster?.status === 'processing' && activeResult?.status === 'rollback';
  const hasErrors = activeResult?.errorNotes.filter(e => !e.resolved).length ?? 0 > 0;
  
  const handleSelectRecord = (id: string) => {
    setActiveId(id);
    const url = new URL(window.location.href);
    url.searchParams.set('id', id);
    window.history.replaceState({}, '', url.toString());
  };
  
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-title">
          <span style={{ fontSize: '24px' }}>⛰️</span>
          <h1>沙盘地形等高线描绘工具</h1>
          <span className="badge">专业版 v1.0</span>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary btn-sm">
            � 版本对比
          </button>
          <button className="btn btn-primary btn-sm">
            📤 导出图片
          </button>
        </div>
      </header>
      
      {isRollbackState && (
        <div className="rollback-banner">
          <span className="banner-icon">⚠️</span>
          <span className="banner-text">
            当前记录处于回滚状态 — 点位标签已变更，剖面数据需要重算。
            版本: v{activeMaster?.version} | 结果版本: v{activeResult?.version}
          </span>
          <div className="banner-actions">
            <button className="btn btn-warning btn-sm">🔄 重算剖面</button>
            <button className="btn btn-secondary btn-sm">↩️ 回滚版本</button>
          </div>
        </div>
      )}
      
      {hasErrors && !isRollbackState && (
        <div style={{ 
          background: 'linear-gradient(135deg, #92400e 0%, #78350f 100%)',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '13px',
          color: '#fef3c7',
        }}>
          <span>⚠️</span>
          <span style={{ flex: 1 }}>
            检测到 {activeResult?.errorNotes.filter(e => !e.resolved).length} 个误差备注待处理，请在结果面板中查看详情
          </span>
          <button 
            className="btn btn-sm" 
            style={{ background: '#f59e0b', color: '#1f2937' }}
            onClick={() => setActiveTab('result')}
          >
            查看误差
          </button>
        </div>
      )}
      
      <div className="main-layout">
        <aside className="sidebar">
          <div className="sidebar-section">
            <h3>地形图记录</h3>
            <button className="btn btn-primary btn-sm" style={{ width: '100%' }}>
              + 新建记录
            </button>
          </div>
          <div className="record-list">
            {masters.map(master => (
              <div
                key={master.id}
                className={`record-item ${master.id === activeId ? 'active' : ''}`}
                onClick={() => handleSelectRecord(master.id)}
              >
                <div className="record-name">{master.name}</div>
                <div className="record-meta">
                  <span className={`status-badge status-${master.status}`}>
                    {statusText(master.status)}
                  </span>
                  <span>批次 {master.batchNo}</span>
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                  v{master.version} · {new Date(master.updatedAt).toLocaleDateString('zh-CN')}
                </div>
              </div>
            ))}
          </div>
          
          <div className="sidebar-section">
            <h3>数据结构说明</h3>
            <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.8' }}>
              <div>📋 主记录：手绘地形图基础信息</div>
              <div>✏️ 明细记录：等高线图层数据</div>
              <div>📜 历史记录：山脊/剖面/坡向操作</div>
              <div>🎯 结果记录：图层编辑与导出</div>
            </div>
          </div>
        </aside>
        
        <main className="canvas-area">
          <div className="toolbar">
            <div className="tool-group">
              <button className={`tool-btn ${tool === 'select' ? 'active' : ''}`} onClick={() => setTool('select')}>
                👆 选择
              </button>
              <button className={`tool-btn ${tool === 'contour' ? 'active' : ''}`} onClick={() => setTool('contour')}>
                ✏️ 等高线
              </button>
              <button className={`tool-btn ${tool === 'ridge' ? 'active' : ''}`} onClick={() => setTool('ridge')}>
                🏔️ 山脊
              </button>
              <button className={`tool-btn ${tool === 'profile' ? 'active' : ''}`} onClick={() => setTool('profile')}>
                📏 剖面
              </button>
            </div>
            <div className="tool-group">
              <button className={`tool-btn ${tool === 'label' ? 'active' : ''}`} onClick={() => setTool('label')}>
                🏷️ 点位标签
              </button>
              <button className={`tool-btn ${tool === 'error' ? 'active' : ''}`} onClick={() => setTool('error')}>
                ⚠️ 误差备注
              </button>
            </div>
            <div className="tool-group">
              <button className="tool-btn">🔍+</button>
              <button className="tool-btn">�-</button>
              <button className="tool-btn">⤢ 适应</button>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <span className="tag tag-blue">图层: {activeDetails.length}</span>
              <span className="tag tag-green">标签: {activeResult?.pointLabels.length || 0}</span>
              <span className="tag tag-red">误差: {activeResult?.errorNotes.filter(e => !e.resolved).length || 0}</span>
            </div>
          </div>
          
          <div className="canvas-container">
            {activeMaster ? (
              <MapCanvas
                master={activeMaster}
                details={activeDetails}
                result={activeResult}
                histories={activeHistories}
                activeTool={tool}
              />
            ) : (
              <div className="empty-state">
                <div className="empty-icon" style={{ fontSize: '64px' }}>🗺️</div>
                <div className="empty-text">请选择或创建一个地形图记录</div>
              </div>
            )}
          </div>
        </main>
        
        <aside className="right-panel">
          <div className="panel-tabs">
            <div className={`panel-tab ${activeTab === 'layers' ? 'active' : ''}`} onClick={() => setActiveTab('layers')}>
              图层
            </div>
            <div className={`panel-tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
              信息
            </div>
            <div className={`panel-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
              历史
            </div>
            <div className={`panel-tab ${activeTab === 'result' ? 'active' : ''}`} onClick={() => setActiveTab('result')}>
              结果
            </div>
          </div>
          <div className="panel-content">
            {activeTab === 'layers' && <LayerPanel details={activeDetails} />}
            {activeTab === 'info' && <InfoPanel master={activeMaster} result={activeResult} snapshots={initialSnapshots} />}
            {activeTab === 'history' && <HistoryPanel histories={activeHistories} />}
            {activeTab === 'result' && <ResultPanel result={activeResult} master={activeMaster} />}
          </div>
        </aside>
      </div>
    </div>
  );
}

function statusText(status: string) {
  const map: Record<string, string> = {
    draft: '草稿',
    scaled: '已标定',
    processing: '处理中',
    completed: '已完成',
  };
  return map[status] || status;
}
