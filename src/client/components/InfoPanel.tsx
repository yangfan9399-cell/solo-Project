import React from 'react';
import type { MasterRecord, Snapshot } from '../../shared/types.js';

interface Props {
  master: MasterRecord;
  snapshots: Snapshot[];
  onCreateSnapshot: () => void;
  onRestoreSnapshot: (id: string) => void;
}

export function InfoPanel({ master, snapshots, onCreateSnapshot, onRestoreSnapshot }: Props) {
  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const statusLabels: Record<string, string> = {
    draft: '草稿',
    processing: '处理中',
    completed: '已完成',
    error: '异常',
  };

  return (
    <div className="info-panel">
      <div className="panel-section">
        <h3 className="panel-title">基本信息</h3>
        <div className="info-grid">
          <div className="info-row">
            <span className="info-label">记录名称</span>
            <span className="info-value">{master.name}</span>
          </div>
          <div className="info-row">
            <span className="info-label">批次编号</span>
            <span className="info-value mono">{master.batch}</span>
          </div>
          <div className="info-row">
            <span className="info-label">当前版本</span>
            <span className="info-value version">v{master.version}</span>
          </div>
          <div className="info-row">
            <span className="info-label">地形类型</span>
            <span className="info-value">{master.terrainType}</span>
          </div>
          <div className="info-row">
            <span className="info-label">状态</span>
            <span className={`status-badge status-${master.status}`}>
              {statusLabels[master.status] || master.status}
            </span>
          </div>
        </div>
      </div>

      <div className="panel-section">
        <h4 className="panel-subtitle">比例尺</h4>
        <div className="info-grid">
          <div className="info-row">
            <span className="info-label">比例</span>
            <span className="info-value mono">1:{master.scale}</span>
          </div>
          <div className="info-row">
            <span className="info-label">单位</span>
            <span className="info-value">{master.scaleUnit}</span>
          </div>
          <div className="info-row">
            <span className="info-label">底图尺寸</span>
            <span className="info-value mono">{master.mapWidth} × {master.mapHeight}</span>
          </div>
        </div>
      </div>

      <div className="panel-section">
        <h4 className="panel-subtitle">描述</h4>
        <p className="description">{master.description}</p>
      </div>

      <div className="panel-section">
        <h4 className="panel-subtitle">时间</h4>
        <div className="info-grid">
          <div className="info-row">
            <span className="info-label">创建时间</span>
            <span className="info-value">{formatDate(master.createdAt)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">更新时间</span>
            <span className="info-value">{formatDate(master.updatedAt)}</span>
          </div>
        </div>
      </div>

      <div className="panel-section">
        <div className="section-header">
          <h4 className="panel-subtitle">版本快照</h4>
          <button className="btn-small" onClick={onCreateSnapshot}>新建</button>
        </div>
        {snapshots.length === 0 ? (
          <p className="empty-text">暂无快照</p>
        ) : (
          <div className="snapshot-list">
            {snapshots.map(s => (
              <div key={s.id} className="snapshot-item">
                <div className="snapshot-info">
                  <div className="snapshot-name">{s.name}</div>
                  <div className="snapshot-version">v{s.version}</div>
                </div>
                <button
                  className="btn-tiny"
                  onClick={() => onRestoreSnapshot(s.id)}
                  title="恢复到此版本"
                >
                  回滚
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
