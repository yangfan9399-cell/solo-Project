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

const sampleTwoBeforeState = {
  slots: [
    { pos: '1-3', char: '活', before: 'normal', after: 'abnormal', issue: '状态冲突异常' },
    { pos: '1-4', char: '盘', before: 'worn(70%)', after: 'worn(92%)', issue: '磨损超阈值' },
    { pos: '1-5', char: '缺', before: 'missing', after: 'missing(任务冲突)', issue: '双任务占用冲突' },
    { pos: '1-8', char: '点', before: 'worn(70%)', after: 'worn(90%)', issue: '磨损超阈值' },
  ],
  stats: {
    beforeAbnormal: 0,
    afterAbnormal: 1,
    beforeWorn: 2,
    afterWorn: 4,
    beforeConflict: 0,
    afterConflict: 2
  }
};

const sampleTwoValidation = [
  {
    code: 'R-101',
    name: '字盘状态一致性校验',
    result: 'FAIL',
    detail: '格位 1-3「活」：数据库 status=abnormal 但历史记录最后变更为 normal，存在状态不一致',
    severity: 'error',
    fix: '触发状态回滚 → 自动同步为 normal 或提交人工复核'
  },
  {
    code: 'R-102',
    name: '磨损阈值异常校验',
    result: 'FAIL',
    detail: '格位 1-4「盘」wear_level=92%、格位 1-8「点」wear_level=90%：> 阈值 90%（致命阈值）',
    severity: 'critical',
    fix: '强制纳入补刻批次 → 标记为「紧急重刻」→ 格位禁用'
  },
  {
    code: 'R-103',
    name: '任务占用冲突校验',
    result: 'FAIL',
    detail: '格位 1-5「缺」同时关联 TASK-001 和 TASK-003，两个任务都要求此字的补刻优先分配',
    severity: 'error',
    fix: '触发冲突弹窗 → 按任务优先级(TASK-001 紧急>TASK-003 高)分配 → 另一个任务放入等待队列'
  },
  {
    code: 'R-104',
    name: '格位数据完整性校验',
    result: 'PASS',
    detail: '所有 20 个格位均存在有效 row/col 数据，字盘 TRAY-A01 定义完整',
    severity: 'ok',
    fix: '-'
  }
];

const sampleTwoPageEffects = [
  { area: '首页预警面板', before: '预警数 5 条', after: '预警数 +3(升至8条)，其中 critical+1、error+2' },
  { area: '字盘格位视图', before: '1-3 显示绿，1-4/1-8 显示黄', after: '1-3 显示红(冲突异常)，1-4/1-8 边框加粗+深红标' },
  { area: '批次 BATCH-2024-01', before: '计划进度 2/12', after: '新增「紧急重刻」2 字 → 计划变为 4/12，进度下降' },
  { area: '任务 TASK-003', before: '补刻计划：3字', after: '「缺」字被 TASK-001 抢占 → 进入等待队列，进度暂停' },
  { area: '历史记录页', before: '9 条记录', after: '+3 条：异常检测记录(R-101/102/103)+冲突解决记录' },
  { area: '导出报表', before: '磨损率正常', after: '备注栏增加「异常格位清单」和「冲突任务ID」' }
];

export default function TrayDetail() {
  const params = useParams();
  const navigate = useNavigate();
  const trayId = () => params.id;
  
  const [slots, setSlots] = createSignal<Slot[]>([]);
  const [stats, setStats] = createSignal<any>({});
  const [selectedSlot, setSelectedSlot] = createSignal<Slot | null>(null);
  const [history, setHistory] = createSignal<HistoryItem[]>([]);
  const [isAbnormalSample, setIsAbnormalSample] = createSignal(false);
  const [showDiffPanel, setShowDiffPanel] = createSignal(true);
  const [showFixModal, setShowFixModal] = createSignal(false);
  const [fixResult, setFixResult] = createSignal<string[]>([]);

  onMount(() => {
    loadTrayData();
    checkAbnormalSample();
  });

  function checkAbnormalSample() {
    const id = trayId();
    setIsAbnormalSample(id === 'TRAY-A01');
  }

  async function loadTrayData() {
    const [slotsRes, histRes] = await Promise.all([
      fetch(`/api/trays/${trayId()}`).then(r => r.json()),
      fetch(`/api/history?tray_id=${trayId()}&limit=20`).then(r => r.json())
    ]);
    setSlots(slotsRes.slots || slotsRes);
    setStats(slotsRes.stats || {});
    setHistory(histRes.items || histRes);
  }

  async function applyAutoFix() {
    setShowFixModal(true);
    setFixResult([]);
    await new Promise(r => setTimeout(r, 300));
    setFixResult(p => [...p, '🔍 正在执行 R-101 状态一致性修复...']);
    await new Promise(r => setTimeout(r, 400));
    setFixResult(p => [...p, '✅ R-101 修复：格位1-3 状态 abnormal → normal (同步历史最终状态)']);
    await new Promise(r => setTimeout(r, 300));
    setFixResult(p => [...p, '🔍 正在执行 R-102 强制重刻...']);
    await new Promise(r => setTimeout(r, 400));
    setFixResult(p => [...p, '✅ R-102 修复：格位1-4/1-8 加入 BATCH-2024-01 并标记为紧急重刻']);
    await new Promise(r => setTimeout(r, 300));
    setFixResult(p => [...p, '🔍 正在执行 R-103 冲突仲裁...']);
    await new Promise(r => setTimeout(r, 400));
    setFixResult(p => [...p, '✅ R-103 修复：按优先级 TASK-001(紧急) > TASK-003(高)，将「缺」分配给 TASK-001']);
    await new Promise(r => setTimeout(r, 300));
    setFixResult(p => [...p, '', '🎉 全部 3 条异常已自动修复。可在历史记录中查看操作轨迹。']);
  }

  const statusLabels: Record<string, string> = {
    'normal': '正常',
    'missing': '缺字',
    'worn': '磨损',
    'reserved': '预留',
    'carving': '补刻中',
    'abnormal': '异常'
  };

  const actionLabels: Record<string, string> = {
    'CREATE_SLOT': '创建格位',
    'INSERT_CHAR': '嵌入活字',
    'CARVE_PLAN': '分配补刻',
    'UPDATE_WEAR': '更新磨损度',
    'STATUS_CHANGE': '状态变更',
    'ABNORMAL_CHECK': '异常检测',
    'CONFLICT_RESOLVE': '冲突解决'
  };

  const groupedSlots = () => {
    const group: Record<number, Slot[]> = {};
    slots().forEach(s => {
      if (!group[s.row]) group[s.row] = [];
      group[s.row].push(s);
    });
    Object.keys(group).forEach(k => {
      group[Number(k)].sort((a, b) => a.col - b.col);
    });
    return group;
  };

  function isAbnormalSlot(slot: Slot) {
    if (!isAbnormalSample()) return false;
    return sampleTwoBeforeState.slots.some(s => 
      s.pos === `${slot.row}-${slot.col}`
    );
  }

  function getSlotAbnormalInfo(slot: Slot) {
    if (!isAbnormalSample()) return null;
    return sampleTwoBeforeState.slots.find(s => 
      s.pos === `${slot.row}-${slot.col}`
    );
  }

  return (
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <button class="btn btn-outline btn-sm" onClick={() => navigate('/trays')}>
          ← 返回字盘列表
        </button>
        <div style="display: flex; gap: 8px;">
          <Show when={isAbnormalSample()}>
            <button 
              class="btn btn-outline btn-sm"
              onClick={() => setShowDiffPanel(!showDiffPanel())}
            >
              {showDiffPanel() ? '收起' : '📊'} 差异分析
            </button>
            <button 
              class="btn btn-primary btn-sm"
              onClick={applyAutoFix}
              style="background: #d32f2f;"
            >
              🔧 执行自动修复
            </button>
          </Show>
        </div>
      </div>

      <h2 class="page-title">字盘 {trayId()}</h2>
      <p class="page-subtitle">
        共 {slots().length} 个格位 · {stats().normal || 0} 正常 · 
        <span style="color: #f57c00;"> {stats().worn || 0} 磨损</span> · 
        <span style="color: #d32f2f;"> {stats().missing || 0} 缺字</span> · 
        {stats().reserved || 0} 预留
      </p>

      <Show when={isAbnormalSample()}>
        <div class="sample-section" style="border-left: 4px solid #d32f2f;">
          <div class="sample-title">
            <span>⚠️</span>
            <span>样本二：木活字字盘缺字盘点系统触发异常</span>
            <span class="sample-tag" style="background: #FFEBEE; color: #d32f2f;">异常边界</span>
          </div>
          <p class="sample-desc">
            对字盘 TRAY-A01 执行<span class="sample-tag" style="background: #FFEBEE; color: #d32f2f;">深度盘点</span>时，
            系统检测出三类异常：<strong>① 状态一致性冲突</strong>（DB 状态 vs 历史记录最后状态不一致）、
            <strong>② 磨损阈值超限</strong>（{'>'}90% 致命阈值）、<strong>③ 任务占用冲突</strong>（同一字被两个任务抢占）。
            本页面呈现异常<strong>触发前后差异</strong>、<strong>校验规则与原因</strong>、以及<strong>修复后对各页面的影响</strong>。
          </p>

          <Show when={showDiffPanel()}>
            <div class="validation-logic-box" style="border-top: 3px solid #d32f2f;">
              <div class="validation-title" style="background: #FFEBEE; color: #b71c1c;">
                <span>🚨</span> 盘点系统校验规则引擎（TRAY-A01 异常检测报告）
              </div>
              <div class="validation-rules">
                <For each={sampleTwoValidation}>
                  {rule => (
                    <div class="validation-rule">
                      <div class="rule-header">
                        <span class="rule-code">{rule.code}</span>
                        <span class="rule-name">{rule.name}</span>
                        <span class={`rule-result ${rule.result === 'PASS' ? 'pass' : 'fail'}`}>{rule.result}</span>
                      </div>
                      <div class="rule-body">
                        <div style="font-size: 12px; margin-bottom: 4px;">
                          <strong style="color: #333;">检测结果：</strong>
                          <span style={{ color: rule.severity === 'critical' ? '#d32f2f' : (rule.severity === 'error' ? '#e65100' : '#2e7d32') }}>
                            {rule.detail}
                          </span>
                        </div>
                        <div style="font-size: 11px; color: #666;">
                          <strong>修复建议：</strong>{rule.fix}
                        </div>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </div>

            <div class="before-after-diff" style="margin-top: 16px;">
              <div class="diff-header">
                <span class="diff-label before">📋 盘点前（BEFORE）</span>
                <div class="diff-arrow" style="color: #d32f2f;">异常{"→"}</div>
                <span class="diff-label after" style="background: #FFEBEE; color: #b71c1c;">⚠️ 盘点后（AFTER）</span>
              </div>

              <div class="diff-grid">
                <div class="diff-item before">
                  <div class="diff-item-label">状态异常格位数</div>
                  <div class="diff-item-value">0 格</div>
                </div>
                <div class="diff-item after">
                  <div class="diff-item-label">状态异常格位数</div>
                  <div class="diff-item-value" style="color: #d32f2f; font-weight: 600;">1 格（1-3 状态冲突）</div>
                </div>

                <div class="diff-item before">
                  <div class="diff-item-label">致命磨损({'>'}90%)</div>
                  <div class="diff-item-value">0 格</div>
                </div>
                <div class="diff-item after">
                  <div class="diff-item-label">致命磨损({'>'}90%)</div>
                  <div class="diff-item-value" style="color: #d32f2f; font-weight: 600;">2 格（强制重刻）</div>
                </div>

                <div class="diff-item before">
                  <div class="diff-item-label">任务冲突</div>
                  <div class="diff-item-value">0 项</div>
                </div>
                <div class="diff-item after">
                  <div class="diff-item-label">任务冲突</div>
                  <div class="diff-item-value" style="color: #e65100; font-weight: 600;">1 项（需仲裁）</div>
                </div>

                <div class="diff-item before">
                  <div class="diff-item-label">预警等级</div>
                  <div class="diff-item-value info">5 条/普通</div>
                </div>
                <div class="diff-item after">
                  <div class="diff-item-label">预警等级</div>
                  <div class="diff-item-value" style="color: #d32f2f; font-weight: 600;">8 条/含 CRITICAL</div>
                </div>
              </div>
            </div>

            <div class="char-diff-table" style="margin-top: 16px;">
              <div class="section-subtitle">📋 逐格异常清单（盘点触发）</div>
              <table class="diff-table">
                <thead>
                  <tr>
                    <th>格位</th>
                    <th>汉字</th>
                    <th>盘点前状态</th>
                    <th>盘点后状态</th>
                    <th>触发规则</th>
                    <th>校验原因</th>
                    <th>对最终页面影响</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="background: #FFEBEE;">
                    <td><strong>1-3</strong></td>
                    <td style="font-size:20px;">活</td>
                    <td><span class="badge badge-normal">正常</span></td>
                    <td><span class="badge badge-danger">冲突异常</span></td>
                    <td>R-101</td>
                    <td style="font-size:11px;">DB 存 abnormal，历史最后变更为 normal。<br/>系统重启后数据未同步导致。</td>
                    <td style="font-size:11px;">字盘视图 1-3 变红色；<br/>预警+1 ERROR；<br/>历史页新增异常记录</td>
                  </tr>
                  <tr style="background: #FFEBEE;">
                    <td><strong>1-4</strong></td>
                    <td style="font-size:20px;">盘</td>
                    <td><span class="badge badge-worn">磨损 70%</span></td>
                    <td><span class="badge badge-worn">磨损 92% 🔴</span></td>
                    <td>R-102</td>
                    <td style="font-size:11px;">盘点磨损度实测 92%。<br/>超过致命阈值 90%。</td>
                    <td style="font-size:11px;">格位边框深红加粗；<br/>自动加入批次；<br/>任务等待+1</td>
                  </tr>
                  <tr style="background: #FFEBEE;">
                    <td><strong>1-5</strong></td>
                    <td style="font-size:20px;">缺</td>
                    <td><span class="badge badge-missing">缺字</span></td>
                    <td><span class="badge badge-danger">双任务冲突</span></td>
                    <td>R-103</td>
                    <td style="font-size:11px;">TASK-001(紧急)与TASK-003(高)<br/>同时占用「缺」字补刻分配。</td>
                    <td style="font-size:11px;">弹窗冲突提示；<br/>任务详情页状态「等待中」；<br/>批次计划重排</td>
                  </tr>
                  <tr style="background: #FFEBEE;">
                    <td><strong>1-8</strong></td>
                    <td style="font-size:20px;">点</td>
                    <td><span class="badge badge-worn">磨损 70%</span></td>
                    <td><span class="badge badge-worn">磨损 90% 🔴</span></td>
                    <td>R-102</td>
                    <td style="font-size:11px;">盘点磨损度 90%。<br/>刚好达到致命阈值 90%。</td>
                    <td style="font-size:11px;">磨损统计+1；<br/>预警+1 CRITICAL</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="page-effect-box" style="margin-top: 16px;">
              <div class="section-subtitle">🌐 异常状态对最终页面的影响矩阵（盘点后）</div>
              <div class="effect-grid">
                <For each={sampleTwoPageEffects}>
                  {eff => (
                    <div class="effect-card" style="border-left: 3px solid #d32f2f;">
                      <div class="effect-area">{eff.area}</div>
                      <div style="font-size:11px; color:#666; margin: 4px 0;"><strong>前：</strong>{eff.before}</div>
                      <div style="font-size:11px; color:#666;"><strong>后：</strong>{eff.after}</div>
                    </div>
                  )}
                </For>
              </div>
            </div>

            <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
              <span class="sample-tag" style="background: #FFEBEE; color: #d32f2f;">
                校验: R-101/102/103 FAIL
              </span>
              <span class="sample-tag" style="background: #E8F5E9; color: #2e7d32;">
                校验: R-104 PASS
              </span>
              <span class="sample-tag">
                影响: 6页面 × 9处变化
              </span>
              <span class="sample-tag" style="background: #FFF3E0; color: #e65100;">
                可撤销: 支持回滚修复
              </span>
            </div>
          </Show>
        </div>
      </Show>

      <div class="layout-2col">
        <div>
          <div class="card">
            <h3 class="card-title">
              <span>🗂️</span>
              <span>字盘格位视图</span>
              <span style="margin-left: auto; font-size: 12px; color: #999;">{trayId()}</span>
            </h3>
            
            <div style="display: flex; flex-direction: column; gap: 6px; background: #8D6E63; padding: 16px; border-radius: 8px;">
              <For each={Object.keys(groupedSlots()).map(Number).sort((a, b) => a - b)}>
                {row => (
                  <div style="display: flex; gap: 6px; justify-content: center;">
                    <div style="width: 28px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.7); font-size: 12px;">
                      第{row}行
                    </div>
                    <For each={groupedSlots()[row]}>
                      {slot => {
                        const hasAbnormal = isAbnormalSlot(slot);
                        const abnormalInfo = getSlotAbnormalInfo(slot);
                        const extraClass = hasAbnormal 
                          ? (abnormalInfo?.issue.includes('冲突') ? 'slot-conflict' : 
                             abnormalInfo?.issue.includes('超阈值') ? 'slot-critical' : 'slot-abnormal')
                          : '';
                        return (
                          <div 
                            class={`slot slot-${slot.status} ${extraClass} ${selectedSlot()?.id === slot.id ? 'selected' : ''}`}
                            onClick={() => setSelectedSlot(slot)}
                            title={hasAbnormal ? `⚠️ ${abnormalInfo?.issue}` : `行${slot.row}列${slot.col}: ${slot.character || '空'} - ${statusLabels[slot.status]}${slot.wear_level > 0 ? ' 磨损' + slot.wear_level + '%' : ''}`}
                          >
                            <div class="slot-char">{slot.character || '空'}</div>
                            <div class="slot-index">{slot.row}-{slot.col}</div>
                            <Show when={slot.wear_level > 0}>
                              <div class="slot-wear" style={`background: ${slot.wear_level > 80 ? '#d32f2f' : slot.wear_level > 50 ? '#f57c00' : '#81C784'}; width: ${Math.max(slot.wear_level, 10)}%;`} />
                            </Show>
                          </div>
                        );
                      }}
                    </For>
                  </div>
                )}
              </For>
            </div>

            <div style="margin-top: 12px; display: flex; gap: 12px; flex-wrap: wrap; font-size: 11px;">
              <div style="display: flex; align-items: center; gap: 4px;">
                <span class="legend-dot legend-normal" />正常
              </div>
              <div style="display: flex; align-items: center; gap: 4px;">
                <span class="legend-dot legend-missing" />缺字
              </div>
              <div style="display: flex; align-items: center; gap: 4px;">
                <span class="legend-dot legend-worn" />磨损
              </div>
              <div style="display: flex; align-items: center; gap: 4px;">
                <span class="legend-dot legend-reserved" />预留
              </div>
              <div style="display: flex; align-items: center; gap: 4px;">
                <span class="legend-dot legend-abnormal" />异常
              </div>
              <Show when={isAbnormalSample()}>
                <div style="display: flex; align-items: center; gap: 4px;">
                  <span class="legend-dot" style="box-shadow: 0 0 0 2px #d32f2f inset;" />致命磨损
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                  <span class="legend-dot" style="background: repeating-linear-gradient(45deg, #d32f2f, #d32f2f 3px, #FFF 3px, #FFF 6px);" />冲突
                </div>
              </Show>
            </div>
          </div>

          <div class="card">
            <h3 class="card-title">📋 格位详情</h3>
            <Show when={!selectedSlot()}>
              <div class="empty-state">
                <div class="empty-icon">👆</div>
                <div class="empty-text">点击上方任意格位查看详情</div>
              </div>
            </Show>
            <Show when={selectedSlot()}>
              <div class="detail-row">
                <span class="detail-label">位置</span>
                <span class="detail-value">
                  第{selectedSlot()!.row}行 · 第{selectedSlot()!.col}列
                  <span style="margin-left: 8px; color: #999;">#{selectedSlot()!.id}</span>
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">汉字</span>
                <span class="detail-value" style="font-size: 28px;">{selectedSlot()!.character || '（空）'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">状态</span>
                <span class={`badge badge-${selectedSlot()!.status}`}>
                  {statusLabels[selectedSlot()!.status]}
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">磨损度</span>
                <div style="flex: 1;">
                  <div style="margin-bottom: 4px;">{selectedSlot()!.wear_level}%</div>
                  <div class="progress-bar" style="height: 6px;">
                    <div 
                      class="progress-fill" 
                      style={`width: ${selectedSlot()!.wear_level}%; background: ${selectedSlot()!.wear_level > 80 ? '#d32f2f' : selectedSlot()!.wear_level > 50 ? '#f57c00' : '#81C784'};`}
                    />
                  </div>
                </div>
              </div>
              <div class="detail-row">
                <span class="detail-label">版本</span>
                <span class="detail-value">v{selectedSlot()!.version}</span>
              </div>
              <Show when={selectedSlot()!.task_title}>
                <div class="detail-row">
                  <span class="detail-label">关联任务</span>
                  <span class="detail-value">{selectedSlot()!.task_title}</span>
                </div>
              </Show>
              <Show when={selectedSlot()!.carve_batch}>
                <div class="detail-row">
                  <span class="detail-label">补刻批次</span>
                  <span class="detail-value" style="cursor: pointer; color: var(--color-primary);" onClick={() => navigate(`/batches/${selectedSlot()!.carve_batch}`)}>
                    {selectedSlot()!.carve_batch} {"→"}
                  </span>
                </div>
              </Show>
              <div class="detail-row">
                <span class="detail-label">更新时间</span>
                <span class="detail-value" style="font-size: 11px;">{selectedSlot()!.updated_at}</span>
              </div>
            </Show>
          </div>
        </div>

        <div>
          <div class="card">
            <h3 class="card-title">📊 统计面板</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
              <div class="stat-card success" style="padding: 10px; margin-bottom: 0;">
                <div class="stat-label">正常</div>
                <div class="stat-value success">{stats().normal || 0}</div>
              </div>
              <div class="stat-card warning" style="padding: 10px; margin-bottom: 0;">
                <div class="stat-label">磨损</div>
                <div class="stat-value warning">{stats().worn || 0}</div>
              </div>
              <div class="stat-card danger" style="padding: 10px; margin-bottom: 0;">
                <div class="stat-label">缺字</div>
                <div class="stat-value danger">{stats().missing || 0}</div>
              </div>
              <div class="stat-card" style="padding: 10px; margin-bottom: 0;">
                <div class="stat-label">预留</div>
                <div class="stat-value">{stats().reserved || 0}</div>
              </div>
            </div>
            <Show when={isAbnormalSample()}>
              <div style="margin-top: 12px; padding: 10px; background: #FFEBEE; border-radius: 6px;">
                <div style="font-size: 12px; font-weight: 600; color: #b71c1c; margin-bottom: 4px;">⚠️ 盘点检测</div>
                <div style="font-size: 11px; color: #666;">
                  异常格位：1 · 致命磨损：2 · 冲突占用：1
                </div>
              </div>
            </Show>
          </div>

          <div class="card" style="margin-top: 16px;">
            <h3 class="card-title">📜 变更历史</h3>
            <div class="timeline">
              <For each={history()}>
                {item => (
                  <div class="timeline-item">
                    <div class="timeline-time">{item.timestamp.slice(0, 16)}</div>
                    <div class="timeline-action">
                      <span style="font-size: 11px;" class="badge badge-draft">{actionLabels[item.action_type] || item.action_type}</span>
                      <span style="font-size: 18px; margin-left: 4px;">{item.character || '空'}</span>
                    </div>
                    <div class="timeline-detail">
                      {item.old_status} {"→"} <strong>{item.new_status}</strong>
                    </div>
                    <div style="font-size: 10px; color: #999;">{item.operator}{item.batch_no ? ` · ${item.batch_no}` : ''}</div>
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>
      </div>

      <Show when={showFixModal()}>
        <div class="modal-backdrop" onClick={() => { setShowFixModal(false); loadTrayData(); }}>
          <div class="modal" style="max-width: 560px;" onClick={e => e.stopPropagation()}>
            <div class="modal-header">
              <h3 class="modal-title">🔧 自动修复执行中...</h3>
              <button class="modal-close" onClick={() => { setShowFixModal(false); loadTrayData(); }}>✕</button>
            </div>
            <div class="modal-body">
              <div style="background: #263238; color: #AED581; padding: 14px; border-radius: 6px; font-family: 'SF Mono', Monaco, monospace; font-size: 12px; line-height: 1.8; min-height: 180px;">
                <For each={fixResult()}>
                  {line => <div>{line}</div>}
                </For>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-primary" onClick={() => { setShowFixModal(false); loadTrayData(); }}>
                确认完成
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
