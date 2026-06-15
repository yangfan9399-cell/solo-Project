import { useState } from "react";
import type { ResultRecord, MasterRecord } from "~/types";

interface ResultPanelProps {
  result: ResultRecord | null;
  master: MasterRecord | null;
}

export default function ResultPanel({ result, master }: ResultPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'labels' | 'errors' | 'export'>('labels');
  
  if (!result) {
    return (
      <div className="empty-state" style={{ padding: '20px' }}>
        <div className="empty-text" style={{ fontSize: '12px' }}>暂无结果记录</div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="info-block">
        <div className="version-info">
          <div className="version-label">结果版本</div>
          <div className="version-number">v{result.version}</div>
          <div className="version-time">
            状态: <span className={`status-badge status-${result.status === 'exported' ? 'completed' : result.status === 'rollback' ? 'processing' : 'draft'}`}>
              {resultStatusText(result.status)}
            </span>
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', borderBottom: '1px solid #334155', marginBottom: '12px' }}>
        {[
          { key: 'labels', label: `点位 (${result.pointLabels.length})` },
          { key: 'errors', label: `误差 (${result.errorNotes.filter(e => !e.resolved).length})` },
          { key: 'export', label: '导出' },
        ].map(tab => (
          <div
            key={tab.key}
            style={{
              flex: 1,
              padding: '8px',
              textAlign: 'center',
              cursor: 'pointer',
              fontSize: '12px',
              color: activeSubTab === tab.key ? '#0ea5e9' : '#94a3b8',
              borderBottom: `2px solid ${activeSubTab === tab.key ? '#0ea5e9' : 'transparent'}`,
            }}
            onClick={() => setActiveSubTab(tab.key as any)}
          >
            {tab.label}
          </div>
        ))}
      </div>
      
      {activeSubTab === 'labels' && (
        <div>
          {result.pointLabels.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px' }}>
              <div className="empty-text" style={{ fontSize: '12px' }}>暂无点位标签</div>
            </div>
          ) : (
            result.pointLabels.map(label => (
              <div key={label.id} className="point-label-item">
                <div className="label-icon">
                  {label.type === 'elevation' ? '📍' : label.type === 'landmark' ? '🏔️' : '📝'}
                </div>
                <div className="label-text">{label.text}</div>
                {label.elevation && (
                  <div className="label-elev">{label.elevation}m</div>
                )}
              </div>
            ))
          )}
          <button className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: '8px', justifyContent: 'center' }}>
            + 添加点位标签
          </button>
        </div>
      )}
      
      {activeSubTab === 'errors' && (
        <div>
          {result.errorNotes.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px' }}>
              <div className="empty-text" style={{ fontSize: '12px' }}>暂无误差备注</div>
            </div>
          ) : (
            result.errorNotes.map(note => (
              <div key={note.id} className={`error-note ${note.severity}`}>
                <div className="error-title">
                  {note.severity === 'high' ? '🔴 ' : note.severity === 'medium' ? '🟡 ' : '🔵 '}
                  {severityText(note.severity)}
                  {note.resolved && ' ✓ 已解决'}
                </div>
                <div className="error-message">{note.message}</div>
                <div className="error-actions">
                  <button className="btn btn-sm btn-secondary">查看</button>
                  {!note.resolved && (
                    <button className="btn btn-sm btn-success">标记解决</button>
                  )}
                </div>
              </div>
            ))
          )}
          <button className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: '8px', justifyContent: 'center' }}>
            + 添加误差备注
          </button>
        </div>
      )}
      
      {activeSubTab === 'export' && (
        <div>
          <div className="export-preview">
            {result.exportImageUrl ? (
              <div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>
                  最近导出: {result.exportAt ? new Date(result.exportAt).toLocaleString('zh-CN') : '未知'}
                </div>
                <div 
                  style={{ 
                    width: '100%', 
                    height: '120px', 
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748b',
                    fontSize: '12px'
                  }}
                >
                  📷 导出预览图
                </div>
              </div>
            ) : (
              <div style={{ color: '#64748b', fontSize: '12px' }}>
                尚未导出
              </div>
            )}
          </div>
          
          <div className="info-block">
            <h4>导出设置</h4>
            <div className="info-row">
              <span className="label">格式</span>
              <span className="value">PNG / SVG / PDF</span>
            </div>
            <div className="info-row">
              <span className="label">分辨率</span>
              <span className="value">高 (2x)</span>
            </div>
            <div className="info-row">
              <span className="label">包含图层</span>
              <span className="value">全部可见</span>
            </div>
          </div>
          
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            📤 导出图片
          </button>
          
          {result.status === 'rollback' && (
            <div style={{ marginTop: '12px' }}>
              <button className="btn btn-warning" style={{ width: '100%', justifyContent: 'center' }}>
                🔄 重算并重新导出
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function resultStatusText(status: string) {
  const map: Record<string, string> = {
    editing: '编辑中',
    exported: '已导出',
    rollback: '已回滚',
    recalculate: '待重算',
  };
  return map[status] || status;
}

function severityText(severity: string) {
  const map: Record<string, string> = {
    high: '高风险误差',
    medium: '中等误差',
    low: '低风险误差',
  };
  return map[severity] || severity;
}
