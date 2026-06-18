import { createEffect, createSignal, For, Show, Match, Switch } from "solid-js";
import { createAsync, useNavigate, A } from "@solidjs/router";
import type { Project, ProjectStatus, FilterOptions, AnomalyReport } from "../types";
import { apiFetch } from "../utils/fetcher";

const STATUS_LABEL: Record<ProjectStatus, string> = {
  draft: "草稿",
  in_review: "审读中",
  reviewed: "已审毕",
  exported: "已导出",
  archived: "已归档"
};

const PRIORITY_LABEL = { high: "高优", medium: "中优", low: "低优" };

export default function ProjectLedger() {
  const nav = useNavigate();

  const stats = createAsync(() =>
    apiFetch("/api/stats").then(r => r.json() as Promise<{
      totalProjects: number; inReview: number; pending: number; anomalies: number; dynastyCoverage: number;
    }>)
  );

  const allAnomalies = createAsync(() =>
    apiFetch("/api/anomalies").then(r => r.json() as Promise<AnomalyReport[]>)
  );

  const [filters, setFilters] = createSignal<FilterOptions>({
    search: "",
    status: [],
    dynasty: [],
    priority: [],
    assignee: [],
    hasAnomaly: null,
    tags: []
  });

  const [projects, setProjects] = createSignal<Project[]>([]);
  const [selected, setSelected] = createSignal<Set<string>>(new Set());
  const [showNewModal, setShowNewModal] = createSignal(false);
  const [page, setPage] = createSignal(1);
  const pageSize = 6;

  createEffect(() => {
    const body: any = { op: "filter", ...filters() };
    apiFetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).then(r => r.json()).then(list => {
      setProjects(list);
      setPage(1);
    });
  }, [filters]);

  const archivedCount = () => (projects() ?? []).filter(p => p.status === "archived").length;
  const completedMonth = () => {
    const now = new Date();
    const year = now.getFullYear(), month = now.getMonth();
    return (projects() ?? []).filter(p => {
      if (p.status !== "reviewed" && p.status !== "exported") return false;
      const d = new Date(p.updatedAt);
      return d.getFullYear() === year && d.getMonth() === month;
    }).length;
  };

  const toggleSelect = (id: string) => {
    const s = new Set(selected());
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };
  const toggleAll = () => {
    const s = new Set(selected());
    if (s.size === currentPage().length) {
      currentPage().forEach(p => s.delete(p.id));
    } else {
      currentPage().forEach(p => s.add(p.id));
    }
    setSelected(s);
  };

  const dynastyList = ["西汉", "东汉", "西晋", "唐", "宋", "清"];
  const statusList: ProjectStatus[] = ["draft", "in_review", "reviewed", "exported", "archived"];
  const priorityList: ("high" | "medium" | "low")[] = ["high", "medium", "low"];
  const assigneeList = ["张校勘", "李研究员", "王教授", "陈教授", "李助手"];
  const tagList = ["史记", "汉书", "资治通鉴", "清史稿", "重点项目", "多层避讳", "已审", "待审"];

  const toggleArray = <K extends keyof FilterOptions>(key: K, v: any) => {
    const arr = (filters()[key] as any[]) || [];
    const next = arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];
    setFilters({ ...filters(), [key]: next });
  };

  const resetFilters = () => setFilters({
    search: "", status: [], dynasty: [], priority: [], assignee: [], hasAnomaly: null, tags: []
  });

  const currentPage = () => {
    const start = (page() - 1) * pageSize;
    return projects().slice(start, start + pageSize);
  };
  const totalPages = () => Math.max(1, Math.ceil(projects().length / pageSize));

  const pct = (p: Project) => {
    const done = p.confirmedCount + p.rejectedCount + p.manualCount;
    return p.totalSuspected ? Math.round((done / p.totalSuspected) * 100) : 0;
  };

  const batchStatusChange = async (status: ProjectStatus) => {
    for (const id of selected()) {
      await apiFetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
    }
    setSelected(new Set<string>());
    const body: any = { op: "filter", ...filters() };
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    setProjects(await res.json());
  };

  const [newForm, setNewForm] = createSignal({
    name: "", textName: "", author: "", dynasty: "", sourceDynasty: "", description: "",
    originalText: "", assignee: "张校勘", priority: "medium" as "high" | "medium" | "low"
  });

  const submitNewProject = async () => {
    const f = newForm();
    if (!f.name || !f.originalText) return;
    await apiFetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...f,
        currentText: f.originalText,
        status: "draft",
        createdBy: "张校勘",
        dynastyRuleIds: [],
        totalSuspected: 0,
        confirmedCount: 0,
        rejectedCount: 0,
        pendingCount: 0,
        manualCount: 0,
        anomalyCount: 0,
        tags: ["新建"],
        batchId: `BATCH-2025-NEW-${Math.floor(Math.random() * 1000)}`
      })
    });
    setShowNewModal(false);
    setNewForm({ name: "", textName: "", author: "", dynasty: "", sourceDynasty: "", description: "", originalText: "", assignee: "张校勘", priority: "medium" });
    const body: any = { op: "filter", ...filters() };
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    setProjects(await res.json());
  };

  const unresolvedAnomalies = () => (allAnomalies() || []).filter(a => !a.resolved).slice(0, 3);

  return (
    <div>
      <div class="page-header">
        <div class="page-title-block">
          <h2>📚 项目台账</h2>
          <p class="subtitle">管理所有古籍避讳字审读项目，按朝代、批次、进度统一查看与调度</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-default" onClick={() => alert("导入数据功能（演示）")}>📥 批量导入</button>
          <button class="btn btn-primary" onClick={() => setShowNewModal(true)}>＋ 新建审读项目</button>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card s-cyan">
          <div class="stat-label">项目总数</div>
          <div class="stat-value">{stats()?.totalProjects ?? 0}</div>
          <div class="stat-hint">含已归档 {archivedCount()}</div>
        </div>
        <div class="stat-card s-amber">
          <div class="stat-label">正在审读</div>
          <div class="stat-value">{stats()?.inReview ?? 0}</div>
          <div class="stat-hint">待处理疑似字 {stats()?.pending ?? 0}</div>
        </div>
        <div class="stat-card s-purple">
          <div class="stat-label">朝代规则覆盖</div>
          <div class="stat-value">{stats()?.dynastyCoverage ?? 0}</div>
          <div class="stat-hint">共 25 条皇帝避讳规则</div>
        </div>
        <div class="stat-card s-rose">
          <div class="stat-label">未解决异常</div>
          <div class="stat-value">{stats()?.anomalies ?? 0}</div>
          <div class="stat-hint">需人工介入的冲突/不一致</div>
        </div>
        <div class="stat-card s-emerald">
          <div class="stat-label">本月完成</div>
          <div class="stat-value">{completedMonth()}</div>
          <div class="stat-hint">2025年3月审毕项目数</div>
        </div>
      </div>

      <Show when={unresolvedAnomalies().length > 0}>
        <div class="danger-banner">
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <strong>当前有 {unresolvedAnomalies().length} 条异常数据待处理：</strong>
            <div style={{ marginTop: 4, fontSize: 12.5 }}>
              <For each={unresolvedAnomalies()}>
                {a => (
                  <span style={{ display: "inline-block", marginRight: 16 }}>
                    <A href={`/project/${a.projectId}#anomalies`} style={{ textDecoration: "underline" }}>
                      [{a.type}] {a.description.slice(0, 38)}{a.description.length > 38 ? "…" : ""}
                    </A>
                  </span>
                )}
              </For>
            </div>
          </div>
          <button class="btn btn-xs btn-warning" onClick={() => nav("/rules")}>查看规则库</button>
        </div>
      </Show>

      <div class="filter-panel">
        <div class="filter-row">
          <div class="filter-group full-width">
            <label class="filter-label">关键字检索（项目名 / 典籍名 / 作者 / 描述 / 标签）</label>
            <input
              type="text"
              class="filter-input"
              placeholder="如：史记、资治通鉴、清代、多层避讳、张校勘…"
              value={filters().search}
              onInput={e => setFilters({ ...filters(), search: e.currentTarget.value })}
            />
          </div>
        </div>
        <div class="filter-row">
          <div class="filter-group">
            <label class="filter-label">项目状态</label>
            <div class="filter-tags-row">
              <For each={statusList}>
                {s => (
                  <span
                    class={`filter-tag ${filters().status.includes(s) ? "active" : ""}`}
                    onClick={() => toggleArray("status", s)}
                  >
                    {STATUS_LABEL[s]}
                  </span>
                )}
              </For>
            </div>
          </div>
          <div class="filter-group">
            <label class="filter-label">朝代</label>
            <div class="filter-tags-row">
              <For each={dynastyList}>
                {d => (
                  <span
                    class={`filter-tag ${filters().dynasty.includes(d) ? "active" : ""}`}
                    onClick={() => toggleArray("dynasty", d)}
                  >
                    {d}
                  </span>
                )}
              </For>
            </div>
          </div>
          <div class="filter-group">
            <label class="filter-label">优先级</label>
            <div class="filter-tags-row">
              <For each={priorityList}>
                {p => (
                  <span
                    class={`filter-tag ${filters().priority.includes(p) ? "active" : ""}`}
                    onClick={() => toggleArray("priority", p)}
                  >
                    {PRIORITY_LABEL[p]}
                  </span>
                )}
              </For>
            </div>
          </div>
          <div class="filter-group">
            <label class="filter-label">指派人</label>
            <div class="filter-tags-row">
              <For each={assigneeList}>
                {a => (
                  <span
                    class={`filter-tag ${filters().assignee.includes(a) ? "active" : ""}`}
                    onClick={() => toggleArray("assignee", a)}
                  >
                    {a}
                  </span>
                )}
              </For>
            </div>
          </div>
          <div class="filter-group">
            <label class="filter-label">异常状态</label>
            <div class="filter-tags-row">
              <span
                class={`filter-tag ${filters().hasAnomaly === true ? "active" : ""}`}
                onClick={() => setFilters({ ...filters(), hasAnomaly: filters().hasAnomaly === true ? null : true })}
              >有异常</span>
              <span
                class={`filter-tag ${filters().hasAnomaly === false ? "active" : ""}`}
                onClick={() => setFilters({ ...filters(), hasAnomaly: filters().hasAnomaly === false ? null : false })}
              >无异常</span>
            </div>
          </div>
        </div>
        <div class="filter-row">
          <div class="filter-group">
            <label class="filter-label">快捷标签</label>
            <div class="filter-tags-row">
              <For each={tagList}>
                {t => (
                  <span
                    class={`filter-tag ${filters().tags.includes(t) ? "active" : ""}`}
                    onClick={() => toggleArray("tags", t)}
                  >
                    # {t}
                  </span>
                )}
              </For>
            </div>
          </div>
          <div class="filter-actions">
            <button class="btn btn-sm btn-default" onClick={resetFilters}>清空筛选</button>
            <button class="btn btn-sm btn-primary">应用（共 {projects().length} 条）</button>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <h3 class="panel-title">审读项目列表 <span class="panel-meta">共 {projects().length} 个项目</span></h3>
          <div class="gap-small">
            <select class="filter-input" style={{ padding: "4px 8px", fontSize: 12 }}>
              <option>按更新时间倒序</option>
              <option>按创建时间倒序</option>
              <option>按优先级排序</option>
              <option>按进度排序</option>
            </select>
          </div>
        </div>

        <Show when={selected().size > 0}>
          <div class="list-actions-bar">
            <span class="count">已选 {selected().size} 项</span>
            <button class="btn btn-xs btn-success" onClick={() => batchStatusChange("reviewed")}>批量标记已审毕</button>
            <button class="btn btn-xs btn-warning" onClick={() => batchStatusChange("in_review")}>批量设为审读中</button>
            <button class="btn btn-xs btn-default" onClick={() => alert("批量导出（演示）")}>批量导出摘要</button>
            <button class="btn btn-xs btn-danger" onClick={() => setSelected(new Set<string>())}>取消选择</button>
          </div>
        </Show>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th class="check-col">
                  <input
                    type="checkbox"
                    checked={currentPage().length > 0 && selected().size === currentPage().length}
                    onChange={toggleAll}
                  />
                </th>
                <th style={{ width: "28%" }}>项目 / 典籍</th>
                <th style={{ width: "10%" }}>朝代 / 底本</th>
                <th style={{ width: "9%" }}>状态</th>
                <th style={{ width: "20%" }}>审读进度</th>
                <th style={{ width: "9%" }} class="num-col">疑似 / 待审</th>
                <th style={{ width: "9%" }}>负责人</th>
                <th style={{ width: "14%" }} class="action-col">操作</th>
              </tr>
            </thead>
            <tbody>
              <For each={currentPage()} fallback={
                <tr><td colspan="8" class="empty-state">暂无符合条件的项目</td></tr>
              }>
                {p => (
                  <tr>
                    <td class="check-col">
                      <input type="checkbox" checked={selected().has(p.id)} onChange={() => toggleSelect(p.id)} />
                    </td>
                    <td>
                      <div
                        class="text-cell-title"
                        onClick={() => nav(`/project/${p.id}`)}
                      >
                        <Show when={p.anomalyCount > 0}>
                          <span title={`含 ${p.anomalyCount} 条异常`} style={{ color: "#dc2626" }}>⚠ </span>
                        </Show>
                        {p.name}
                      </div>
                      <div class="text-cell-meta">
                        <span style={{ fontFamily: "ui-monospace, monospace" }}>{p.id}</span>
                        {" · "}{p.author}《{p.textName}》
                        <Show when={p.batchId}> · 批次 [{p.batchId}]</Show>
                      </div>
                      <div class="chips-flex">
                        <For each={p.tags}>{t => <span class="tag-chip">{t}</span>}</For>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{p.dynasty}</div>
                      <div class="small muted">源：{p.sourceDynasty}</div>
                      <div style={{ marginTop: 4 }}>
                        <span class={`badge badge-${p.priority}`}>{PRIORITY_LABEL[p.priority]}</span>
                      </div>
                    </td>
                    <td>
                      <span class={`badge badge-${p.status}`}>{STATUS_LABEL[p.status]}</span>
                      <div class="small muted" style={{ marginTop: 6 }}>
                        更新：{formatDate(p.updatedAt)}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                        <span>完成 {pct(p)}%</span>
                        <span class="muted">
                          ✔ {p.confirmedCount} · ✘ {p.rejectedCount} · ✱ {p.manualCount}
                        </span>
                      </div>
                      <div class="progress-wrap">
                        <div
                          class={`progress-bar ${p.status === "archived" ? "paused" : ""}`}
                          style={{ width: `${pct(p)}%` }}
                        />
                      </div>
                    </td>
                    <td class="num-col">
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{p.totalSuspected}</div>
                      <div class="small">
                        <span style={{ color: "#0ea5e9" }}>待审 {p.pendingCount}</span>
                      </div>
                    </td>
                    <td>
                      <div>{p.assignee || "未指派"}</div>
                      <div class="small muted">创建：{p.createdBy}</div>
                    </td>
                    <td class="action-col">
                      <A href={`/project/${p.id}`}>
                        <button class="btn btn-xs btn-primary">审读</button>
                      </A>
                      <button
                        class="btn btn-xs btn-default"
                        onClick={() => nav(`/project/${p.id}#versions`)}
                      >版本</button>
                      <button
                        class="btn btn-xs btn-default"
                        onClick={() => alert(`导出 ${p.name} 摘要（演示）`)}
                      >摘要</button>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <button class="page-btn" disabled={page() <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>上一页</button>
          <For each={Array.from({ length: totalPages() }, (_, i) => i + 1)}>
            {p => (
              <button
                class={`page-btn ${p === page() ? "active" : ""}`}
                onClick={() => setPage(p)}
              >{p}</button>
            )}
          </For>
          <button class="page-btn" disabled={page() >= totalPages()} onClick={() => setPage(p => Math.min(totalPages(), p + 1))}>下一页</button>
          <span class="muted small" style={{ marginLeft: 10 }}>
            共 {projects().length} 项 · {pageSize} 项/页
          </span>
        </div>
      </div>

      <Show when={showNewModal()}>
        <div class="modal-backdrop" onClick={() => setShowNewModal(false)}>
          <div class="modal" onClick={e => e.stopPropagation()}>
            <div class="modal-head">
              <h3>📝 新建审读项目</h3>
              <button class="btn btn-xs btn-default" onClick={() => setShowNewModal(false)}>✕</button>
            </div>
            <div class="modal-body">
              <div class="form-row">
                <label>项目名称 *</label>
                <input class="form-input" placeholder="如：《史记·五帝本纪》武英殿本校读"
                  value={newForm().name}
                  onInput={e => setNewForm({ ...newForm(), name: e.currentTarget.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div class="form-row">
                  <label>典籍名</label>
                  <input class="form-input" placeholder="如：五帝本纪"
                    value={newForm().textName}
                    onInput={e => setNewForm({ ...newForm(), textName: e.currentTarget.value })} />
                </div>
                <div class="form-row">
                  <label>作者</label>
                  <input class="form-input" placeholder="如：司马迁"
                    value={newForm().author}
                    onInput={e => setNewForm({ ...newForm(), author: e.currentTarget.value })} />
                </div>
                <div class="form-row">
                  <label>底本朝代 / 版本</label>
                  <input class="form-input" placeholder="如：清乾隆武英殿本"
                    value={newForm().dynasty}
                    onInput={e => setNewForm({ ...newForm(), dynasty: e.currentTarget.value })} />
                </div>
                <div class="form-row">
                  <label>源朝代</label>
                  <select class="form-select"
                    value={newForm().sourceDynasty}
                    onChange={e => setNewForm({ ...newForm(), sourceDynasty: e.currentTarget.value })}>
                    <option value="">请选择…</option>
                    <For each={dynastyList}>{d => <option value={d}>{d}</option>}</For>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <label>项目描述</label>
                <textarea class="form-textarea" placeholder="简述审读要点、关注的朝代规则、使用的对校本…"
                  value={newForm().description}
                  onInput={e => setNewForm({ ...newForm(), description: e.currentTarget.value })} />
              </div>
              <div class="form-row">
                <label>原文内容 *</label>
                <textarea class="form-textarea" style={{ minHeight: 120 }} placeholder="粘贴待审读的古籍原文内容…"
                  value={newForm().originalText}
                  onInput={e => setNewForm({ ...newForm(), originalText: e.currentTarget.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div class="form-row">
                  <label>指派给</label>
                  <select class="form-select"
                    value={newForm().assignee}
                    onChange={e => setNewForm({ ...newForm(), assignee: e.currentTarget.value })}>
                    <For each={assigneeList}>{a => <option value={a}>{a}</option>}</For>
                  </select>
                </div>
                <div class="form-row">
                  <label>优先级</label>
                  <select class="form-select"
                    value={newForm().priority}
                    onChange={e => setNewForm({ ...newForm(), priority: e.currentTarget.value as any })}>
                    <option value="high">高优</option>
                    <option value="medium">中优</option>
                    <option value="low">低优</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-foot">
              <button class="btn btn-default" onClick={() => setShowNewModal(false)}>取消</button>
              <button class="btn btn-primary" onClick={submitNewProject}>创建并开始审读</button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}

function formatDate(s: string) {
  try {
    const d = new Date(s);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch { return s; }
}

