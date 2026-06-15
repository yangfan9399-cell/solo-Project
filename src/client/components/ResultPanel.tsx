import React, { useState } from 'react';
import type { ResultRecord, ErrorNote } from '../../shared/types.js';
import { ProfileChart } from './ProfileChart.js';

type TabType = 'labels' | 'errors' | 'export';

interface Props {
  result: ResultRecord;
  onToggleError: (id: string) => void;
  onExportImage?: () => void;
  onExportData?: () => void;
}

export function ResultPanel({ result, onToggleError, onExportImage, onExportData }: Props) {
  const [tab, setTab] = useState<TabType>('labels');

  const unresolvedHigh = result.errorNotes.filter(n => n.severity === 'high' && !n.resolved).length;
  const unresolvedCount = result.errorNotes.filter(n => !n.resolved).length;

  const statusLabels: Record<string, string> = {
    pending: '待处理',
    ready: '就绪',
    exported: '已导出',
    rolled_back: '已回滚',
  };

  function getSeverityLabel(s: string) {
    const map: Record<string, { text: string; className: string }> = {
      high: { text: '高', className: 'sev-high' },
      medium: { text: '中', className: 'sev-medium' },
      low: { text: '低', className: 'sev-low' },
    };
    return map[s] || { text: s, className: '' };
  }

  function getTypeLabel(t: string) {
    const map: Record<string, string> = {
      elevation: '高程',
      landmark: '地标',
      annotation: '注释',
    };
    return map[t] || t;
  }

  return (
    <div className="result-panel">
      <div className="panel-section">
        <div className="result-header">
          <h3 className="panel-title">结果记录</h3>
          <span className={`status-badge status-${result.status}`}>
            {statusLabels[result.status] || result.status}
          </span>
        </div>
        <div className="result-version">结果版本: v{result.version}</div>
      </div>

      <div className="sub-tab-bar">
        {(['labels', 'errors', 'export'] as TabType[]).map(t => (
          <button
            key={t}
            className={`sub-tab-btn ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'labels' && `点位标签 (${result.pointLabels.length})`}
            {t === 'errors' && `误差备注 (${unresolvedCount}/${result.errorNotes.length})`}
            {t === 'export' && '导出'}
          </button>
        ))}
      </div>

      <div className="sub-tab-content">
        {tab === 'labels' && (
          <div className="labels-list">
            {result.pointLabels.length === 0 ? (
              <p className="empty-text">暂无标签</p>
            ) : (
              result.pointLabels.map(label => (
                <div key={label.id} className="label-item">
                  <div className={`label-type type-${label.type}`}>
                    {getTypeLabel(label.type)}
                  </div>
                  <div className="label-info">
                    <div className="label-text">{label.text}</div>
                    {label.elevation !== undefined && (
                      <div className="label-elev">{label.elevation}m</div>
                    )}
                    <div className="label-pos">
                      ({label.x}, {label.y})
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'errors' && (
          <div className="errors-list">
            {unresolvedHigh > 0 && (
              <div className="error-alert">
                <span>⚠ {unresolvedHigh} 个高优先级误差待处理</span>
              </div>
            )}
            {result.errorNotes.length === 0 ? (
              <p className="empty-text">暂无误差备注</p>
            ) : (
              result.errorNotes.map(note => {
                const sev = getSeverityLabel(note.severity);
                return (
                  <div
                    key={note.id}
                    className={`error-item ${note.resolved ? 'resolved' : ''}`}
                  >
                    <div className={`error-severity ${sev.className}`}>
                      {sev.text}
                    </div>
                    <div className="error-content">
                      <div className="error-message">{note.message}</div>
                      <div className="error-pos">
                        位置: ({note.x}, {note.y})
                      </div>
                    </div>
                    <button
                      className="btn-tiny"
                      onClick={() => onToggleError(note.id)}
                    >
                      {note.resolved ? '重开' : '解决'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === 'export' && (
          <div className="export-section">
            <div className="export-preview">
              <h4 className="panel-subtitle">导出预览</h4>
              <ProfileChart result={result} />
            </div>

            <div className="export-info">
              <div className="info-row">
                <span className="info-label">导出格式</span>
                <span className="info-value">PNG / SVG</span>
              </div>
              <div className="info-row">
                <span className="info-label">包含内容</span>
                <span className="info-value">
                  {result.layers.filter(l => l.visible).length} 个图层 · 
                  {result.pointLabels.length} 个标签
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">结果状态</span>
                <span className="info-value">{statusLabels[result.status]}</span>
              </div>
            </div>

            <div className="export-actions">
              <button
                className="btn-primary"
                disabled={result.status === 'rolled_back'}
                onClick={onExportImage}
              >
                导出图片
              </button>
              <button
                className="btn-secondary"
                onClick={onExportData}
              >
                导出数据
              </button>
            </div>

            {result.status === 'rolled_back' && (
              <div className="rollback-notice">
                ⚠ 此结果为回滚版本，请重新校验后再导出
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
