import { createSignal, onMount, For, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";

interface Task {
  id: number;
  task_no: string;
  title: string;
  client: string;
  status: string;
  priority: string;
  deadline: string;
  carve_plan_count: number;
  related_batches: string[];
  required_chars: string[];
}

export default function TasksList() {
  const navigate = useNavigate();
  const [tasks, setTasks] = createSignal<Task[]>([]);
  const [showCreateModal, setShowCreateModal] = createSignal(false);

  onMount(() => {
    loadTasks();
  });

  async function loadTasks() {
    const res = await fetch('/api/tasks');
    const data = await res.json();
    setTasks(data);
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

  return (
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <div>
          <h2 class="page-title">印刷任务</h2>
          <p class="page-subtitle">管理印刷任务需求，关联补刻计划，跟踪任务进度</p>
        </div>
        <button class="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + 新建任务
        </button>
      </div>

      <div class="sample-section">
        <div class="sample-title">
          <span>📋</span>
          <span>明细记录说明</span>
        </div>
        <p class="sample-desc">
          印刷任务是系统的<span class="sample-tag">明细记录</span>之一，保存客户印刷需求和所需汉字清单。
          任务确认后系统自动分析缺字情况，生成预警并关联补刻批次。
          每个任务可对应多个补刻计划，支持优先级排序和截止日期追踪。
        </p>
      </div>

      <div class="card">
        <table>
          <thead>
            <tr>
              <th>任务编号</th>
              <th>标题</th>
              <th>客户</th>
              <th>所需字数</th>
              <th>状态</th>
              <th>优先级</th>
              <th>截止日期</th>
              <th>关联批次</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <For each={tasks()}>
              {task => (
                <tr>
                  <td><strong>{task.task_no}</strong></td>
                  <td>{task.title}</td>
                  <td>{task.client}</td>
                  <td>
                    <div style="display: flex; flex-wrap: wrap; gap: 2px; max-width: 200px;">
                      <For each={task.required_chars.slice(0, 5)}>
                        {ch => <span class="character-badge">{ch}</span>}
                      </For>
                      <Show when={task.required_chars.length > 5}>
                        <span style="font-size: 11px; color: #999; align-self: center;">
                          +{task.required_chars.length - 5}
                        </span>
                      </Show>
                    </div>
                  </td>
                  <td><span class={`badge badge-${task.status}`}>{statusLabels[task.status]}</span></td>
                  <td><span class={`badge badge-${task.priority}`}>{priorityLabels[task.priority]}</span></td>
                  <td>{task.deadline}</td>
                  <td>
                    <For each={task.related_batches}>
                      {batch => (
                        <span style="font-size: 11px; color: var(--color-info); display: block;">
                          {batch}
                        </span>
                      )}
                    </For>
                    <Show when={task.related_batches.length === 0}>
                      <span style="font-size: 11px; color: #999;">暂无</span>
                    </Show>
                  </td>
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

      <Show when={showCreateModal()}>
        <div class="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div class="modal" onClick={e => e.stopPropagation()}>
            <div class="modal-header">
              <h3 class="modal-title">新建印刷任务</h3>
              <button class="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <div class="form-group">
              <label class="form-label">任务标题</label>
              <input type="text" class="form-input" placeholder="例如：古籍复刻-卷二" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">客户名称</label>
                <input type="text" class="form-input" placeholder="例如：中华书局" />
              </div>
              <div class="form-group">
                <label class="form-label">截止日期</label>
                <input type="date" class="form-input" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">优先级</label>
              <select class="form-input">
                <option value="normal">普通</option>
                <option value="high">高</option>
                <option value="urgent">紧急</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">所需汉字（每行一个或空格分隔）</label>
              <textarea class="form-textarea" placeholder="木 活 字 盘 缺 字 盘 点 系 统"></textarea>
            </div>
            <div class="modal-actions">
              <button class="btn btn-secondary" onClick={() => setShowCreateModal(false)}>取消</button>
              <button class="btn btn-primary" onClick={() => setShowCreateModal(false)}>创建任务</button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
