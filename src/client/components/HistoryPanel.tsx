import React, { useState } from 'react';
import type { HistoryRecord, RidgeData, ProfileData, AspectData } from '../../shared/types.js';

type FilterType = 'all' | 'ridge' | 'profile' | 'aspect';

interface Props { histories: HistoryRecord[]; }

export function HistoryPanel(props: Props) {
  const histories = props.histories;
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = filter === 'all' ? histories : histories.filter(function(h) { return h.type === filter; });

  const typeLabels: Record<string, string> = { ridge: '山脊线', profile: '剖面图', aspect: '坡向' };
  const typeColors: Record<string, string> = { ridge: 'timeline-ridge', profile: 'timeline-profile', aspect: 'timeline-aspect' };
  const filterLabels: Record<FilterType, string> = { all: '全部', ridge: '山脊', profile: '剖面', aspect: '坡向' };

  function formatTime(iso: string) {
    return new Date(iso).toLocaleString('zh-CN', {
      month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  }

  function getHistorySummary(h: HistoryRecord): string {
    if (h.type === 'ridge') {
      const data = h.data as RidgeData;
      return data.name + ' \u00B7 ' + data.points.length + ' 个点位';
    }
    if (h.type === 'profile') {
      const data = h.data as ProfileData;
      return data.name + ' \u00B7 ' + data.totalDistance.toFixed(0) + 'm';
    }
    if (h.type === 'aspect') {
      const data = h.data as AspectData;
      return data.direction + '\u00B0 \u00B7 坡度 ' + data.slope + '\u00B0';
    }
    return '';
  }

  const filterBtns = (['all', 'ridge', 'profile', 'aspect'] as FilterType[]).map(function(f) {
    return React.createElement('button', {
      key: f,
      className: 'filter-btn' + (filter === f ? ' active' : ''),
      onClick: function() { setFilter(f); },
    }, filterLabels[f]);
  });

  const timelineChildren = filtered.length === 0
    ? React.createElement('p', { className: 'empty-text' }, '暂无记录')
    : filtered.map(function(h) {
        return React.createElement('div', { key: h.id, className: 'timeline-item' },
          React.createElement('div', { className: 'timeline-dot ' + (typeColors[h.type] || '') }),
          React.createElement('div', { className: 'timeline-content' },
            React.createElement('div', { className: 'timeline-header' },
              React.createElement('span', { className: 'timeline-type' }, typeLabels[h.type] || h.type),
              React.createElement('span', { className: 'timeline-version' }, 'v' + h.version)
            ),
            React.createElement('div', { className: 'timeline-summary' }, getHistorySummary(h)),
            React.createElement('div', { className: 'timeline-footer' },
              React.createElement('span', { className: 'timeline-operator' }, h.operator),
              React.createElement('span', { className: 'timeline-time' }, formatTime(h.createdAt))
            ),
            h.remark ? React.createElement('div', { className: 'timeline-remark' }, '备注: ' + h.remark) : null
          )
        );
      });

  return React.createElement('div', { className: 'history-panel' },
    React.createElement('div', { className: 'panel-section' },
      React.createElement('h3', { className: 'panel-title' }, '历史记录'),
      React.createElement('p', { className: 'panel-desc' }, '共 ' + histories.length + ' 条操作记录')
    ),
    React.createElement('div', { className: 'filter-bar' }, filterBtns),
    React.createElement('div', { className: 'timeline' }, timelineChildren)
  );
}
