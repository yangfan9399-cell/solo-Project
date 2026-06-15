import { createSignal, onMount, For, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";

interface TrayInfo {
  tray_id: string;
  total_slots: number;
  normal_count: number;
  missing_count: number;
  worn_count: number;
  reserved_count: number;
}

interface TaskInfo {
  id: number;
  task_no: string;
  title: string;
  client: string;
  status: string;
  priority: string;
  deadline: string;
  carve_plan_count: number;
}

interface BatchInfo {
  id: number;
  batch_no: string;
  total_chars: number;
  completed_chars: number;
  status: string;
  version: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [trays, setTrays] = createSignal<TrayInfo[]>([]);
  const [tasks, setTasks] = createSignal<TaskInfo[]>([]);
  const [batches, setBatches] = createSignal<BatchInfo[]>([]);
  const [alerts, setAlerts] = createSignal<any[]>([]);
  const [activeSample, setActiveSample] = createSignal<number | null>(null);

  onMount(() => {
    loadData();
  });

  async function loadData() {
    const [traysRes, tasksRes, batchesRes, alertsRes] = await Promise.all([
      fetch('/api/trays').then(r => r.json()),
      fetch('/api/tasks').then(r => r.json()),
      fetch('/api/batches').then(r => r.json()),
      fetch('/api/alerts?all=1').then(r => r.json())
    ]);
    
    setTrays(traysRes);
    setTasks(tasksRes);
    setBatches(batchesRes);
    setAlerts(alertsRes.alerts || []);
  }

  const totalSlots = () => trays().reduce((s, t) => s + t.total_slots, 0);
  const totalMissing = () => trays().reduce((s, t) => s + t.missing_count, 0);
  const totalWorn = () => trays().reduce((s, t) => s + t.worn_count, 0);
  const activeTasks = () => tasks().filter(t => t.status === 'in_production' || t.status === 'confirmed').length;
  const activeBatches = () => batches().filter(b => b.status === 'in_production' || b.status === 'approved').length;

  const samples = [
    {
      id: 1,
      title: '样本一：任务关联和缺字预警正常完成',
      desc: '印刷任务TASK-2024-001（古籍复刻-卷一）确认后，系统自动触发缺字分析，生成缺字预警，并关联到补刻批次BATCH-2024-01。完整展示任务→缺字分析→预警→补刻计划→批次关联的正向流程。',
      tags: ['正常流程', '任务关联', '缺字预警'],
      taskId: 1
    },
    {
      id: 2,
      title: '样本二：木活字字盘缺字盘点系统触发异常',
      desc: '模拟盘点异常场景：字「盘」标记为磨损，但同时出现在补刻计划中，状态冲突。展示系统如何检测和提示异常，以及磨损度阈值触发预警的边界情况。',
      tags: ['异常场景', '边界条件', '状态冲突'],
      taskId: null
    },
    {
      id: 3,
      title: '样本三：专属记录需要回滚或重算',
      desc: '批次BATCH-2024-01R为已回滚的补刻批次，展示版本追溯、回滚原因、以及回滚后字盘格位状态的变化。支持对比回滚前后的差异和重算机制。',
      tags: ['回滚', '版本对比', '重算'],
      taskId: null
    }
  ];

  async function runSample(sampleId: number) {
    if (sampleId === 1) {
      navigate('/tasks/1');
    } else if (sampleId === 2) {
      navigate('/trays/TRAY-A01');
    } else if (sampleId === 3) {
      navigate('/batches/BATCH-2024-01R');
    }
    setActiveSample(sampleId);
  }

  return (
    <div>
      <div class="sample-section">
        <div class="sample-title">
          <span>🧪</span>
          <span>边界样本演示区</span>
        </div>
        <p class="sample-desc">
          以下三个种子样本覆盖《木活字字盘缺字盘点系统》的核心业务场景。点击可直接跳转到对应场景查看详情，
          体验字盘格位、缺字预警、补刻批次、任务关联和版本回滚之间的联动关系。
        </p>
        <div class="sample-actions">
          <For each={samples}>
            {sample => (
              <button 
                class={`btn ${activeSample() === sample.id ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => runSample(sample.id)}
              >
                {sample.title}
              </button>
            )}
          </For>
        </div>
      </div>

      <h2 class="page-title">字盘总览</h2>
      <p class="page-subtitle">实时监控印坊字盘格位状态、缺字情况和补刻进度</p>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">总格位数</div>
          <div class="stat-value">{totalSlots()}</div>
        </div>
        <div class="stat-card success">
          <div class="stat-label">正常可用</div>
          <div class="stat-value success">{totalSlots() - totalMissing() - totalWorn()}</div>
        </div>
        <div class="stat-card danger">
          <div class="stat-label">缺字</div>
          <div class="stat-value danger">{totalMissing()}</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-label">磨损</div>
          <div class="stat-value warning">{totalWorn()}</div>
        </div>
        <div class="stat-card info">
          <div class="stat-label">进行中任务</div>
          <div class="stat-value">{activeTasks()}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">补刻批次</div>
          <div class="stat-value">{activeBatches()}</div>
        </div>
      </div>

      <div class="layout-2col">
        <div>
          <div class="card">
            <h3 class="card-title">📋 字盘状态分布</h3>
            <table>
              <thead>
                <tr>
                  <th>字盘编号</th>
                  <th>总格位</th>
                  <th>正常</th>
                  <th>缺字</th>
                  <th>磨损</th>
                  <th>预留</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <For each={trays()}>
                  {tray => (
                    <tr>
                      <td><strong>{tray.tray_id}</strong></td>
                      <td>{tray.total_slots}</td>
                      <td><span class="badge badge-normal">{tray.normal_count}</span></td>
                      <td><span class="badge badge-missing">{tray.missing_count}</span></td>
                      <td><span class="badge badge-worn">{tray.worn_count}</span></td>
                      <td><span class="badge badge-reserved">{tray.reserved_count}</span></td>
                      <td>
                        <button class="btn btn-sm btn-outline" onClick={() => navigate(`/trays/${tray.tray_id}`)}>
                          查看
                        </button>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>

          <div class="card">
            <h3 class="card-title">📝 印刷任务列表</h3>
            <table>
              <thead>
                <tr>
                  <th>任务编号</th>
                  <th>标题</th>
                  <th>客户</th>
                  <th>状态</th>
                  <th>优先级</th>
                  <th>截止日期</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <For each={tasks().slice(0, 5)}>
                  {task => (
                    <tr>
                      <td>{task.task_no}</td>
                      <td>{task.title}</td>
                      <td>{task.client}</td>
                      <td><span class={`badge badge-${task.status}`}>{task.status}</span></td>
                      <td><span class={`badge badge-${task.priority}`}>{task.priority}</span></td>
                      <td>{task.deadline}</td>
                      <td>
                        <button class="btn btn-sm btn-outline" onClick={() => navigate(`/tasks/${task.id}`)}>
                          详情
                        </button>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div class="detail-panel">
            <h3>🔔 最新预警</h3>
            <div class="timeline">
              <For each={alerts().slice(0, 8)}>
                {alert => (
                  <div class="timeline-item">
                    <div class="timeline-time">{alert.created_at}</div>
                    <div class="timeline-action">
                      <span class={`badge badge-${alert.severity}`}>{alert.severity}</span>
                      {' '}{alert.message}
                    </div>
                    <Show when={alert.task_no}>
                      <div class="timeline-op">关联任务: {alert.task_no}</div>
                    </Show>
                  </div>
                )}
              </For>
            </div>
          </div>

          <div class="detail-panel" style="margin-top: 20px;">
            <h3>🔨 补刻批次进度</h3>
            <For each={batches().slice(0, 4)}>
              {batch => {
                const progress = batch.total_chars > 0 
                  ? Math.round((batch.completed_chars / batch.total_chars) * 100) 
                  : 0;
                return (
                  <div style="margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                      <span style="font-size: 13px; font-weight: 500;">{batch.batch_no}</span>
                      <span class={`badge badge-${batch.status}`}>{batch.status}</span>
                    </div>
                    <div class="progress-bar">
                      <div 
                        class={`progress-fill ${progress === 100 ? 'success' : ''}`}
                        style={`width: ${progress}%`}
                      />
                    </div>
                    <div style="font-size: 11px; color: #999; margin-top: 4px;">
                      {batch.completed_chars}/{batch.total_chars} 字 · 版本 v{batch.version}
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      </div>
    </div>
  );
}
