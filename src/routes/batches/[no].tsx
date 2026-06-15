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

const sampleThreeData = {
  isRollbackSample: (no: string) => no === 'BATCH-2024-01R',

  v3Original: {
    version: 3,
    label: '回滚前（V3 错误版本）',
    totalChars: 14,
    completedChars: 9,
    status: '已完成',
    plans: [
      { char: '木', qty: 2, priority: 'urgent', status: 'completed', added: '创建批次时' },
      { char: '活', qty: 2, priority: 'high', status: 'completed', added: '创建批次时' },
      { char: '字', qty: 2, priority: 'high', status: 'completed', added: '创建批次时' },
      { char: '缺', qty: 3, priority: 'urgent', status: 'completed', added: 'V2 新增' },
      { char: '盘', qty: 2, priority: 'high', status: 'completed', added: 'V2 新增' },
      { char: '点', qty: 2, priority: 'urgent', status: 'completed', added: 'V3 异常新增(错误)' },
      { char: '刷', qty: 1, priority: 'normal', status: 'completed', added: 'V3 异常新增(错误)' },
    ],
    pagesAffected: [
      '首页批次进度 9/14 = 64%',
      'TRAY-A01：2 格变为「已完成」',
      'TRAY-B01：1 格变为「已完成」',
      'TASK-003 完成度 3/3 = 100%',
      '预警数 -2（完成后清除）',
      '导出结果：14字 × 完成率64%'
    ]
  },

  v2Target: {
    version: 2,
    label: '回滚后（V2 正确版本）',
    totalChars: 11,
    completedChars: 7,
    status: '进行中',
    plans: [
      { char: '木', qty: 2, priority: 'urgent', status: 'completed', added: '创建批次时' },
      { char: '活', qty: 2, priority: 'high', status: 'completed', added: '创建批次时' },
      { char: '字', qty: 2, priority: 'high', status: 'completed', added: '创建批次时' },
      { char: '缺', qty: 3, priority: 'urgent', status: 'completed', added: 'V2 新增' },
      { char: '盘', qty: 2, priority: 'high', status: 'in_progress', added: 'V2 新增' },
    ],
    pagesAffected: [
      '首页批次进度 7/11 = 63%',
      'TRAY-A01：2 格变回「补刻中」',
      'TRAY-B01：1 格变回「补刻中」',
      'TASK-003 完成度 1/3 = 33%（「缺」「刷」未完成）',
      '预警数 +2（「点」「刷」恢复预警状态）',
      '导出结果：11字 × 完成率63%（备注：回滚自V3）'
    ]
  },

  rollbackReasons: [
    {
      rule: 'R-201 批次完整性校验',
      issue: 'V3 版本中「点」和「刷」两字在验收时发现字模不符合客户要求的「乾隆雕版体」标准，需要退回重新雕刻',
      cause: '操作人员在 V3 版本误将标准宋体字模标记为完成',
      action: '触发回滚至 V2，撤销 V3 引入的 2 个错误完成状态'
    },
    {
      rule: 'R-202 任务关联校验',
      issue: 'V3 中「刷」字关联 TASK-002，但 TASK-002 实际未要求此字的加急补刻',
      cause: '批次分配任务时选择错误',
      action: '解除错误的任务关联，「刷」字状态回退为 in_progress'
    }
  ],

  rollbackRules: [
    { code: 'R-301', name: '版本链存在性校验', desc: '回滚目标 V2 必须在 previous_versions 中且哈希一致', result: 'PASS' },
    { code: 'R-302', name: '未完成任务保护', desc: '若 V3 中完成的字已被印刷任务使用，则禁止回滚', result: 'PASS（未被使用）' },
    { code: 'R-303', name: '格位状态同步校验', desc: '回滚后对应字盘格位状态必须从 completed → in_progress', result: 'AUTO-EXECUTE' },
    { code: 'R-304', name: '预警恢复校验', desc: '回滚后相关预警必须从未触发 → 重新触发', result: 'AUTO-EXECUTE' },
    { code: 'R-305', name: '历史记录审计', desc: '回滚操作本身必须写入历史，标记 OPERATOR=rollback_engine', result: 'AUTO-EXECUTE' }
  ]
};

export default function BatchDetail() {
  const params = useParams();
  const navigate = useNavigate();
  const batchNo = () => params.no;

  const [batch, setBatch] = createSignal<Batch | null>(null);
  const [isRollbackSample, setIsRollbackSample] = createSignal(false);
  const [compareVersion, setCompareVersion] = createSignal<number | null>(null);
  const [showDiffPanel, setShowDiffPanel] = createSignal(true);
  const [showRollbackModal, setShowRollbackModal] = createSignal(false);
  const [rollbackProgress, setRollbackProgress] = createSignal<{ step: number; msg: string; done: boolean }[]>([]);

  onMount(() => {
    loadBatch();
    setIsRollbackSample(sampleThreeData.isRollbackSample(batchNo()));
  });

  async function loadBatch() {
    const res = await fetch(`/api/batches/${batchNo()}`);
    const data = await res.json();
    setBatch(data);
  }

  async function executeRollback() {
    setShowRollbackModal(true);
    setRollbackProgress([]);
    const steps = [
      '🔍 R-301 校验：版本链检查 V2 存在性...',
      '✅ R-301 通过：previous_versions[0] = BATCH-2024-01 v2 存在',
      '🔍 R-302 校验：检查未完成任务保护...',
      '✅ R-302 通过：V3 完成的字未被印刷任务排印',
      '⚙️  R-303 执行：同步格位状态 completed → in_progress...',
      '✅ R-303 执行完成：2 字 × 2 格位状态回滚',
      '⚙️  R-304 执行：恢复预警（磨损预警 ×2）...',
      '✅ R-304 执行完成：预警 +2 条（ID=7,8）',
      '⚙️  R-305 执行：写入回滚历史记录...',
      '✅ R-305 执行完成：3 条历史记录（OPERATOR=rollback_engine）',
      '',
      '🎉 回滚完成！批次已从 V3 → V2。',
      '📊 结果：总字数 14→11，完成数 9→7，状态「已完成」→「进行中」'
    ];
    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 250));
      setRollbackProgress(p => [...p, { step: i + 1, msg: steps[i], done: steps[i].includes('✅') || steps[i].includes('🎉') || steps[i] === '' || steps[i].startsWith('📊') }]);
    }
  }

  const statusLabels: Record<string, string> = {
    'draft': '草稿',
    'in_progress': '进行中',
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

  return (
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <button class="btn btn-outline btn-sm" onClick={() => navigate('/batches')}>
          ← 返回批次列表
        </button>
        <div style="display: flex; gap: 8px;">
          <Show when={isRollbackSample()}>
            <button class="btn btn-outline btn-sm" onClick={() => setShowDiffPanel(!showDiffPanel())}>
              {showDiffPanel() ? '收起' : '📊'} 版本对比
            </button>
            <button 
              class="btn btn-primary btn-sm" 
              onClick={executeRollback}
              style="background: #7b1fa2;"
            >
              ⏪ 执行回滚到 V2
            </button>
          </Show>
        </div>
      </div>

      <h2 class="page-title">补刻批次 {batchNo()}</h2>
      <Show when={batch()}>
        <p class="page-subtitle">
          版本 v{batch()!.version} · {statusLabels[batch()!.status]} · 
          进度 {batch()!.completed_chars}/{batch()!.total_chars}
          <Show when={batch()!.parent_batch}> · 父批次 {batch()!.parent_batch}</Show>
        </p>
      </Show>

      <Show when={isRollbackSample()}>
        <div class="sample-section" style="border-left: 4px solid #7b1fa2;">
          <div class="sample-title">
            <span>⏪</span>
            <span>样本三：专属记录需要回滚或重算（批次版本回滚）</span>
            <span class="sample-tag" style="background: #F3E5F5; color: #7b1fa2;">版本回滚</span>
          </div>
          <p class="sample-desc">
            <strong>BATCH-2024-01R</strong> 为 BATCH-2024-01 的回滚专用批次副本。
            V3 版本中 2 个字（「点」「刷」）被<strong>错误标记为完成</strong>，
            经过<strong>版本完整性校验 + 任务关联校验</strong>后，执行<strong>版本回滚</strong>操作，
            从 V3 退回到 V2。系统自动执行 <strong>R-301~R-305</strong> 规则完成格位、预警、历史记录的同步回滚。
          </p>

          <Show when={showDiffPanel()}>
            <div class="validation-logic-box" style="border-top: 3px solid #7b1fa2;">
              <div class="validation-title" style="background: #F3E5F5; color: #6a1b9a;">
                <span>⚙️</span> 回滚校验规则引擎（R-301 ~ R-305）
              </div>
              <div class="validation-rules">
                <For each={sampleThreeData.rollbackRules}>
                  {rule => (
                    <div class="validation-rule">
                      <div class="rule-header">
                        <span class="rule-code" style="background: #7b1fa2;">{rule.code}</span>
                        <span class="rule-name">{rule.name}</span>
                        <span class={`rule-result ${rule.result === 'PASS' ? 'pass' : rule.result === 'AUTO-EXECUTE' ? 'info' : 'fail'}`}>
                          {rule.result}
                        </span>
                      </div>
                      <div class="rule-body">
                        <div style="font-size: 11px; color: #666;">{rule.desc}</div>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </div>

            <div style="margin-top: 16px;">
              <div class="section-subtitle">🧐 回滚触发原因分析</div>
              <For each={sampleThreeData.rollbackReasons}>
                {reason => (
                  <div style="background: #F3E5F5; padding: 10px; border-radius: 6px; margin-bottom: 8px;">
                    <div style="font-size: 12px; font-weight: 600; color: #6a1b9a; margin-bottom: 4px;">
                      {reason.rule}
                    </div>
                    <div style="font-size: 11px; color: #333; margin-bottom: 3px;">
                      <strong>问题：</strong>{reason.issue}
                    </div>
                    <div style="font-size: 11px; color: #e65100; margin-bottom: 3px;">
                      <strong>根因：</strong>{reason.cause}
                    </div>
                    <div style="font-size: 11px; color: #2e7d32;">
                      <strong>处置：</strong>{reason.action}
                    </div>
                  </div>
                )}
              </For>
            </div>

            <div class="before-after-diff" style="margin-top: 16px;">
              <div class="diff-header">
                <span class="diff-label before" style="background: #F3E5F5; color: #6a1b9a;">🔴 V3 错误版本（回滚前）</span>
                <div class="diff-arrow" style="color: #7b1fa2;">回滚{"→"}</div>
                <span class="diff-label after" style="background: #E8F5E9; color: #2e7d32;">✅ V2 正确版本（回滚后）</span>
              </div>

              <div class="diff-grid">
                <div class="diff-item before">
                  <div class="diff-item-label">批次状态</div>
                  <div class="diff-item-value"><span class="badge badge-completed">已完成</span></div>
                </div>
                <div class="diff-item after">
                  <div class="diff-item-label">批次状态</div>
                  <div class="diff-item-value"><span class="badge badge-in_progress">进行中</span></div>
                </div>

                <div class="diff-item before">
                  <div class="diff-item-label">补刻总字数</div>
                  <div class="diff-item-value">14 字</div>
                </div>
                <div class="diff-item after">
                  <div class="diff-item-label">补刻总字数</div>
                  <div class="diff-item-value" style="color: #2e7d32;">11 字（-3）</div>
                </div>

                <div class="diff-item before">
                  <div class="diff-item-label">已完成 / 完成率</div>
                  <div class="diff-item-value">9 / 14 = 64%</div>
                </div>
                <div class="diff-item after">
                  <div class="diff-item-label">已完成 / 完成率</div>
                  <div class="diff-item-value" style="color: #2e7d32;">7 / 11 = 63%</div>
                </div>

                <div class="diff-item before">
                  <div class="diff-item-label">关联预警</div>
                  <div class="diff-item-value">0 条（已清除）</div>
                </div>
                <div class="diff-item after">
                  <div class="diff-item-label">关联预警</div>
                  <div class="diff-item-value" style="color: #f57c00;">+2 条恢复</div>
                </div>

                <div class="diff-item before">
                  <div class="diff-item-label">TASK-003 完成度</div>
                  <div class="diff-item-value">3/3 = 100%</div>
                </div>
                <div class="diff-item after">
                  <div class="diff-item-label">TASK-003 完成度</div>
                  <div class="diff-item-value" style="color: #e65100;">1/3 = 33%</div>
                </div>

                <div class="diff-item before">
                  <div class="diff-item-label">历史记录新增</div>
                  <div class="diff-item-value">0 条</div>
                </div>
                <div class="diff-item after">
                  <div class="diff-item-label">历史记录新增</div>
                  <div class="diff-item-value" style="color: #7b1fa2;">+3 条（回滚审计）</div>
                </div>
              </div>
            </div>

            <div class="char-diff-table" style="margin-top: 16px;">
              <div class="section-subtitle">📝 逐字状态变化（V3 {"→"} V2 回滚）</div>
              <table class="diff-table">
                <thead>
                  <tr>
                    <th>汉字</th>
                    <th>所属字盘</th>
                    <th>数量</th>
                    <th>V3（回滚前）</th>
                    <th>V2（回滚后）</th>
                    <th>回滚校验原因</th>
                    <th>对最终页面影响</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="background: #f5f5f5;">
                    <td style="font-size:20px;">木</td>
                    <td>TRAY-A01 1-1</td>
                    <td>2</td>
                    <td><span class="badge badge-completed">已完成</span></td>
                    <td><span class="badge badge-completed">已完成</span></td>
                    <td style="font-size:11px;">V2 已完成 {"→"} V3 保留，无变更</td>
                    <td style="font-size:11px;">无变化</td>
                  </tr>
                  <tr style="background: #f5f5f5;">
                    <td style="font-size:20px;">活</td>
                    <td>TRAY-A01 1-2</td>
                    <td>2</td>
                    <td><span class="badge badge-completed">已完成</span></td>
                    <td><span class="badge badge-completed">已完成</span></td>
                    <td style="font-size:11px;">V2 已完成 {"→"} V3 保留，无变更</td>
                    <td style="font-size:11px;">无变化</td>
                  </tr>
                  <tr style="background: #f5f5f5;">
                    <td style="font-size:20px;">字</td>
                    <td>TRAY-A01 1-3</td>
                    <td>2</td>
                    <td><span class="badge badge-completed">已完成</span></td>
                    <td><span class="badge badge-completed">已完成</span></td>
                    <td style="font-size:11px;">V2 已完成 {"→"} V3 保留，无变更</td>
                    <td style="font-size:11px;">无变化</td>
                  </tr>
                  <tr style="background: #f5f5f5;">
                    <td style="font-size:20px;">缺</td>
                    <td>TRAY-A01 1-5</td>
                    <td>3</td>
                    <td><span class="badge badge-completed">已完成</span></td>
                    <td><span class="badge badge-completed">已完成</span></td>
                    <td style="font-size:11px;">V2 已完成 {"→"} V3 保留，无变更</td>
                    <td style="font-size:11px;">无变化</td>
                  </tr>
                  <tr style="background: #FFF3E0;">
                    <td style="font-size:20px;">盘</td>
                    <td>TRAY-A01 1-4</td>
                    <td>2</td>
                    <td><span class="badge badge-completed">已完成</span></td>
                    <td><span class="badge badge-in_progress">进行中</span></td>
                    <td style="font-size:11px;">R-201: V3 标记完成但验收不合格<br/>字模非「乾隆雕版体」</td>
                    <td style="font-size:11px;">格位 1-4 颜色：绿{"→"}橙<br/>进度条 -1<br/>预警恢复 1 条</td>
                  </tr>
                  <tr style="background: #FFEBEE;">
                    <td style="font-size:20px;">点</td>
                    <td>TRAY-A01 1-8</td>
                    <td>2</td>
                    <td><span class="badge badge-completed">已完成 ❌</span></td>
                    <td><span style="color: #999; text-decoration: line-through;">已移除</span></td>
                    <td style="font-size:11px;">R-201: 宋体字模被错误标记<br/>R-202: TASK-003 实际未要求此字</td>
                    <td style="font-size:11px;">批次总字数 14{"→"}11<br/>完成数 9{"→"}7<br/>预警 +1「磨损重刻」</td>
                  </tr>
                  <tr style="background: #FFEBEE;">
                    <td style="font-size:20px;">刷</td>
                    <td>TRAY-B01 1-4</td>
                    <td>1</td>
                    <td><span class="badge badge-completed">已完成 ❌</span></td>
                    <td><span style="color: #999; text-decoration: line-through;">已移除</span></td>
                    <td style="font-size:11px;">R-201: 字模验收不合格<br/>R-202: 任务关联错误（应为TASK-002）</td>
                    <td style="font-size:11px;">批次总字数 14{"→"}11<br/>任务完成度 100%{"→"}33%<br/>预警 +1「磨损重刻」</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style="margin-top: 16px;">
              <div class="section-subtitle">🌐 回滚操作对各页面的最终影响（V3 {"→"} V2）</div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div>
                  <div style="font-size: 12px; font-weight: 600; color: #6a1b9a; margin-bottom: 6px;">
                    🔴 V3 错误版本时
                  </div>
                  <div style="display: flex; flex-direction: column; gap: 4px;">
                    <For each={sampleThreeData.v3Original.pagesAffected}>
                      {line => (
                        <div style="font-size: 11px; color: #666; padding: 3px 8px; background: #F3E5F5; border-radius: 4px;">
                          {line}
                        </div>
                      )}
                    </For>
                  </div>
                </div>
                <div>
                  <div style="font-size: 12px; font-weight: 600; color: #2e7d32; margin-bottom: 6px;">
                    ✅ V2 正确版本（回滚后）
                  </div>
                  <div style="display: flex; flex-direction: column; gap: 4px;">
                    <For each={sampleThreeData.v2Target.pagesAffected}>
                      {line => (
                        <div style="font-size: 11px; color: #666; padding: 3px 8px; background: #E8F5E9; border-radius: 4px;">
                          {line}
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </div>
            </div>

            <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
              <span class="sample-tag" style="background: #F3E5F5; color: #7b1fa2;">
                校验: R-201/R-202 触发回滚
              </span>
              <span class="sample-tag" style="background: #E8F5E9; color: #2e7d32;">
                执行: R-301~305 自动同步
              </span>
              <span class="sample-tag">
                影响: 6页面 × 12处变化
              </span>
              <span class="sample-tag" style="background: #E3F2FD; color: #1565c0;">
                可追溯: 回滚审计日志 3条
              </span>
            </div>
          </Show>
        </div>
      </Show>

      <div class="layout-2col">
        <div>
          <div class="card">
            <h3 class="card-title">📋 批次基础信息</h3>
            <Show when={batch()}>
              <div class="detail-row">
                <span class="detail-label">批次编号</span>
                <span class="detail-value"><strong>{batch()!.batch_no}</strong></span>
              </div>
              <div class="detail-row">
                <span class="detail-label">状态</span>
                <span class={`badge badge-${batch()!.status}`}>{statusLabels[batch()!.status]}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">当前版本</span>
                <span class="detail-value">
                  <strong style="font-size: 18px; color: var(--color-primary);">v{batch()!.version}</strong>
                  <Show when={batch()!.previous_versions && batch()!.previous_versions.length > 0}>
                    <span style="margin-left: 8px; font-size: 11px; color: #999;">
                      历史版本: 
                      <For each={batch()!.previous_versions}>
                        {(v, i) => (
                          <span onClick={() => setCompareVersion(v.version)} style="margin-left: 4px; cursor: pointer; text-decoration: underline;">
                            v{v.version}{i() < batch()!.previous_versions.length - 1 ? ',' : ''}
                          </span>
                        )}
                      </For>
                    </span>
                  </Show>
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">完成进度</span>
                <div style="flex: 1;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px;">
                    <span>{batch()!.completed_chars}/{batch()!.total_chars} 字</span>
                    <span>{Math.round(batch()!.completed_chars / batch()!.total_chars * 100)}%</span>
                  </div>
                  <div class="progress-bar">
                    <div 
                      class="progress-fill success" 
                      style={`width: ${batch()!.completed_chars / batch()!.total_chars * 100}%;`}
                    />
                  </div>
                </div>
              </div>
              <div class="detail-row">
                <span class="detail-label">开始日期</span>
                <span class="detail-value">{batch()!.started_at || '-'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">完成日期</span>
                <span class="detail-value">{batch()!.completed_at || '-'}</span>
              </div>
            </Show>
          </div>

          <div class="card" style="margin-top: 16px;">
            <h3 class="card-title">🔨 补刻计划列表</h3>
            <Show when={batch() && batch()!.plans.length === 0}>
              <div class="empty-state">
                <div class="empty-icon">📭</div>
                <div class="empty-text">暂无补刻计划</div>
              </div>
            </Show>
            <Show when={batch() && batch()!.plans.length > 0}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>汉字</th>
                    <th>数量</th>
                    <th>优先级</th>
                    <th>状态</th>
                    <th>关联任务</th>
                  </tr>
                </thead>
                <tbody>
                  <For each={batch()!.plans}>
                    {plan => (
                      <tr>
                        <td>{plan.id}</td>
                        <td style="font-size: 18px;">{plan.character}</td>
                        <td>{plan.quantity}</td>
                        <td><span class={`badge badge-${plan.priority}`}>{priorityLabels[plan.priority]}</span></td>
                        <td><span class={`badge badge-${plan.status}`}>{planStatusLabels[plan.status]}</span></td>
                        <td style="font-size: 11px;">
                          <Show when={plan.task_title}>
                            <span onClick={() => navigate(`/tasks/${plan.task_id}`)} style="cursor: pointer; color: var(--color-primary);">
                              {plan.task_no} {plan.task_title}
                            </span>
                          </Show>
                          <Show when={!plan.task_title}>
                            <span style="color: #999;">-</span>
                          </Show>
                        </td>
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
            <h3>📊 完成度统计</h3>
            <Show when={batch()}>
              <div style="display: flex; gap: 8px; margin-bottom: 16px;">
                <div class="stat-card success" style="flex: 1; padding: 10px; margin-bottom: 0;">
                  <div class="stat-label">已完成</div>
                  <div class="stat-value success">{batch()!.completed_chars}</div>
                </div>
                <div class="stat-card warning" style="flex: 1; padding: 10px; margin-bottom: 0;">
                  <div class="stat-label">进行中</div>
                  <div class="stat-value warning">
                    {batch()!.plans.filter(p => p.status === 'in_progress').length}
                  </div>
                </div>
                <div class="stat-card" style="flex: 1; padding: 10px; margin-bottom: 0;">
                  <div class="stat-label">待处理</div>
                  <div class="stat-value">
                    {batch()!.plans.filter(p => p.status === 'pending').length}
                  </div>
                </div>
              </div>
              <div style="font-size: 11px; color: #666;">
                <div style="margin-bottom: 4px;">• 总计划数: {batch()!.plans.length}</div>
                <div style="margin-bottom: 4px;">• 版本数: {batch()!.version}（历史 {batch()!.previous_versions?.length || 0} 个）</div>
              </div>
            </Show>
          </div>

          <div class="detail-panel" style="margin-top: 16px;">
            <h3>📜 历史变更</h3>
            <Show when={batch()}>
              <div class="timeline">
                <div class="timeline-item">
                  <div class="timeline-time">{batch()!.created_at.slice(0, 16)}</div>
                  <div class="timeline-action">
                    <span class="badge badge-draft">创建批次</span>
                  </div>
                  <div style="font-size: 11px; color: #666; margin-top: 2px;">v1 创建</div>
                </div>
                <For each={batch()!.history}>
                  {item => (
                    <div class="timeline-item">
                      <div class="timeline-time">{item.timestamp.slice(0, 16)}</div>
                      <div class="timeline-action">
                        <span class="badge badge-draft">{item.action_type}</span>
                        <span style="font-size: 18px; margin-left: 4px;">{item.character}</span>
                      </div>
                      <div style="font-size: 11px; color: #666; margin-top: 2px;">
                        {item.old_status} {"→"} <strong>{item.new_status}</strong>
                      </div>
                      <div style="font-size: 10px; color: #999;">{item.operator}</div>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </div>

          <div class="detail-panel" style="margin-top: 16px;">
            <h3>⚡ 批次操作</h3>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <button class="btn btn-outline btn-sm" style="width: 100%;">📋 导出补刻清单</button>
              <button class="btn btn-outline btn-sm" style="width: 100%;">📥 下载字模验收报告</button>
              <button class="btn btn-outline btn-sm" style="width: 100%;">🔄 重算批次进度</button>
            </div>
          </div>
        </div>
      </div>

      <Show when={showRollbackModal()}>
        <div class="modal-backdrop" onClick={() => { setShowRollbackModal(false); loadBatch(); }}>
          <div class="modal" style="max-width: 600px;" onClick={e => e.stopPropagation()}>
            <div class="modal-header">
              <h3 class="modal-title">⏪ 批次回滚执行中：V3 {"→"} V2</h3>
              <button class="modal-close" onClick={() => { setShowRollbackModal(false); loadBatch(); }}>✕</button>
            </div>
            <div class="modal-body">
              <div style="background: #263238; color: #AED581; padding: 14px; border-radius: 6px; font-family: 'SF Mono', Monaco, monospace; font-size: 12px; line-height: 1.9; min-height: 260px;">
                <For each={rollbackProgress()}>
                  {p => (
                    <div style="color: p.done ? '#AED581' : '#FFF59D';">
                      {p.msg || '\u00A0'}
                    </div>
                  )}
                </For>
              </div>
            </div>
            <div class="modal-footer">
              <Show when={rollbackProgress().some(p => p.msg.startsWith('📊'))}>
                <button class="btn btn-primary" onClick={() => { setShowRollbackModal(false); loadBatch(); }}>
                  确认回滚完成
                </button>
              </Show>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
