import React from 'react';
import type { DetailRecord, ResultRecord } from '../../shared/types.js';

interface Props {
  details: DetailRecord[];
  result: ResultRecord;
  onToggleLayer?: (layerId: string) => void;
}

export function LayerPanel(props: Props) {
  const details = props.details;
  const result = props.result;
  const onToggleLayer = props.onToggleLayer;
  const layerMap = new Map(result.layers.map(function(l) { return [l.layerId, l]; }));

  const layerChildren = details.map(function(detail) {
    const layer = layerMap.get(detail.id);
    const visible = layer ? layer.visible : true;
    const color = (layer && layer.color) ? layer.color : detail.color;
    return React.createElement('div', {
      key: detail.id,
      className: 'layer-item' + (visible ? '' : ' hidden'),
      onClick: function() { if (onToggleLayer) onToggleLayer(detail.id); },
    },
      React.createElement('div', { className: 'layer-color', style: { backgroundColor: color } }),
      React.createElement('div', { className: 'layer-info' },
        React.createElement('div', { className: 'layer-name' }, '第 ' + detail.contourIndex + ' 层'),
        React.createElement('div', { className: 'layer-elev' }, '高程 ' + detail.elevation + 'm')
      ),
      React.createElement('div', { className: 'layer-toggle' },
        React.createElement('input', {
          type: 'checkbox',
          checked: visible,
          onChange: function(e: React.ChangeEvent<HTMLInputElement>) {
            e.stopPropagation();
            if (onToggleLayer) onToggleLayer(detail.id);
          },
        })
      )
    );
  });

  const maxElev = details.length > 0 ? Math.max.apply(null, details.map(function(d) { return d.elevation; })) : 0;
  const minElev = details.length > 0 ? Math.min.apply(null, details.map(function(d) { return d.elevation; })) : 0;
  const elevDiff = Math.max(0, maxElev - minElev);
  const visibleCount = result.layers.filter(function(l) { return l.visible; }).length;

  return React.createElement('div', { className: 'layer-panel' },
    React.createElement('div', { className: 'panel-section' },
      React.createElement('h3', { className: 'panel-title' }, '等高线图层'),
      React.createElement('p', { className: 'panel-desc' }, '共 ' + details.length + ' 条等高线，可分层显示/隐藏')
    ),
    React.createElement('div', { className: 'layer-list' }, layerChildren),
    React.createElement('div', { className: 'panel-section' },
      React.createElement('h4', { className: 'panel-subtitle' }, '图例说明'),
      React.createElement('div', { className: 'legend-list' },
        React.createElement('div', { className: 'legend-item' },
          React.createElement('div', { className: 'legend-line contour-line' }),
          React.createElement('span', null, '等高线')
        ),
        React.createElement('div', { className: 'legend-item' },
          React.createElement('div', { className: 'legend-line ridge-line' }),
          React.createElement('span', null, '山脊线')
        ),
        React.createElement('div', { className: 'legend-item' },
          React.createElement('div', { className: 'legend-line profile-line' }),
          React.createElement('span', null, '剖面线')
        ),
        React.createElement('div', { className: 'legend-item' },
          React.createElement('div', { className: 'legend-line aspect-line' }),
          React.createElement('span', null, '坡向箭头')
        )
      )
    ),
    React.createElement('div', { className: 'panel-section' },
      React.createElement('h4', { className: 'panel-subtitle' }, '图层统计'),
      React.createElement('div', { className: 'stat-grid' },
        React.createElement('div', { className: 'stat-item' },
          React.createElement('div', { className: 'stat-value' }, String(details.length)),
          React.createElement('div', { className: 'stat-label' }, '总层数')
        ),
        React.createElement('div', { className: 'stat-item' },
          React.createElement('div', { className: 'stat-value' }, String(visibleCount)),
          React.createElement('div', { className: 'stat-label' }, '显示中')
        ),
        React.createElement('div', { className: 'stat-item' },
          React.createElement('div', { className: 'stat-value' }, elevDiff + 'm'),
          React.createElement('div', { className: 'stat-label' }, '高差')
        )
      )
    )
  );
}
