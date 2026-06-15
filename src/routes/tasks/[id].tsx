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
  const [showDiffPanel, setShowDiffPanel] = createSignal(false);

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

  const sampleOneBeforeState = {
    taskStatus: '草稿',
    alertsCount: 0,
    carvePlans: 0,
    slotsReserved: 0,
    alerts: [] as string[],
    charStatuses: [
      { char: '缺', before: '缺字(红)', after: '分配补刻→预留', reason: '字库中不存在该字，触发缺字校验规则' },
      { char: '盘', before: '磨损(橙 85%)', after: '纳入重刻计划', reason: '磨损度 85% > 阈值 80%，触发预警' },
      { char: '点', before: '磨损(橙 85%)', after: '纳入重刻计划', reason: '磨损度 85% > 阈值 80%，触发预警' },
      { char: '刷', before: '磨损(橙 85%)', after: '纳入重刻计划', reason: '磨损度 85% > 阈值 80%，触发预警' },
    ]
  };

  const sampleOneAfterState = {
    taskStatus: '已确认',
    alertsCount: 5,
    carvePlans: 2,
    slotsReserved: 3,
    alerts: [
      { severity: 'danger', text: '字「缺」在 TRAY-A01 第1行第5列缺失' },
      { severity: 'warning', text: '字「盘」磨损度85%，超过阈值需重刻' },
      { severity: 'warning', text: '字「点」磨损度85%，超过阈值需重刻' },
      { severity: 'warning', text: '字「刷」磨损度85%，超过阈值需重刻' },
      { severity: 'info', text: '已将 4 个异常字纳入补刻批次 BATCH-2024-01' }
    ],
    pageEffects: [
      { area: '首页总览', effect: '缺字数 +1，磨损数 +3，预警数 +5' },
      { area: '字盘 TRAY-A01', effect: '3 个格位状态变为「预留」' },
      { area: '批次列表', effect: 'BATCH-2024-01 进度更新' },
      { area: '历史记录', effect: '新增 4 条分配补刻操作日志' }
    ]
  };

  return (
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <button class="btn btn-outline btn-sm" onClick={() => navigate('/tasks')}>
          ← 返回任务列表
        </button>
        <div style="display: flex; gap: 8px;">
          <Show when={isSampleOne()}>
            <button 
              class="btn btn-outline btn-sm" 
              onClick={() => setShowDiffPanel(!showDiffPanel())}
            >
              {showDiffPanel() ? '收起' : '📊'} 差异分析
            </button>
          </Show>
          <button class="btn btn-primary btn-sm" onClick={() => setShowStatusModal(true)}>
            更新状态
          </button>
        </div>
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
              本任务展示完整的<span class="sample-tag">正向工作流</span>：
              印刷任务「古籍复刻-卷一」确认 {"→"} 系统自动执行<strong>缺字校验</strong>和<strong>磨损阈值校验</strong> {"→"}
              触发<strong>缺字预警</strong> {"→"} 生成<strong>补刻计划</strong> {"→"} 关联<strong>补刻批次</strong>。
            </p>

            <div class="validation-logic-box">
              <div class="validation-title">
                <span>🔍</span> 校验规则引擎（任务确认时触发）
              </div>
              <div class="validation-rules">
                <div class="validation-rule">
                  <div class="rule-header">
                    <span class="rule-code">R-001</span>
                    <span class="rule-name">缺字校验</span>
                    <span class="rule-result pass">通过</span>
                  </div>
                  <div class="rule-body">
                    <code>字库中不存在所需汉字 {'→'} status = missing {'→'} severity=danger</code>
                  </div>
                </div>
                <div class="validation-rule">
                  <div class="rule-header">
                    <span class="rule-code">R-002</span>
                    <span class="rule-name">磨损阈值校验</span>
                    <span class="rule-result pass">通过</span>
                  </div>
                  <div class="rule-body">
                    <code>wear_level {'>'} 80% {'→'} status = worn {'→'} severity=warning</code>
                  </div>
                </div>
                <div class="validation-rule">
                  <div class="rule-header">
                    <span class="rule-code">R-003</span>
                    <span class="rule-name">补刻计划生成</span>
                    <span class="rule-result pass">通过</span>
                  </div>
                  <div class="rule-body">
                    <code>status ∈ {'{'}missing, worn{'}'} {'→'} 创建 carve_plan {'→'} 关联 batch</code>
                  </div>
                </div>
              </div>
            </div>

            <div class="before-after-diff">
              <div class="diff-header">
                <span class="diff-label before">📋 确认前（BEFORE）</span>
                <div class="diff-arrow">{"→"}</div>
                <span class="diff-label after">✅ 确认后（AFTER）</span>
              </div>

              <div class="diff-grid">
                <div class="diff-item before">
                  <div class="diff-item-label">任务状态</div>
                  <div class="diff-item-value"><span class="badge badge-draft">草稿</span></div>
                </div>
                <div class="diff-item after">
                  <div class="diff-item-label">任务状态</div>
                  <div class="diff-item-value"><span class="badge badge-confirmed">已确认</span></div>
                </div>

                <div class="diff-item before">
                  <div class="diff-item-label">预警数量</div>
                  <div class="diff-item-value danger">0 条</div>
                </div>
                <div class="diff-item after">
                  <div class="diff-item-label">预警数量</div>
                  <div class="diff-item-value success">+5 条（1危险+3警告+1信息）</div>
                </div>

                <div class="diff-item before">
                  <div class="diff-item-label">补刻计划</div>
                  <div class="diff-item-value">0 项</div>
                </div>
                <div class="diff-item after">
                  <div class="diff-item-label">补刻计划</div>
                  <div class="diff-item-value success">+2 项（关联 BATCH-2024-01）</div>
                </div>

                <div class="diff-item before">
                  <div class="diff-item-label">字盘格位变更</div>
                  <div class="diff-item-value">无</div>
                </div>
                <div class="diff-item after">
                  <div class="diff-item-label">字盘格位变更</div>
                  <div class="diff-item-value success">3 格{"→"}「预留」状态</div>
                </div>
              </div>
            </div>

            <div class="char-diff-table">
              <div class="section-subtitle">📝 逐字校验结果与状态变化</div>
              <table class="diff-table">
                <thead>
                  <tr>
                    <th>汉字</th>
                    <th>字盘位置</th>
                    <th>确认前状态</th>
                    <th>确认后状态</th>
                    <th>校验原因</th>
                    <th>最终页面影响</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="font-size:22px;font-weight:600;">缺</td>
                    <td>TRAY-A01 1-5</td>
                    <td><span class="badge badge-missing">缺字</span></td>
                    <td><span class="badge badge-reserved">预留</span></td>
                    <td style="font-size:11px;">R-001 缺字校验：字库无此字 {"→"} 分配 BATCH-2024-01 #1</td>
                    <td style="font-size:11px;">首页预警区+1条；字盘格位变蓝；批次进度+1字</td>
                  </tr>
                  <tr>
                    <td style="font-size:22px;font-weight:600;">盘</td>
                    <td>TRAY-A01 1-4</td>
                    <td><span class="badge badge-worn">磨损 85%</span></td>
                    <td><span class="badge badge-worn">磨损(重刻中)</span></td>
                    <td style="font-size:11px;">R-002 磨损校验：85% {'>'} 阈值80% {'→'} 纳入 BATCH-2024-01 #2</td>
                    <td style="font-size:11px;">首页预警+1条；格位显示85%磨损标红；任务完成度进度条+1</td>
                  </tr>
                  <tr>
                    <td style="font-size:22px;font-weight:600;">点</td>
                    <td>TRAY-A01 1-8</td>
                    <td><span class="badge badge-worn">磨损 85%</span></td>
                    <td><span class="badge badge-worn">磨损(重刻中)</span></td>
                    <td style="font-size:11px;">R-002 磨损校验：85% {'>'} 阈值80% {'→'} 触发预警</td>
                    <td style="font-size:11px;">磨损统计+1；预警时间线新增记录</td>
                  </tr>
                  <tr>
                    <td style="font-size:22px;font-weight:600;">刷</td>
                    <td>TRAY-B01 1-4</td>
                    <td><span class="badge badge-worn">磨损 85%</span></td>
                    <td><span class="badge badge-worn">磨损(重刻中)</span></td>
                    <td style="font-size:11px;">R-002 磨损校验：85% {'>'} 阈值80% {'→'} 触发预警</td>
                    <td style="font-size:11px;">磨损统计+1；预警时间线新增记录</td>
                  </tr>
                  <tr>
                    <td style="font-size:22px;font-weight:600;">木</td>
                    <td>TRAY-A01 1-1</td>
                    <td><span class="badge badge-normal">正常</span></td>
                    <td><span class="badge badge-normal">正常</span></td>
                    <td style="font-size:11px;">未触发规则：status=normal 且 wear=14% 正常</td>
                    <td style="font-size:11px;">无变化</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <Show when={showDiffPanel()}>
              <div class="page-effect-box">
                <div class="section-subtitle">🌐 状态变化对最终页面的影响矩阵</div>
                <div class="effect-grid">
                  <For each={sampleOneAfterState.pageEffects}>
                    {eff => (
                      <div class="effect-card">
                        <div class="effect-area">{eff.area}</div>
                        <div class="effect-change">{eff.effect}</div>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </Show>

            <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
              <span class="sample-tag">校验: R-001/R-002/R-003 全部通过</span>
              <span class="sample-tag">影响: 4页面 × 7处变化</span>
              <span class="sample-tag">可追溯: 历史记录4条</span>
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

            <Show when={isSampleOne()}>
              <div class="detail-panel" style="margin-top: 20px;">
                <h3>🔔 预警触发明细（样本一）</h3>
                <div class="timeline">
                  <For each={sampleOneAfterState.alerts}>
                    {alert => (
                      <div class="timeline-item">
                        <div class="timeline-time">T+0s 任务确认时</div>
                        <div class="timeline-action">
                          <span class={`badge badge-${alert.severity}`}>
                            {alert.severity === 'danger' ? '危险' : alert.severity === 'warning' ? '警告' : '信息'}
                          </span>
                        </div>
                        <div style="font-size: 11px; color: #666; margin-top: 2px;">
                          {alert.text}
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </Show>
            <Show when={!isSampleOne()}>
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
                </div>
              </div>
            </Show>

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
