import { createSignal, onMount, For, Show } from "solid-js";
import { useNavigate, useParams } from "@solidjs/router";

interface Batch {
  id: number;
  batch_no: string;
  total_chars: number;
  completed_chars: number;
  status: string;
  version: number;
  parent_batch: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  plans: CarvePlan[];
  history: HistoryItem[];
  previous_versions: Batch[];
}

interface CarvePlan {
  id: number;
  batch_no: string;
  character: string;
  quantity: number;
  priority: string;
  status: string;
  task_id: number | null;
  estimated_date: string | null;
  completed_date: string | null;
  notes: string | null;
  task_no?: string;
  task_title?: string;
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

export default function BatchDetail() {
  const params = useParams();
  const navigate = useNavigate();
  const batchNo = () => params.no;
  
  const [batch, setBatch] = createSignal<Batch | null>(null);
  const [isRollbackSample, setIsRollbackSample] = createSignal(false);
  const [showRollbackConfirm, setShowRollbackConfirm] = createSignal(false);
  const [activeTab, setActiveTab] = createSignal('plans');

  onMount(() => {
    loadBatch();
    setIsRollbackSample(batchNo().includes('01R') || batchNo().includes('BATCH-2024-01R'));
  });

  async function loadBatch() {
    const res = await fetch(`/api/batches/${batchNo()}`);
    const data = await res.json();
    setBatch(data);
  }

  async function doRollback() {
    const res = await fetch(`/api/batches/${batchNo()}?action=rollback`, {
      method: 'POST'
    });
    const data = await res.json();
    setShowRollbackConfirm(false);
    if (data.new_batch_no) {
      navigate(`/batches/${data.new_batch_no}`);
    }
  }

  async function updateStatus(newStatus: string) {
    await fetch(`/api/batches/${batchNo()}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    loadBatch();
  }

  const statusLabels: Record<string, string> = {
    'draft': '草稿',
    'approved': '已审核',
    'in_production': '生产中',
    'completed': '已完成',
    'rolled_back': '已回滚'
  };

  const planStatusLabels: Record<string, string> = {
    'pending': '待处理',
    'in_progress': '进行中',
    'completed': '已完成',
    'cancelled': '已取消'
  };

  const priorityLabels: Record<string, string> = {
    'low': '低',
    'medium': '中',
    'high': '高',
    'urgent': '紧急'
  };

  const actionLabels: Record<string, string> = {
    'inventory_check': '盘点检查',
    'wear_check': '磨损检查',
    'carve_assign': '分配补刻',
    'carve_complete': '补刻完成',
    'rollback': '回滚操作',
    'status_update': '状态更新'
  };

  const slotStatusLabels: Record<string, string> = {
    'normal': '正常',
    'missing': '缺字',
    'worn': '磨损',
    'reserved': '预留'
  };

  return (
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <button class="btn btn-outline btn-sm" onClick={() => navigate('/batches')}>
          ← 返回批次列表
        </button>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-outline btn-sm" onClick={() => setShowRollbackConfirm(true)}>
            ↩ 回滚批次
          </button>
        </div>
      </div>

      <Show when={batch()}>
        <h2 class="page-title">
          批次 {batch()!.batch_no}
          <span class="version-tag" style="margin-left: 12px; font-size: 14px;">v{batch()!.version}</span>
        </h2>
        <p class="page-subtitle">
          补刻批次详情 · 状态: 
          <span class={`badge badge-${batch()!.status}`} style="margin-left: 6px;">
            {statusLabels[batch()!.status]}
          </span>
        </p>

        <Show when={isRollbackSample()}>
          <div class="sample-section">
            <div class="sample-title">
              <span>🔄</span>
              <span>样本三：专属记录需要回滚或重算</span>
              <span class="sample-tag">回滚场景</span>
            </div>
            <p class="sample-desc">
              本批次展示了<span class="sample-tag">版本回滚</span>和<span class="sample-tag">重算机制</span>。
              BATCH-2024-01R 是一个已回滚的补刻批次，原因为「字模质量不合格」。
              回滚后字盘格位状态恢复为缺字，同时生成新的回滚版本记录。
            </p>
            <div class="before-after">
              <div class="before-col">
                <h4>回滚前（正常补刻完成）</h4>
                <ul style="font-size: 12px; margin: 0; padding-left: 16px;">
                  <li>字格状态：正常</li>
                  <li>磨损度：0%（新刻）</li>
                  <li>批次状态：已完成</li>
                  <li>版本：v1</li>
                </ul>
              </div>
              <div class="after-col">
                <h4>回滚后（质量不合格重算）</h4>
                <ul style="font-size: 12px; margin: 0; padding-left: 16px;">
                  <li>字格状态：恢复为缺字</li>
                  <li>磨损度：重置</li>
                  <li>批次状态：已回滚</li>
                  <li>新版本：v2（回滚版本）</li>
                  <li>父批次：指向原批次</li>
                </ul>
              </div>
            </div>
            <p style="font-size: 12px; color: #666; margin-top: 8px;">
              💡 下方「历史变更」标签页可查看回滚操作对字盘格位的影响轨迹。
            </p>
          </div>
        </Show>

        <div class="layout-2col">
          <div>
            <div class="card">
              <div class="tabs">
                <div 
                  class={`tab ${activeTab() === 'plans' ? 'active' : ''}`}
                  onClick={() => setActiveTab('plans')}
                >
                  补刻计划 ({batch()!.plans.length})
                </div>
                <div 
                  class={`tab ${activeTab() === 'history' ? 'active' : ''}`}
                  onClick={() => setActiveTab('history')}
                >
                  历史变更 ({batch()!.history.length})
                </div>
                <div 
                  class={`tab ${activeTab() === 'versions' ? 'active' : ''}`}
                  onClick={() => setActiveTab('versions')}
                >
                  版本对比
                </div>
              </div>

              <Show when={activeTab() === 'plans'}>
                <table>
                  <thead>
                    <tr>
                      <th>汉字</th>
                      <th>数量</th>
                      <th>优先级</th>
                      <th>状态</th>
                      <th>关联任务</th>
                      <th>预计完成</th>
                      <th>备注</th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={batch()!.plans}>
                      {plan => (
                        <tr>
                          <td style="font-size: 20px; font-weight: 500;">{plan.character}</td>
                          <td>{plan.quantity}</td>
                          <td><span class={`badge badge-${plan.priority}`}>{priorityLabels[plan.priority]}</span></td>
                          <td><span class={`badge badge-${plan.status}`}>{planStatusLabels[plan.status]}</span></td>
                          <td>
                            <Show when={plan.task_no}>
                              <button 
                                class="link-btn"
                                onClick={() => navigate(`/tasks/${plan.task_id}`)}
                              >
                                {plan.task_no}
                              </button>
                              <div style="font-size: 10px; color: #999;">{plan.task_title}</div>
                            </Show>
                            <Show when={!plan.task_no}>
                              <span style="font-size: 12px; color: #999;">-</span>
                            </Show>
                          </td>
                          <td style="font-size: 12px;">{plan.estimated_date || '-'}</td>
                          <td style="font-size: 12px; color: #666; max-width: 150px;">
                            {plan.notes || '-'}
                          </td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </Show>

              <Show when={activeTab() === 'history'}>
                <div class="timeline" style="padding: 12px 0 12px 24px;">
                  <Show when={batch()!.history.length === 0}>
                    <p style="font-size: 13px; color: #999; text-align: center; padding: 24px;">
                      暂无历史变更记录
                    </p>
                  </Show>
                  <For each={batch()!.history}>
                    {item => (
                      <div class="timeline-item">
                        <div class="timeline-time">{item.timestamp}</div>
                        <div class="timeline-action">
                          <strong>{actionLabels[item.action_type] || item.action_type}</strong>
                          <span style="margin-left: 8px; font-size: 12px;">
                            字「{item.character}」
                          </span>
                        </div>
                        <div style="font-size: 11px; color: #666; margin-top: 4px;">
                          {slotStatusLabels[item.old_status] || '-'} 
                          <span style="margin: 0 4px;">→</span> 
                          {slotStatusLabels[item.new_status] || '-'}
                        </div>
                        <div class="timeline-op">
                          字盘: {item.tray_id} · 格位 #{item.slot_id} · 操作人: {item.operator}
                        </div>
                        <Show when={item.notes}>
                          <div style="font-size: 11px; color: #888; margin-top: 4px; padding: 4px 8px; background: #f5f5f5; border-radius: 4px;">
                            📝 {item.notes}
                          </div>
                        </Show>
                      </div>
                    )}
                  </For>
                </div>
              </Show>

              <Show when={activeTab() === 'versions'}>
                <div>
                  <p style="font-size: 13px; color: #666; margin-bottom: 16px;">
                    本批次的版本演变记录，点击版本号可跳转查看详情。
                  </p>
                  <table class="comparison-table">
                    <thead>
                      <tr>
                        <th>版本</th>
                        <th>批次号</th>
                        <th>状态</th>
                        <th>字符数</th>
                        <th>父批次</th>
                        <th>变更说明</th>
                      </tr>
                    </thead>
                    <tbody>
                      <For each={batch()!.previous_versions}>
                        {v => (
                          <tr class={v.batch_no === batchNo() ? '' : ''}>
                            <td>
                              <span class={`version-tag ${v.batch_no === batchNo() ? 'current' : ''}`}>
                                v{v.version}
                              </span>
                              <Show when={v.batch_no === batchNo()}>
                                <span style="margin-left: 6px; font-size: 11px; color: var(--color-success);">
                                  当前
                                </span>
                              </Show>
                            </td>
                            <td>
                              <button 
                                class="link-btn"
                                onClick={() => navigate(`/batches/${v.batch_no}`)}
                              >
                                {v.batch_no}
                              </button>
                            </td>
                            <td><span class={`badge badge-${v.status}`}>{statusLabels[v.status]}</span></td>
                            <td>{v.total_chars}</td>
                            <td style="font-size: 12px;">{v.parent_batch || '-'}</td>
                            <td style="font-size: 12px;">
                              <Show when={v.status === 'rolled_back'}>
                                <span class="diff-modify">质量不合格回滚</span>
                              </Show>
                              <Show when={v.status === 'completed'}>
                                <span class="diff-add">补刻完成</span>
                              </Show>
                              <Show when={v.status === 'in_production'}>
                                <span class="diff-modify">生产中</span>
                              </Show>
                              <Show when={v.status === 'draft'}>
                                <span style="color: #999;">初始版本</span>
                              </Show>
                            </td>
                          </tr>
                        )}
                      </For>
                    </tbody>
                  </table>
                </div>
              </Show>
            </div>
          </div>

          <div>
            <div class="detail-panel">
              <h3>📊 批次进度</h3>
              <div style="margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                  <span style="font-size: 13px;">完成进度</span>
                  <span style="font-size: 13px; font-weight: 500;">
                    {batch()!.completed_chars}/{batch()!.total_chars} 字
                  </span>
                </div>
                <div class="progress-bar">
                  <div 
                    class={`progress-fill ${batch()!.status === 'completed' ? 'success' : ''}`}
                    style={`width: ${batch()!.total_chars > 0 
                      ? (batch()!.completed_chars / batch()!.total_chars * 100) 
                      : 0}%`}
                  />
                </div>
              </div>
              <div class="detail-row">
                <span class="detail-label">版本号</span>
                <span class="version-tag">v{batch()!.version}</span>
              </div>
              <Show when={batch()!.parent_batch}>
                <div class="detail-row">
                  <span class="detail-label">父批次</span>
                  <button 
                    class="link-btn"
                    onClick={() => navigate(`/batches/${batch()!.parent_batch}`)}
                  >
                    {batch()!.parent_batch}
                  </button>
                </div>
              </Show>
              <div class="detail-row">
                <span class="detail-label">创建时间</span>
                <span class="detail-value" style="font-size: 12px;">{batch()!.created_at}</span>
              </div>
              <Show when={batch()!.started_at}>
                <div class="detail-row">
                  <span class="detail-label">开始时间</span>
                  <span class="detail-value" style="font-size: 12px;">{batch()!.started_at}</span>
                </div>
              </Show>
              <Show when={batch()!.completed_at}>
                <div class="detail-row">
                  <span class="detail-label">完成时间</span>
                  <span class="detail-value" style="font-size: 12px;">{batch()!.completed_at}</span>
                </div>
              </Show>
            </div>

            <div class="detail-panel" style="margin-top: 20px;">
              <h3>⚡ 状态操作</h3>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <button 
                  class="btn btn-outline btn-sm" 
                  style="width: 100%;"
                  onClick={() => updateStatus('approved')}
                  disabled={batch()!.status !== 'draft'}
                >
                  ✓ 审核通过
                </button>
                <button 
                  class="btn btn-primary btn-sm" 
                  style="width: 100%;"
                  onClick={() => updateStatus('in_production')}
                  disabled={batch()!.status !== 'approved'}
                >
                  ▶ 开始生产
                </button>
                <button 
                  class="btn btn-outline btn-sm" 
                  style="width: 100%;"
                  onClick={() => updateStatus('completed')}
                  disabled={batch()!.status !== 'in_production'}
                >
                  ✓ 标记完成
                </button>
                <button 
                  class="btn btn-danger btn-sm" 
                  style="width: 100%;"
                  onClick={() => setShowRollbackConfirm(true)}
                >
                  ↩ 回滚批次
                </button>
              </div>
              <p style="font-size: 11px; color: #999; margin-top: 12px;">
                状态流转: 草稿 → 已审核 → 生产中 → 已完成
                <br />异常情况可执行回滚操作
              </p>
            </div>

            <div class="detail-panel" style="margin-top: 20px;">
              <h3>📤 导出</h3>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <button class="btn btn-outline btn-sm" style="width: 100%;">
                  📋 导出补刻清单 (CSV)
                </button>
                <button class="btn btn-outline btn-sm" style="width: 100%;">
                  📄 导出版本对比报告
                </button>
              </div>
            </div>
          </div>
        </div>

        <Show when={showRollbackConfirm()}>
          <div class="modal-backdrop" onClick={() => setShowRollbackConfirm(false)}>
            <div class="modal" style="max-width: 440px;" onClick={e => e.stopPropagation()}>
              <div class="modal-header">
                <h3 class="modal-title">确认回滚批次</h3>
                <button class="modal-close" onClick={() => setShowRollbackConfirm(false)}>✕</button>
              </div>
              <div style="background: #FFF3E0; padding: 12px; border-radius: 6px; margin-bottom: 16px;">
                <p style="font-size: 13px; color: #E65100; margin-bottom: 8px;">
                  ⚠️ <strong>回滚操作说明</strong>
                </p>
                <ul style="font-size: 12px; color: #666; padding-left: 20px; margin: 0; line-height: 1.8;">
                  <li>批次状态将变为「已回滚」</li>
                  <li>已补刻的字格状态将恢复为「缺字」</li>
                  <li>生成新版本记录，版本号 +1</li>
                  <li>新版本父批次指向当前批次</li>
                  <li>历史记录中将添加回滚操作日志</li>
                </ul>
              </div>
              <div class="form-group">
                <label class="form-label">回滚原因</label>
                <select class="form-input">
                  <option value="quality">字模质量不合格</option>
                  <option value="wrong_char">刻字错误</option>
                  <option value="size">尺寸不符</option>
                  <option value="other">其他原因</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">备注说明</label>
                <textarea class="form-textarea" placeholder="请详细说明回滚原因..."></textarea>
              </div>
              <div class="modal-actions">
                <button class="btn btn-secondary" onClick={() => setShowRollbackConfirm(false)}>
                  取消
                </button>
                <button class="btn btn-danger" onClick={doRollback}>
                  确认回滚
                </button>
              </div>
            </div>
          </div>
        </Show>
      </Show>
    </div>
  );
}
