import { createSignal, onMount, For, Show } from "solid-js";

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
  task_no?: string;
}

export default function History() {
  const [history, setHistory] = createSignal<HistoryItem[]>([]);
  const [filter, setFilter] = createSignal({
    tray_id: '',
    batch_no: '',
    action_type: ''
  });

  onMount(() => {
    loadHistory();
  });

  async function loadHistory() {
    const params = new URLSearchParams();
    if (filter().tray_id) params.set('tray_id', filter().tray_id);
    if (filter().batch_no) params.set('batch_no', filter().batch_no);
    if (filter().action_type) params.set('action_type', filter().action_type);
    params.set('limit', '200');
    
    const res = await fetch(`/api/history?${params.toString()}`);
    const data = await res.json();
    setHistory(data);
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
      <h2 class="page-title">历史记录</h2>
      <p class="page-subtitle">查看字盘格位的所有变更历史，追踪状态变化轨迹</p>

      <div class="sample-section">
        <div class="sample-title">
          <span>📜</span>
          <span>历史记录说明</span>
        </div>
        <p class="sample-desc">
          历史记录保存字盘格位的每一次状态变更，包括操作类型、操作人、时间戳和关联信息。
          支持按字盘、批次、操作类型筛选，可用于审计追踪和问题溯源。
          每个格位的版本号随状态变更自动递增。
        </p>
      </div>

      <div class="card">
        <div class="search-bar">
          <select 
            class="select-input"
            value={filter().tray_id}
            onChange={(e) => {
              setFilter(f => ({ ...f, tray_id: e.target.value }));
              loadHistory();
            }}
          >
            <option value="">全部字盘</option>
            <option value="TRAY-A01">TRAY-A01</option>
            <option value="TRAY-A02">TRAY-A02</option>
            <option value="TRAY-B01">TRAY-B01</option>
            <option value="TRAY-B02">TRAY-B02</option>
          </select>
          <select 
            class="select-input"
            value={filter().action_type}
            onChange={(e) => {
              setFilter(f => ({ ...f, action_type: e.target.value }));
              loadHistory();
            }}
          >
            <option value="">全部操作</option>
            <option value="inventory_check">盘点检查</option>
            <option value="wear_check">磨损检查</option>
            <option value="carve_assign">分配补刻</option>
            <option value="carve_complete">补刻完成</option>
            <option value="rollback">回滚操作</option>
          </select>
          <input
            type="text"
            class="search-input"
            placeholder="输入批次号筛选..."
            value={filter().batch_no}
            onInput={(e) => {
              setFilter(f => ({ ...f, batch_no: e.target.value }));
              setTimeout(loadHistory, 300);
            }}
            style="max-width: 200px;"
          />
        </div>

        <p style="font-size: 13px; color: #666; margin-bottom: 12px;">
          共 <strong>{history().length}</strong> 条记录
        </p>

        <Show when={history().length === 0}>
          <div class="empty-state">
            <div class="empty-icon">📭</div>
            <div class="empty-text">暂无历史记录</div>
          </div>
        </Show>

        <Show when={history().length > 0}>
          <table>
            <thead>
              <tr>
                <th>时间</th>
                <th>操作类型</th>
                <th>汉字</th>
                <th>字盘</th>
                <th>格位</th>
                <th>状态变更</th>
                <th>关联批次</th>
                <th>操作人</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              <For each={history()}>
                {item => (
                  <tr>
                    <td style="font-size: 12px;">{item.timestamp}</td>
                    <td>
                      <span class={`badge ${
                        item.action_type === 'rollback' ? 'badge-rolled_back' :
                        item.action_type === 'carve_complete' ? 'badge-completed' :
                        item.action_type === 'carve_assign' ? 'badge-reserved' : 'badge-draft'
                      }`}>
                        {actionLabels[item.action_type] || item.action_type}
                      </span>
                    </td>
                    <td style="font-size: 18px;">{item.character || '-'}</td>
                    <td>{item.tray_id}</td>
                    <td>#{item.slot_id}</td>
                    <td style="font-size: 12px;">
                      <span class={`badge badge-${item.old_status}`}>
                        {statusLabels[item.old_status] || item.old_status}
                      </span>
                      <span style="margin: 0 4px;">→</span>
                      <span class={`badge badge-${item.new_status}`}>
                        {statusLabels[item.new_status] || item.new_status}
                      </span>
                    </td>
                    <td>
                      <Show when={item.batch_no}>
                        <span style="font-size: 12px; color: var(--color-info);">
                          {item.batch_no}
                        </span>
                      </Show>
                      <Show when={!item.batch_no}>
                        <span style="font-size: 12px; color: #ccc;">-</span>
                      </Show>
                    </td>
                    <td style="font-size: 12px;">{item.operator}</td>
                    <td style="font-size: 12px; color: #666; max-width: 150px;">
                      {item.notes || '-'}
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </Show>
      </div>
    </div>
  );
}
