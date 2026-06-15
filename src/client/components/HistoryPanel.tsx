import React, { useState } from 'react';
import type { HistoryRecord, RidgeData, ProfileData, AspectData } from '../../shared/types.js';

type FilterType = 'all' | 'ridge' | 'profile' | 'aspect';

interface Props {
  histories: HistoryRecord[];
}

export function HistoryPanel({ histories }: Props) {
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = filter === 'all'
    ? histories
    : histories.filter(h => h.type === filter);

  const typeLabels: Record<string, string> = {
    ridge: '山脊线',
    profile: '剖面图',
    aspect: '坡向',
  };

  const typeColors: Record<string, string> = {
    ridge: 'timeline-ridge',
    profile: 'timeline-profile',
    aspect: 'timeline-aspect',
  };

  function formatTime(iso: string) {
    return new Date(iso).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  function getHistorySummary(h: HistoryRecord): string {
    if (h.type === 'ridge') {
      const data = h.data as RidgeData;
      return `${data.name} · ${data.points.length} 个点位`;
    }
    if (h.type === 'profile') {
      const data = h.data as ProfileData;
      return `${data.name} · ${data.totalDistance.toFixed(0)}m`;
    }
    if (h.type === 'aspect') {
      const data = h.data as AspectData;
      return `${data.direction}° · 坡度 ${data.slope}°`;
    }
    return '';
  }

  return (
    <div className="history-panel">
      <div className="panel-section">
        <h3 className="panel-title">历史记录</h3>
        <p className="panel-desc">共 {histories.length} 条操作记录</p>
      </div>

      <div className="filter-bar">
        {(['all', 'ridge', 'profile', 'aspect'] as FilterType[]).map(f => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? '全部' : typeLabels[f]}
          </button>
        ))}
      </div>

      <div className="timeline">
        {filtered.length === 0 ? (
          <p className="empty-text">暂无记录</p>
        ) : (
          filtered.map(h => (
            <div key={h.id} className="timeline-item">
              <div className={`timeline-dot ${typeColors[h.type]}`} />
              <div className="timeline-content">
                <div className="timeline-header">
                  <span className="timeline-type">{typeLabels[h.type]}</span>
                  <span className="timeline-version">v{h.version}</span>
                </div>
                <div className="timeline-summary">{getHistorySummary(h)}</div>
                <div className="timeline-footer">
                  <span className="timeline-operator">{h.operator}</span>
                  <span className="timeline-time">{formatTime(h.createdAt)}</span>
                </div>
                {h.remark && (
                  <div className="timeline-remark">备注: {h.remark}</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
