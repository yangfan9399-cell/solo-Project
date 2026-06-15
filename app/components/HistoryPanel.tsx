import { useState } from "react";
import type { HistoryRecord } from "~/types";

interface HistoryPanelProps {
  histories: HistoryRecord[];
}

export default function HistoryPanel({ histories }: HistoryPanelProps) {
  const [selectedType, setSelectedType] = useState<string>('all');
  
  const filtered = selectedType === 'all' 
    ? histories 
    : histories.filter(h => h.type === selectedType);
  
  return (
    <div>
      <div className="info-block">
        <h4>历史记录类型</h4>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {['all', 'ridge', 'profile', 'aspect'].map(type => (
            <button
              key={type}
              className={`btn btn-sm ${selectedType === type ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedType(type)}
            >
              {typeText(type)}
            </button>
          ))}
        </div>
      </div>
      
      <div className="info-block">
        <h4>历史操作 ({filtered.length})</h4>
        
        {filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: '20px' }}>
            <div className="empty-text" style={{ fontSize: '12px' }}>暂无历史记录</div>
          </div>
        ) : (
          <div className="timeline">
            {filtered.map(history => (
              <div key={history.id} className="timeline-item">
                <div className="time">
                  {new Date(history.createdAt).toLocaleString('zh-CN')}
                </div>
                <div className="event" style={{ fontWeight: 500, marginBottom: '4px' }}>
                  <span className={`tag tag-${typeColor(history.type)}`}>
                    {typeText(history.type)}
                  </span>
                  {' '}{history.name}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  操作人: {history.operator}
                </div>
                {history.remark && (
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                    备注: {history.remark}
                  </div>
                )}
                {history.type === 'profile' && (history.data as any).status && (
                  <div style={{ marginTop: '6px' }}>
                    <span className={`tag ${(history.data as any).status === 'success' ? 'tag-green' : (history.data as any).status === 'error' ? 'tag-red' : 'tag-yellow'}`}>
                      状态: {statusText((history.data as any).status)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function typeText(type: string) {
  const map: Record<string, string> = {
    all: '全部',
    ridge: '山脊',
    profile: '剖面',
    aspect: '坡向',
  };
  return map[type] || type;
}

function typeColor(type: string) {
  const map: Record<string, string> = {
    ridge: 'yellow',
    profile: 'green',
    aspect: 'blue',
  };
  return map[type] || 'blue';
}

function statusText(status: string) {
  const map: Record<string, string> = {
    success: '成功',
    error: '异常',
    rollback: '待重算',
  };
  return map[status] || status;
}
