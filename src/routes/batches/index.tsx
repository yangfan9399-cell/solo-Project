import { createSignal, onMount, For, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";

interface Batch {
  id: number;
  batch_no: string;
  total_chars: number;
  completed_chars: number;
  status: string;
  version: number;
  parent_batch: string | null;
  created_at: string;
  updated_at: string;
  plan_count: number;
  completed_plans: number;
}

export default function BatchesList() {
  const navigate = useNavigate();
  const [batches, setBatches] = createSignal<Batch[]>([]);
  const [showCreateModal, setShowCreateModal] = createSignal(false);

  onMount(() => {
    loadBatches();
  });

  async function loadBatches() {
    const res = await fetch('/api/batches');
    const data = await res.json();
    setBatches(data);
  }

  const statusLabels: Record<string, string> = {
    'draft': '草稿',
    'approved': '已审核',
    'in_production': '生产中',
    'completed': '已完成',
    'rolled_back': '已回滚'
  };

  return (
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <div>
          <h2 class="page-title">补刻批次</h2>
          <p class="page-subtitle">管理木活字补刻批次，跟踪生产进度，支持版本回滚</p>
        </div>
        <button class="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + 新建批次
        </button>
      </div>

      <div class="sample-section">
        <div class="sample-title">
          <span>🏭</span>
          <span>结果记录说明</span>
        </div>
        <p class="sample-desc">
          补刻批次是系统的<span class="sample-tag">结果记录</span>，保存补刻生产的批次信息和完成情况。
          每个批次包含多个补刻计划项，支持版本管理和回滚操作。
          批次状态流转：草稿 {"→"} 已审核 {"→"} 生产中 {"→"} 已完成（异常时可回滚）。
        </p>
      </div>

      <div class="card">
        <table>
          <thead>
            <tr>
              <th>批次编号</th>
              <th>版本</th>
              <th>父批次</th>
              <th>计划项数</th>
              <th>完成数</th>
              <th>进度</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <For each={batches()}>
              {batch => {
                const progress = batch.total_chars > 0 
                  ? Math.round((batch.completed_chars / batch.total_chars) * 100) 
                  : 0;
                return (
                  <tr onClick={() => navigate(`/batches/${batch.batch_no}`)} style="cursor: pointer;">
                    <td>
                      <strong>{batch.batch_no}</strong>
                      <Show when={batch.status === 'rolled_back'}>
                        <div class="rollback-indicator">↩ 已回滚</div>
                      </Show>
                    </td>
                    <td><span class="version-tag">v{batch.version}</span></td>
                    <td>
                      <Show when={batch.parent_batch}>
                        <span style="font-size: 12px; color: #666;">{batch.parent_batch}</span>
                      </Show>
                      <Show when={!batch.parent_batch}>
                        <span style="font-size: 12px; color: #ccc;">-</span>
                      </Show>
                    </td>
                    <td>{batch.plan_count}</td>
                    <td>{batch.completed_plans}</td>
                    <td style="width: 120px;">
                      <div class="progress-bar">
                        <div 
                          class={`progress-fill ${progress === 100 ? 'success' : ''}`}
                          style={`width: ${progress}%`}
                        />
                      </div>
                      <span style="font-size: 11px; color: #666;">{progress}%</span>
                    </td>
                    <td><span class={`badge badge-${batch.status}`}>{statusLabels[batch.status]}</span></td>
                    <td style="font-size: 12px;">{batch.created_at}</td>
                    <td>
                      <button 
                        class="btn btn-sm btn-outline" 
                        onClick={(e) => { e.stopPropagation(); navigate(`/batches/${batch.batch_no}`); }}
                      >
                        详情
                      </button>
                    </td>
                  </tr>
                );
              }}
            </For>
          </tbody>
        </table>
      </div>

      <Show when={showCreateModal()}>
        <div class="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div class="modal" onClick={e => e.stopPropagation()}>
            <div class="modal-header">
              <h3 class="modal-title">新建补刻批次</h3>
              <button class="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <div class="form-group">
              <label class="form-label">批次说明</label>
              <input type="text" class="form-input" placeholder="例如：2024年第3批补刻" />
            </div>
            <div class="form-group">
              <label class="form-label">补刻汉字（每行一个，可带数量）</label>
              <textarea class="form-textarea" placeholder="木:2&#10;活:1&#10;字:3"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">优先级</label>
                <select class="form-input">
                  <option value="low">低</option>
                  <option value="medium" selected>中</option>
                  <option value="high">高</option>
                  <option value="urgent">紧急</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">关联任务</label>
                <select class="form-input">
                  <option value="">无</option>
                  <option value="1">TASK-2024-001 古籍复刻</option>
                </select>
              </div>
            </div>
            <div class="modal-actions">
              <button class="btn btn-secondary" onClick={() => setShowCreateModal(false)}>取消</button>
              <button class="btn btn-primary" onClick={() => setShowCreateModal(false)}>创建批次</button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
