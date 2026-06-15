import React from 'react';
import type { DetailRecord, ResultRecord } from '../../shared/types.js';

interface Props {
  details: DetailRecord[];
  result: ResultRecord;
  onToggleLayer?: (layerId: string) => void;
}

export function LayerPanel({ details, result, onToggleLayer }: Props) {
  const layerMap = new Map(result.layers.map(l => [l.layerId, l]));

  return (
    <div className="layer-panel">
      <div className="panel-section">
        <h3 className="panel-title">等高线图层</h3>
        <p className="panel-desc">共 {details.length} 条等高线，可分层显示/隐藏</p>
      </div>

      <div className="layer-list">
        {details.map(detail => {
          const layer = layerMap.get(detail.id);
          const visible = layer ? layer.visible : true;
          const color = layer?.color || detail.color;

          return (
            <div
              key={detail.id}
              className={`layer-item ${visible ? '' : 'hidden'}`}
              onClick={() => onToggleLayer?.(detail.id)}
            >
              <div className="layer-color" style={{ backgroundColor: color }} />
              <div className="layer-info">
                <div className="layer-name">第 {detail.contourIndex} 层</div>
                <div className="layer-elev">高程 {detail.elevation}m</div>
              </div>
              <div className="layer-toggle">
                <input
                  type="checkbox"
                  checked={visible}
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggleLayer?.(detail.id);
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="panel-section">
        <h4 className="panel-subtitle">图例说明</h4>
        <div className="legend-list">
          <div className="legend-item">
            <div className="legend-line contour-line" />
            <span>等高线</span>
          </div>
          <div className="legend-item">
            <div className="legend-line ridge-line" />
            <span>山脊线</span>
          </div>
          <div className="legend-item">
            <div className="legend-line profile-line" />
            <span>剖面线</span>
          </div>
          <div className="legend-item">
            <div className="legend-line aspect-line" />
            <span>坡向箭头</span>
          </div>
        </div>
      </div>

      <div className="panel-section">
        <h4 className="panel-subtitle">图层统计</h4>
        <div className="stat-grid">
          <div className="stat-item">
            <div className="stat-value">{details.length}</div>
            <div className="stat-label">总层数</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{result.layers.filter(l => l.visible).length}</div>
            <div className="stat-label">显示中</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">
              {details.length > 0 ? (Math.max(...details.map(d => d.elevation)) - Math.min(...details.map(d => d.elevation))) : 0}m
            </div>
            <div className="stat-label">高差</div>
          </div>
        </div>
      </div>
    </div>
  );
}
