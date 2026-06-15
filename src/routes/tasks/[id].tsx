import { createSignal, onMount, For, Show } from "solid-js";
import { useNavigate, useParams } from "@solidjs/router";

interface Task {
  id: number;
  task_no: string;
  title: string;
  client: string;
  required_chars: string[];
  status: string;
  priority: string;
  deadline: string;
  created_at: string;
  updated_at: string;
  carve_plans: CarvePlan[];
  missing_analysis: Record<string, any>;
}

interface CarvePlan {
  id: number;
  batch_no: string;
  character: string;
  quantity: number;
  priority: string;
  status: string;
  task_id: number;
  estimated_date: string | null;
  completed_date: string | null;
  notes: string | null;
  batch_status: string;
  batch_version: number;
}

export default function TaskDetail() {
  const params = useParams();
  const navigate = useNavigate();
  const taskId = () => params.id;
  
  const [task, setTask] = createSignal<Task | null>(null);
  const [isSampleOne, setIsSampleOne] = createSignal(false);
  const [showStatusModal, setShowStatusModal] = createSignal(false);

  onMount(() => {
    loadTask();
    setIsSampleOne(taskId() === '1');
  });

  async function loadTask() {
    const res = await fetch(`/api/tasks/${taskId()}`);
    const data = await res.json();
    setTask(data);
  }

  async function updateStatus(newStatus: string) {
    await fetch(`/api/tasks/${taskId()}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    setShowStatusModal(false);
    loadTask();
  }

  const statusLabels: Record<string, string> = {
    'draft': '草稿',
    'confirmed': '已确认',
    'in_production': '生产中',
    'completed': '已完成',
    'cancelled': '已取消'
  };

  const priorityLabels: Record<string, string> = {
    'normal': '普通',
    'high': '高',
    'urgent': '紧急'
  };

  const planStatusLabels: Record<string, string> = {
    'pending': '待处理',
    'in_progress': '进行中',
    'completed': '已完成',
    'cancelled': '已取消'
  };

  const missingCount = () => {
    if (!task()) return 0;
    return Object.values(task()!.missing_analysis).filter(a => a.missing).length;
  };

  const wornCount = () => {
    if (!task()) return 0;
    return Object.values(task()!.missing_analysis).filter(a => a.worn && !a.missing).length;
  };

  return (
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <button class="btn btn-outline btn-sm" onClick={() => navigate('/tasks')}>
          ← 返回任务列表
        </button>
        <button class="btn btn-primary btn-sm" onClick={() => setShowStatusModal(true)}>
          更新状态
        </button>
      </div>

      <Show when={task()}>
        <h2 class="page-title">{task()!.title}</h2>
        <p class="page-subtitle">
          {task()!.task_no} · {task()!.client}
        </p>

        <Show when={isSampleOne()}>
          <div class="sample-section">
            <div class="sample-title">
              <span>✅</span>
              <span>样本一：任务关联和缺字预警正常完成</span>
              <span class="sample-tag">正常流程</span>
            </div>
            <p class="sample-desc">
              本任务展示了完整的正向流程：印刷任务「古籍复刻-卷一」确认后，
              系统自动对所需汉字进行缺字分析，触发缺字预警，并将缺字纳入补刻批次。
              下方展示了<span class="sample-tag">任务→缺字分析→预警→补刻计划→批次关联</span>的完整链路。
            </p>
            <div class="before-after">
              <div class="before-col">
                <h4>任务确认前</h4>
                <ul style="font-size: 12px; margin: 0; padding-left: 16px;">
                  <li>缺字未被标记预警</li>
                  <li>无关联补刻计划</li>
                  <li>字盘状态不变化</li>
                </ul>
              </div>
              <div class="after-col">
                <h4>任务确认后</h4>
                <ul style="font-size: 12px; margin: 0; padding-left: 16px;">
                  <li>生成缺字预警 {missingCount()} 条</li>
                  <li>关联补刻计划 {task()!.carve_plans.length} 项</li>
                  <li>字格状态更新为「预留」</li>
                </ul>
              </div>
            </div>
          </div>
        </Show>

        <div class="layout-2col">
          <div>
            <div class="card">
              <h3 class="card-title">📝 任务信息</h3>
              <div class="detail-row">
                <span class="detail-label">任务编号</span>
                <span class="detail-value">{task()!.task_no}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">任务标题</span>
                <span class="detail-value">{task()!.title}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">客户</span>
                <span class="detail-value">{task()!.client}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">状态</span>
                <span class={`badge badge-${task()!.status}`}>{statusLabels[task()!.status]}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">优先级</span>
                <span class={`badge badge-${task()!.priority}`}>{priorityLabels[task()!.priority]}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">截止日期</span>
                <span class="detail-value">{task()!.deadline}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">创建时间</span>
                <span class="detail-value" style="font-size: 12px;">{task()!.created_at}</span>
              </div>
            </div>

            <div class="card">
              <h3 class="card-title">
                <span>🔤</span>
                <span>所需汉字分析</span>
                <span style="margin-left: auto; font-size: 12px; font-weight: normal; color: #666;">
                  共 {task()!.required_chars.length} 字
                </span>
              </h3>
              
              <div style="display: flex; gap: 16px; margin-bottom: 16px;">
                <div class="stat-card success" style="flex: 1; padding: 12px; margin-bottom: 0;">
                  <div class="stat-label">可用</div>
                  <div class="stat-value success" style="font-size: 22px;">
                    {task()!.required_chars.length - missingCount() - wornCount()}
                  </div>
                </div>
                <div class="stat-card warning" style="flex: 1; padding: 12px; margin-bottom: 0;">
                  <div class="stat-label">磨损</div>
                  <div class="stat-value warning" style="font-size: 22px;">{wornCount()}</div>
                </div>
                <div class="stat-card danger" style="flex: 1; padding: 12px; margin-bottom: 0;">
                  <div class="stat-label">缺字</div>
                  <div class="stat-value danger" style="font-size: 22px;">{missingCount()}</div>
                </div>
              </div>

              <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                <For each={task()!.required_chars}>
                  {char => {
                    const analysis = task()!.missing_analysis[char];
                    const hasIssue = analysis?.missing || analysis?.worn;
                    return (
                      <div 
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          padding: '8px 12px',
                          background: analysis?.missing ? '#FFEBEE' : analysis?.worn ? '#FFF3E0' : '#f5f5f5',
                          borderRadius: '6px',
                          border: `1px solid ${analysis?.missing ? '#EF9A9A' : analysis?.worn ? '#FFCC80' : '#e0e0e0'}`
                        }}
                        title={analysis?.missing ? '缺字，需补刻' : analysis?.worn ? '磨损，建议重刻' : '正常可用'}
                      >
                        <span style={{ fontSize: '20px', fontWeight: '500' }}>{char}</span>
                        <span style={{ fontSize: '10px', color: analysis?.missing ? '#d32f2f' : analysis?.worn ? '#f57c00' : '#666' }}>
                          {analysis?.missing ? '缺字' : analysis?.worn ? '磨损' : '正常'}
                        </span>
                      </div>
                    );
                  }}
                </For>
              </div>
            </div>

            <div class="card">
              <h3 class="card-title">🔨 关联补刻计划</h3>
              <Show when={task()!.carve_plans.length === 0}>
                <div class="empty-state">
                  <div class="empty-icon">📭</div>
                  <div class="empty-text">暂无关联补刻计划</div>
                </div>
              </Show>
              <Show when={task()!.carve_plans.length > 0}>
                <table>
                  <thead>
                    <tr>
                      <th>批次</th>
                      <th>汉字</th>
                      <th>数量</th>
                      <th>优先级</th>
                      <th>状态</th>
                      <th>预计完成</th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={task()!.carve_plans}>
                      {plan => (
                        <tr onClick={() => navigate(`/batches/${plan.batch_no}`)} style="cursor: pointer;">
                          <td>
                            <strong>{plan.batch_no}</strong>
                            <div style="font-size: 10px; color: #999;">
                              v{plan.batch_version}
                            </div>
                          </td>
                          <td style="font-size: 18px;">{plan.character}</td>
                          <td>{plan.quantity}</td>
                          <td><span class={`badge badge-${plan.priority}`}>{priorityLabels[plan.priority]}</span></td>
                          <td><span class={`badge badge-${plan.status}`}>{planStatusLabels[plan.status]}</span></td>
                          <td>{plan.estimated_date || '-'}</td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </Show>
            </div>
          </div>

          <div>
            <div class="detail-panel">
              <h3>📊 完成度</h3>
              <div style="margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                  <span style="font-size: 13px;">补刻完成率</span>
                  <span style="font-size: 13px; font-weight: 500;">
                    {task()!.carve_plans.filter(p => p.status === 'completed').length}/{task()!.carve_plans.length}
                  </span>
                </div>
                <div class="progress-bar">
                  <div 
                    class="progress-fill success"
                    style={`width: ${task()!.carve_plans.length > 0 
                      ? (task()!.carve_plans.filter(p => p.status === 'completed').length / task()!.carve_plans.length * 100) 
                      : 0}%`}
                  />
                </div>
              </div>
              <div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                  <span style="font-size: 13px;">字库满足度</span>
                  <span style="font-size: 13px; font-weight: 500;">
                    {task()!.required_chars.length - missingCount()}/{task()!.required_chars.length}
                  </span>
                </div>
                <div class="progress-bar">
                  <div 
                    class="progress-fill"
                    style={`width: ${((task()!.required_chars.length - missingCount()) / task()!.required_chars.length * 100)}%`}
                  />
                </div>
              </div>
            </div>

            <div class="detail-panel" style="margin-top: 20px;">
              <h3>🔔 相关预警</h3>
              <div class="timeline">
                <Show when={missingCount() > 0}>
                  <div class="timeline-item">
                    <div class="timeline-time">任务确认时</div>
                    <div class="timeline-action">
                      <span class="badge badge-danger">缺字预警</span>
                    </div>
                    <div style="font-size: 11px; color: #666; margin-top: 2px;">
                      {missingCount()} 个汉字不在字库中
                    </div>
                  </div>
                </Show>
                <Show when={wornCount() > 0}>
                  <div class="timeline-item">
                    <div class="timeline-time">任务确认时</div>
                    <div class="timeline-action">
                      <span class="badge badge-warning">磨损提醒</span>
                    </div>
                    <div style="font-size: 11px; color: #666; margin-top: 2px;">
                      {wornCount()} 个汉字磨损较严重
                    </div>
                  </div>
                </Show>
                <Show when={task()!.priority === 'urgent'}>
                  <div class="timeline-item">
                    <div class="timeline-time">任务创建时</div>
                    <div class="timeline-action">
                      <span class="badge badge-urgent">紧急任务</span>
                    </div>
                    <div style="font-size: 11px; color: #666; margin-top: 2px;">
                      截止日期临近，需优先安排
                    </div>
                  </div>
                </Show>
              </div>
            </div>

            <div class="detail-panel" style="margin-top: 20px;">
              <h3>⚡ 快捷操作</h3>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <button class="btn btn-outline btn-sm" style="width: 100%;">
                  📋 生成补刻清单
                </button>
                <button class="btn btn-outline btn-sm" style="width: 100%;">
                  📤 导出任务单
                </button>
                <button class="btn btn-outline btn-sm" style="width: 100%;">
                  🔄 重新分析缺字
                </button>
              </div>
            </div>
          </div>
        </div>

        <Show when={showStatusModal()}>
          <div class="modal-backdrop" onClick={() => setShowStatusModal(false)}>
            <div class="modal" style="max-width: 400px;" onClick={e => e.stopPropagation()}>
              <div class="modal-header">
                <h3 class="modal-title">更新任务状态</h3>
                <button class="modal-close" onClick={() => setShowStatusModal(false)}>✕</button>
              </div>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <button class="btn btn-outline" onClick={() => updateStatus('draft')}>
                  设为草稿
                </button>
                <button class="btn btn-outline" onClick={() => updateStatus('confirmed')}>
                  确认任务（触发缺字分析）
                </button>
                <button class="btn btn-outline" onClick={() => updateStatus('in_production')}>
                  开始生产
                </button>
                <button class="btn btn-outline" onClick={() => updateStatus('completed')}>
                  标记完成
                </button>
                <button class="btn btn-outline" style="color: var(--color-danger);" onClick={() => updateStatus('cancelled')}>
                  取消任务
                </button>
              </div>
            </div>
          </div>
        </Show>
      </Show>
    </div>
  );
}
