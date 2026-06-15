import type { DetailRecord } from "~/types";

interface LayerPanelProps {
  details: DetailRecord[];
}

export default function LayerPanel({ details }: LayerPanelProps) {
  return (
    <div>
      <div className="info-block">
        <h4>等高线图层 ({details.length})</h4>
        {details.length === 0 ? (
          <div className="empty-state" style={{ padding: '20px' }}>
            <div className="empty-text" style={{ fontSize: '12px' }}>暂无等高线图层</div>
          </div>
        ) : (
          details.map(detail => (
            <div key={detail.id} className="layer-item">
              <div
                className="layer-color"
                style={{ backgroundColor: detail.color }}
              ></div>
              <div className="layer-name">{detail.layerName}</div>
              <div className="layer-actions">
                <button
                  className={`layer-toggle ${!detail.isVisible ? 'off' : ''}`}
                  title={detail.isVisible ? '隐藏' : '显示'}
                >
                  {detail.isVisible ? '👁' : '👁‍🗨'}
                </button>
                <button className="layer-toggle" title="编辑">
                  ✏️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="info-block">
        <h4>图层操作</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button className="btn btn-secondary btn-sm" style={{ justifyContent: 'center' }}>
            + 添加等高线
          </button>
          <button className="btn btn-secondary btn-sm" style={{ justifyContent: 'center' }}>
            📊 自动生成
          </button>
          <button className="btn btn-secondary btn-sm" style={{ justifyContent: 'center' }}>
            🔄 全部显示
          </button>
          <button className="btn btn-secondary btn-sm" style={{ justifyContent: 'center' }}>
            🚫 全部隐藏
          </button>
        </div>
      </div>
      
      <div className="info-block">
        <h4>图例说明</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '3px', background: '#92400e' }}></div>
            <span style={{ color: '#94a3b8' }}>山脊线</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '2px', background: '#10b981', borderStyle: 'dashed' }}></div>
            <span style={{ color: '#94a3b8' }}>剖面线</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#0ea5e9' }}></div>
            <span style={{ color: '#94a3b8' }}>点位标签</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#dc2626' }}></div>
            <span style={{ color: '#94a3b8' }}>误差标记</span>
          </div>
        </div>
      </div>
    </div>
  );
}
