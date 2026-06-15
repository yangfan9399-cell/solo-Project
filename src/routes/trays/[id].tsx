import { createSignal, onMount, For, Show } from "solid-js";
import { useNavigate, useParams } from "@solidjs/router";

interface Slot {
  id: number;
  tray_id: string;
  row: number;
  col: number;
  character: string | null;
  status: string;
  wear_level: number;
  version: number;
  created_at: string;
  updated_at: string;
  task_title?: string;
  carve_batch?: string;
}

interface HistoryItem {
  id: number;
  tray_id: string;
  slot_id: number;
  character: string | null;
  old_status: string;
  new_status: string;
  action_type: string;
  operator: string;
  timestamp: string;
  batch_no: string | null;
  task_id: number | null;
  notes: string | null;
}

export default function TrayDetail() {
  const params = useParams();
  const navigate = useNavigate();
  const trayId = () => params.id;
  
  const [slots, setSlots] = createSignal<Slot[]>([]);
  const [stats, setStats] = createSignal<any>({});
  const [selectedSlot, setSelectedSlot] = createSignal<Slot | null>(null);
  const [history, setHistory] = createSignal<HistoryItem[]>([]);
  const [isAbnormalSample, setIsAbnormalSample] = createSignal(false);

  onMount(() => {
    loadTrayData();
    checkAbnormalSample();
  });

  function checkAbnormalSample() {
    setIsAbnormalSample(trayId() === 'TRAY-A01');
  }

  async function loadTrayData() {
    const res = await fetch(`/api/trays/${trayId()}`);
    const data = await res.json();
    setSlots(data.slots);
    setStats(data.stats);
  }

  async function loadSlotHistory(slotId: number) {
    const res = await fetch(`/api/history?slot_id=${slotId}`);
    const data = await res.json();
    setHistory(data);
  }

  function onSlotClick(slot: Slot) {
    setSelectedSlot(slot);
    loadSlotHistory(slot.id);
  }

  function getWearClass(wear: number) {
    if (wear < 30) return 'wear-low';
    if (wear < 70) return 'wear-medium';
    return 'wear-high';
  }

  function getRows() {
    const rows: Slot[][] = [];
    const slotArr = slots();
    for (const slot of slotArr) {
      if (!rows[slot.row]) rows[slot.row] = [];
      rows[slot.row][slot.col] = slot;
    }
    return rows;
  }

  const actionLabels: Record<string, string> = {
    'inventory_check': '盘点检查',
    'wear_check': '磨损检查',
    'carve_assign': '分配补刻',
    'carve_complete': '补刻完成',
    'rollback': '回滚操作',
    'status_update': '状态更新'
  };

  const statusLabels: Record<string, string> = {
    'normal': '正常',
    'missing': '缺字',
    'worn': '磨损',
    'reserved': '预留'
  };

  return (
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <div>
          <button class="btn btn-outline btn-sm" onClick={() => navigate('/trays')}>
            ← 返回字盘列表
          </button>
        </div>
      </div>

      <h2 class="page-title">字盘 {trayId()}</h2>
      <p class="page-subtitle">查看字盘格位分布、详细状态和历史变更记录</p>

      <Show when={isAbnormalSample()}>
        <div class="sample-section">
          <div class="sample-title">
            <span>⚠️</span>
            <span>样本二：木活字字盘缺字盘点系统触发异常</span>
            <span class="sample-tag">异常场景</span>
          </div>
          <p class="sample-desc">
            当前字盘 TRAY-A01 展示了一个典型的盘点异常场景：
          </p>
          <div class="before-after">
            <div class="before-col">
              <h4>异常点 1：状态冲突</h4>
              <p>字「字」(第1行第6列) 状态为缺字，但已被分配到补刻批次 BATCH-2024-01，
              状态变更为「预留」过程中存在中间状态不一致。</p>
            </div>
            <div class="after-col">
              <h4>异常点 2：磨损阈值</h4>
              <p>字「盘」(第1行第4列) 磨损度达85%，超过80%预警阈值，
              系统自动标记为磨损状态并生成预警通知。</p>
            </div>
          </div>
          <p style="font-size: 12px; color: #666; margin-top: 8px;">
            💡 点击格位可查看该字的历史变更轨迹，追踪状态变化过程。
          </p>
        </div>
      </Show>

      <div class="layout-2col">
        <div>
          <div class="card">
            <div class="card-title">
              <span>🔍</span>
              <span>格位视图</span>
              <span style="margin-left: auto; font-size: 12px; font-weight: normal; color: #666;">
                点击格位查看详情
              </span>
            </div>
            
            <div class="tray-container">
              <For each={getRows()}>
                {(row, rowIdx) => (
                  <div 
                    class="tray-grid" 
                    style={{ 
                      gridTemplateColumns: `repeat(${row.length}, 56px)`,
                      marginBottom: '4px'
                    }}
                  >
                    <For each={row}>
                      {(slot) => (
                        <div 
                          class={`slot ${slot.status}`}
                          onClick={() => onSlotClick(slot)}
                        >
                          <span class="slot-pos">{slot.row + 1}-{slot.col + 1}</span>
                          <Show when={slot.character} fallback={<span class="slot-empty">○</span>}>
                            <span class="slot-char">{slot.character}</span>
                          </Show>
                          <Show when={slot.status === 'worn'}>
                            <span class={`slot-wear ${getWearClass(slot.wear_level)}`}>
                              {slot.wear_level}%
                            </span>
                          </Show>
                          <span class="slot-status">{statusLabels[slot.status]}</span>
                        </div>
                      )}
                    </For>
                  </div>
                )}
              </For>
            </div>

            <div style="display: flex; gap: 16px; margin-top: 16px; padding-top: 16px; border-top: 1px solid #eee; font-size: 12px;">
              <span class="tray-stat"><span class="dot normal"></span>正常</span>
              <span class="tray-stat"><span class="dot missing"></span>缺字</span>
              <span class="tray-stat"><span class="dot worn"></span>磨损</span>
              <span class="tray-stat"><span class="dot reserved"></span>预留(补刻中)</span>
            </div>
          </div>
        </div>

        <div>
          <div class="detail-panel">
            <h3>📊 字盘统计</h3>
            <div class="detail-row">
              <span class="detail-label">总格位数</span>
              <span class="detail-value">{stats().total || 0}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">正常可用</span>
              <span class="detail-value" style="color: var(--color-success);">{stats().normal || 0}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">缺字</span>
              <span class="detail-value" style="color: var(--color-danger);">{stats().missing || 0}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">磨损</span>
              <span class="detail-value" style="color: var(--color-warning);">{stats().worn || 0}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">预留</span>
              <span class="detail-value" style="color: var(--color-info);">{stats().reserved || 0}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">平均磨损度</span>
              <span class="detail-value">{Math.round(stats().avg_wear || 0)}%</span>
            </div>
          </div>

          <Show when={selectedSlot()}>
            <div class="detail-panel" style="margin-top: 20px;">
              <h3>🔤 格位详情</h3>
              <div class="detail-row">
                <span class="detail-label">位置</span>
                <span class="detail-value">{selectedSlot()!.tray_id} 第{selectedSlot()!.row + 1}行第{selectedSlot()!.col + 1}列</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">字符</span>
                <span class="detail-value" style="font-size: 24px;">{selectedSlot()!.character || '(空)'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">状态</span>
                <span class={`badge badge-${selectedSlot()!.status}`}>{statusLabels[selectedSlot()!.status]}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">磨损度</span>
                <span class="detail-value">{selectedSlot()!.wear_level}%</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">版本</span>
                <span class="version-tag">v{selectedSlot()!.version}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">更新时间</span>
                <span class="detail-value" style="font-size: 12px;">{selectedSlot()!.updated_at}</span>
              </div>
              <Show when={selectedSlot()!.carve_batch}>
                <div class="detail-row">
                  <span class="detail-label">关联补刻</span>
                  <span class="detail-value">{selectedSlot()!.carve_batch}</span>
                </div>
              </Show>
            </div>

            <div class="detail-panel" style="margin-top: 20px;">
              <h3>📜 变更历史</h3>
              <div class="timeline">
                <Show when={history().length === 0}>
                  <p style="font-size: 12px; color: #999; text-align: center; padding: 12px;">
                    暂无历史记录
                  </p>
                </Show>
                <For each={history()}>
                  {item => (
                    <div class="timeline-item">
                      <div class="timeline-time">{item.timestamp}</div>
                      <div class="timeline-action">
                        {actionLabels[item.action_type] || item.action_type}
                      </div>
                      <div style="font-size: 11px; color: #666; margin-top: 2px;">
                        {statusLabels[item.old_status] || '-'} → {statusLabels[item.new_status] || '-'}
                      </div>
                      <div class="timeline-op">操作人: {item.operator}</div>
                      <Show when={item.notes}>
                        <div style="font-size: 11px; color: #888; margin-top: 4px; padding: 4px 8px; background: #f5f5f5; border-radius: 4px;">
                          {item.notes}
                        </div>
                      </Show>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
}
