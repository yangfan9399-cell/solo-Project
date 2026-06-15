import type { MasterRecord, ResultRecord } from "~/types";

interface InfoPanelProps {
  master: MasterRecord | null;
  result: ResultRecord | null;
  snapshots?: any[];
}

export default function InfoPanel({ master, result, snapshots = [] }: InfoPanelProps) {
  if (!master) {
    return (
      <div className="empty-state" style={{ padding: '20px' }}>
        <div className="empty-text" style={{ fontSize: '12px' }}>请选择记录</div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="version-info">
        <div className="version-label">当前版本</div>
        <div className="version-number">v{master.version}</div>
        <div className="version-time">更新于 {new Date(master.updatedAt).toLocaleString('zh-CN')}</div>
      </div>
      
      <div className="info-block">
        <h4>基本信息</h4>
        <div className="info-row">
          <span className="label">名称</span>
          <span className="value">{master.name}</span>
        </div>
        <div className="info-row">
          <span className="label">批次号</span>
          <span className="value">{master.batchNo}</span>
        </div>
        <div className="info-row">
          <span className="label">状态</span>
          <span className={`status-badge status-${master.status}`}>
            {statusText(master.status)}
          </span>
        </div>
        <div className="info-row">
          <span className="label">尺寸</span>
          <span className="value">{master.mapWidth} × {master.mapHeight} px</span>
        </div>
      </div>
      
      <div className="info-block">
        <h4>比例尺</h4>
        <div className="info-row">
          <span className="label">图上距离</span>
          <span className="value">{master.scaleBarLength} px</span>
        </div>
        <div className="info-row">
          <span className="label">实际距离</span>
          <span className="value">{master.scaleBarRealDistance} {master.scaleUnit}</span>
        </div>
        <div className="info-row">
          <span className="label">比例尺</span>
          <span className="value">
            {master.scaleBarRealDistance > 0 
              ? `1 : ${((master.scaleBarRealDistance * 100) / master.scaleBarLength).toFixed(0)}`
              : '未标定'}
          </span>
        </div>
      </div>
      
      <div className="info-block">
        <h4>数据统计</h4>
        <div className="info-row">
          <span className="label">等高线层数</span>
          <span className="value">{result?.layerEdits?.length || 0} 条</span>
        </div>
        <div className="info-row">
          <span className="label">点位标签</span>
          <span className="value">{result?.pointLabels?.length || 0} 个</span>
        </div>
        <div className="info-row">
          <span className="label">误差备注</span>
          <span className="value">
            <span className="tag tag-red">
              {result?.errorNotes?.filter(e => !e.resolved).length || 0} 待处理
            </span>
          </span>
        </div>
        <div className="info-row">
          <span className="label">结果版本</span>
          <span className="value">v{result?.version || 1}</span>
        </div>
      </div>
      
      <div className="info-block">
        <h4>描述</h4>
        <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.6' }}>
          {master.description || '暂无描述'}
        </p>
      </div>
      
      {snapshots.length > 0 && (
        <div className="info-block">
          <h4>版本快照 ({snapshots.length})</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {snapshots.map((snap, idx) => (
              <div 
                key={snap.id} 
                style={{ 
                  padding: '8px 10px', 
                  background: '#334155', 
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#f1f5f9', fontWeight: 500 }}>
                    v{snap.version}
                  </span>
                  <span className="tag tag-blue">快照</span>
                </div>
                <div style={{ color: '#94a3b8', fontSize: '11px' }}>
                  {snap.remark}
                </div>
                <div style={{ color: '#64748b', fontSize: '10px', marginTop: '4px' }}>
                  {new Date(snap.createdAt).toLocaleString('zh-CN')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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
