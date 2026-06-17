import { createAsync, useNavigate, useParams, A } from "@solidjs/router";
import { createEffect, createSignal, For, Show, createMemo } from "solid-js";
import type { Project, SuspectedReplacement, DynastyRule, ProjectVersion, Annotation, AnomalyReport, ProjectStatus } from "../../types";

const STATUS_LABEL: Record<ProjectStatus, string> = {
  draft: "草稿", in_review: "审读中", reviewed: "已审毕", exported: "已导出", archived: "已归档"
};

type TabKey = "review" | "compare" | "versions" | "rules" | "annotations" | "anomalies" | "export";

export default function ProjectDetail() {
  const params = useParams();
  const nav = useNavigate();

  const project = createAsync<Project | undefined>(() =>
    fetch(`/api/projects/${params.id}`).then(r => r.json())
  );
  const replacements = createAsync<SuspectedReplacement[]>(() =>
    fetch(`/api/projects/${params.id}/replacements`).then(r => r.json())
  );
  const allRules = createAsync<DynastyRule[]>(() =>
    fetch("/api/rules").then(r => r.json())
  );
  const versions = createAsync<ProjectVersion[]>(() =>
    fetch(`/api/projects/${params.id}/versions`).then(r => r.json())
  );
  const annotations = createAsync<Annotation[]>(() =>
    fetch(`/api/projects/${params.id}/annotations`).then(r => r.json())
  );
  const anomalies = createAsync<AnomalyReport[]>(() =>
    fetch(`/api/anomalies?projectId=${params.id}`).then(r => r.json())
  );

  const [tab, setTab] = createSignal<TabKey>("review");
  const [repStatus, setRepStatus] = createSignal<string>("all");
  const [ruleFilter, setRuleFilter] = createSignal<string>("all");
  const [repList, setRepList] = createSignal<SuspectedReplacement[]>([]);
  const [repNotes, setRepNotes] = createSignal<Record<string, string>>({});
  const [noteInputs, setNoteInputs] = createSignal<Record<string, string>>({});
  const [showSave, setShowSave] = createSignal<boolean>(false);
  const [showAnn, setShowAnn] = createSignal<{ open: boolean; replacementId?: string; position?: number }>({ open: false });
  const [annForm, setAnnForm] = createSignal({ type: "comment", content: "", author: "张校勘" });
  const [projState, setProjState] = createSignal<Project | undefined>(undefined);

  createEffect(() => {
    if (replacements()) {
      setRepList(replacements() ?? []);
      const notes: Record<string, string> = {};
      const ins: Record<string, string> = {};
      for (const r of (replacements() ?? [])) {
        if (r.note) { notes[r.id] = r.note; ins[r.id] = r.note; }
      }
      setRepNotes(notes);
      setNoteInputs(ins);
    }
    if (project()) setProjState(project());
  });

  const ruleMap = createMemo(() => {
    const m = new Map<string, DynastyRule>();
    for (const r of (allRules() ?? [])) m.set(r.id, r);
    return m;
  });

  const projRules = createMemo(() =>
    (allRules() ?? []).filter(r => (projState()?.dynastyRuleIds ?? []).includes(r.id))
  );

  const visibleReplacements = createMemo(() => {
    let list = repList();
    if (repStatus() !== "all") list = list.filter(r => r.status === repStatus());
    if (ruleFilter() !== "all") list = list.filter(r => r.dynastyRuleId === ruleFilter());
    return list;
  });

  const applyReplacementStatus = async (repId: string, status: SuspectedReplacement["status"]) => {
    const patch: any = { status, reviewedBy: "张校勘", reviewedAt: new Date().toISOString() };
    const note = noteInputs()[repId];
    if (note && note !== repNotes()[repId]) {
      patch.note = note;
      setRepNotes({ ...repNotes(), [repId]: note });
    } else if (repNotes()[repId]) {
      patch.note = repNotes()[repId];
    }
    const res = await fetch(`/api/replacements/${repId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    const updated = await res.json() as SuspectedReplacement;
    setRepList(repList().map(r => r.id === repId ? updated : r));
    const upd = await fetch(`/api/projects/${params.id}`).then(r => r.json());
    setProjState(upd);
  };

  const saveNote = (repId: string) => {
    const note = noteInputs()[repId];
    if (!note) return;
    applyReplacementStatus(repId, repList().find(r => r.id === repId)?.status ?? "pending");
  };

  const saveSnapshot = async () => {
    setShowSave(true);
  };

  const confirmSnapshot = async () => {
    const p = projState();
    if (!p) return;
    const vers = versions() ?? [];
    const baseNum = parseFloat((vers[0]?.versionNumber ?? "0.0"));
    const nextNum = (baseNum + 0.1).toFixed(1);
    await fetch(`/api/projects/${params.id}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        versionNumber: nextNum,
        batchId: p.batchId,
        createdBy: "张校勘",
        snapshot: p,
        replacementsSnapshot: repList(),
        changeSummary: "保存审读进度快照",
        comment: "用户操作"
      })
    });
    setShowSave(false);
    location.reload();
  };

  const submitAnnotation = async () => {
    if (!annForm().content) return;
    await fetch(`/api/projects/${params.id}/annotations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        replacementId: showAnn().replacementId,
        position: showAnn().position ?? 0,
        type: annForm().type,
        content: annForm().content,
        author: annForm().author
      })
    });
    setShowAnn({ open: false });
    setAnnForm({ type: "comment", content: "", author: "张校勘" });
    location.reload();
  };

  const resolveAnnotation = async (id: string) => {
    await fetch(`/api/projects/${params.id}/annotations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "resolve", annotationId: id, resolver: "张校勘" })
    });
    location.reload();
  };

  const resolveAnomaly = async (id: string) => {
    await fetch("/api/anomalies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "resolve", id })
    });
    location.reload();
  };

  const updateProjectStatus = async (status: ProjectStatus) => {
    const res = await fetch(`/api/projects/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    setProjState(await res.json());
  };

  const renderHighlightedText = (source: "original" | "current") => {
    const text = (source === "original" ? projState()?.originalText : projState()?.currentText) ?? "";
    const reps = repList();
    if (!text) return text;
    const statusMap = new Map<number, SuspectedReplacement>();
    for (const r of reps) statusMap.set(r.position, r);
    const parts: any[] = [];
    for (let i = 0; i < text.length; i++) {
      const r = statusMap.get(i);
      if (r) {
        const cls =
          r.status === "confirmed" ? "hl-repl" :
          r.status === "rejected" ? "" :
          r.status === "manual" ? "hl-manual" : "hl-taboo";
        parts.push(<span class={cls}>{r.tabooChar}</span>);
      } else {
        parts.push(text[i]);
      }
    }
    return parts;
  };

  const p = () => projState();

  return (
    <div class="detail-page-wrap">
      <div class="page-header">
        <div class="page-title-block">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <button class="btn btn-sm btn-default" onClick={() => nav("/")}>← 返回台账</button>
          <h2 style={{ margin: 0 }}>{p()?.name ?? "加载中…"}</h2>
          <Show when={p()?.status}>
            <span class={`badge badge-${p()!.status}`}>{STATUS_LABEL[p()!.status]}</span>
          </Show>
        </div>
        <p class="subtitle">
          <span style={{ fontFamily: "ui-monospace, monospace" }}>{params.id}</span>
          {" · "}{p()?.author}《{p()?.textName}》· 底本：{p()?.dynasty} · 源：{p()?.sourceDynasty}
        </p>
      </div>
      <div class="page-actions">
        <button class="btn btn-default" onClick={saveSnapshot}>💾 保存版本快照</button>
        <button class="btn btn-success" onClick={() => alert("生成对校报告（演示）")}>📑 生成对校报告</button>
        <button class="btn btn-warning" onClick={() => setTab("export")}>📤 导出摘要</button>
      </div>
    </div>

    <Show when={p()}>
      <div class="detail-top">
        <div class="panel">
          <div class="panel-header"><h3 class="panel-title">📖 项目基本信息</h3>
            <div class="gap-small">
              <Show when={p()!.batchId}><span class="tag-chip">批次 {p()!.batchId}</span></Show>
              <span class={`badge badge-${p()!.priority}`}>
                {p()!.priority === "high" ? "高优" : p()!.priority === "medium" ? "中优" : "低优"}
              </span>
              <For each={p()!.tags}>{t => <span class="tag-chip">{t}</span>}</For>
            </div>
          </div>
          <div class="panel-body">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">项目负责人</span>
                <span class="info-value">{p()!.assignee ?? "未指派"}</span>
              </div>
              <div class="info-item">
                <span class="info-label">创建者</span>
                <span class="info-value">{p()!.createdBy}</span>
              </div>
              <div class="info-item">
                <span class="info-label">创建时间</span>
                <span class="info-value">{fmt(p()!.createdAt)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">最后更新</span>
                <span class="info-value">{fmt(p()!.updatedAt)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">截止日期</span>
                <span class="info-value">{p()!.dueDate ?? "—"}</span>
              </div>
              <div class="info-item">
                <span class="info-label">适用朝代规则</span>
                <span class="info-value">{p()!.dynastyRuleIds.length} 条规则（详见下方）</span>
              </div>
              <div class="info-item full">
                <span class="info-label">审读描述</span>
                <span class="info-value">{p()!.description}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header"><h3 class="panel-title">📊 审读进度总览</h3>
            <span class="panel-meta">自动刷新</span>
          </div>
          <div class="panel-body">
            <div class="side-summary-stats" style={{ marginBottom: 14 }}>
              <div class="summary-stat">
                <div class="label">疑似替换字</div>
                <div class="value">{p()!.totalSuspected}</div>
              </div>
              <div class="summary-stat">
                <div class="label">✅ 已确认</div>
                <div class="value" style={{ color: "#059669" }}>{p()!.confirmedCount}</div>
              </div>
              <div class="summary-stat">
                <div class="label">❌ 已驳回</div>
                <div class="value" style={{ color: "#dc2626" }}>{p()!.rejectedCount}</div>
              </div>
              <div class="summary-stat">
                <div class="label">⏳ 待审</div>
                <div class="value" style={{ color: "#0284c7" }}>{p()!.pendingCount}</div>
              </div>
              <div class="summary-stat">
                <div class="label">✱ 人工</div>
                <div class="value" style={{ color: "#b45309" }}>{p()!.manualCount}</div>
              </div>
              <div class="summary-stat">
                <div class="label">⚠ 异常</div>
                <div class="value" style={{ color: p()!.anomalyCount > 0 ? "#dc2626" : "#16a34a" }}>{p()!.anomalyCount}</div>
              </div>
            </div>
            <div style={{ marginBottom: 4, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span>整体完成度</span>
              <span style={{ fontWeight: 600 }}>
                {Math.round(((p()!.confirmedCount + p()!.rejectedCount + p()!.manualCount) / Math.max(1, p()!.totalSuspected)) * 100)}%
              </span>
            </div>
            <div class="progress-wrap" style={{ marginBottom: 14 }}>
              <div
                class="progress-bar"
                style={{ width: `${Math.round(((p()!.confirmedCount + p()!.rejectedCount + p()!.manualCount) / Math.max(1, p()!.totalSuspected)) * 100)}%` }}
              />
            </div>
            <div class="gap-small" style={{ marginTop: 14 }}>
              <span style={{ fontSize: 12, color: "#374151" }}>快速状态切换：</span>
              <button class="btn btn-xs btn-default" onClick={() => updateProjectStatus("draft")}>草稿</button>
              <button class="btn btn-xs btn-warning" onClick={() => updateProjectStatus("in_review")}>审读中</button>
              <button class="btn btn-xs btn-success" onClick={() => updateProjectStatus("reviewed")}>已审毕</button>
              <button class="btn btn-xs btn-primary" onClick={() => updateProjectStatus("exported")}>已导出</button>
              <button class="btn btn-xs btn-default" onClick={() => updateProjectStatus("archived")}>归档</button>
            </div>
          </div>
        </div>
      </div>

      <Show when={(anomalies() ?? []).filter(a => !a.resolved).length > 0 && tab() !== "anomalies"}>
        <div class="danger-banner">
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <strong>本项目有 {(anomalies() ?? []).filter(a => !a.resolved).length} 条异常数据</strong>
            <span style={{ marginLeft: 12, fontSize: 12.5 }}>
              请前往「异常报告」标签查看详情并处理
            </span>
          </div>
          <button class="btn btn-xs btn-warning" onClick={() => setTab("anomalies")}>去处理 →</button>
        </div>
      </Show>

      <div class="panel">
        <div class="tabs">
          <div class={`tab ${tab() === "review" ? "active" : ""}`} onClick={() => setTab("review")}>
            🔍 疑似替换字审读 ({repList().length})
          </div>
          <div class={`tab ${tab() === "compare" ? "active" : ""}`} onClick={() => setTab("compare")}>
            📜 原文 / 改文 对照
          </div>
          <div class={`tab ${tab() === "versions" ? "active" : ""}`} onClick={() => setTab("versions")}>
            🗂 版本 / 批次历史 ({(versions() ?? []).length})
          </div>
          <div class={`tab ${tab() === "rules" ? "active" : ""}`} onClick={() => setTab("rules")}>
            📋 适用朝代规则 ({projRules().length})
          </div>
          <div class={`tab ${tab() === "annotations" ? "active" : ""}`} onClick={() => setTab("annotations")}>
            💬 批注 / 审读笔记 ({(annotations() ?? []).length})
          </div>
          <div class={`tab ${tab() === "anomalies" ? "active" : ""}`} onClick={() => setTab("anomalies")}>
            ⚠ 异常报告 ({(anomalies() ?? []).filter(a => !a.resolved).length})
          </div>
          <div class={`tab ${tab() === "export" ? "active" : ""}`} onClick={() => setTab("export")}>
            📤 导出摘要
          </div>
        </div>

        <div class="panel-body">
          <Show when={tab() === "review"}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
              gap: 10,
              flexWrap: "wrap"
            }}>
              <div class="gap-medium">
                <select class="filter-select" style={{ fontSize: 12, padding: "6px 10px" }}
                  value={repStatus()}
                  onChange={e => setRepStatus(e.currentTarget.value)}>
                  <option value="all">全部状态</option>
                  <option value="pending">待审</option>
                  <option value="confirmed">已确认</option>
                  <option value="rejected">已驳回</option>
                  <option value="manual">人工判定</option>
                </select>
                <select class="filter-select" style={{ fontSize: 12, padding: "6px 10px" }}
                  value={ruleFilter()}
                  onChange={e => setRuleFilter(e.currentTarget.value)}>
                  <option value="all">全部朝代规则</option>
                  <For each={projRules()}>
                    {rule => (
                      <option value={rule.id}>
                        [{rule.dynasty}] {rule.tabooChar}→{rule.replacementChar}
                      </option>
                    )}
                  </For>
                </select>
              </div>
              <div class="small muted">
                显示 {visibleReplacements().length} / {repList().length} 条
              </div>
            </div>

            <For each={visibleReplacements()} fallback={
              <div class="empty-state">没有符合条件的记录</div>
            }>
              {rep => {
                const rule = ruleMap().get(rep.dynastyRuleId);
                return (
                  <div class={`replacement-card status-${rep.status}`}>
                    <div class="rep-header">
                      <div class="rep-identity">
                        <span class="rep-id">{rep.id}</span>
                        <span class={`badge badge-${rep.status}`}>
                          {rep.status === "pending" ? "待审" :
                            rep.status === "confirmed" ? "已确认" :
                            rep.status === "rejected" ? "已驳回" : "人工判定"}
                        </span>
                        <div class="confidence-bar">
                          <span>置信度 {Math.round(rep.confidence * 100)}%</span>
                          <div class="confidence-dots">
                            {[1,2,3,4,5].map(i => (
                              <span class={`conf-dot ${rep.confidence >= i * 0.2 ?
                                (i <= 2 ? "risk" : i <= 3 ? "warn" : "on") : ""}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div class="rep-chars">
                        <span class="rep-char-taboo">{rep.tabooChar}</span>
                        <span class="rep-char-arrow">→</span>
                        <span class="rep-char-repl">{rep.replacementChar}</span>
                      </div>
                    </div>

                    <div class="context-block">
                      <span class="context-before">{rep.contextBefore}</span>
                      <span class="context-target">{rep.tabooChar}</span>
                      <span class="context-after">{rep.contextAfter}</span>
                    </div>

                    <div class="rep-meta-row">
                      <span><b>朝代规则：</b>
                        {rule ? `[${rule.dynasty}] ${rule.emperor}（${rule.reignTitle}）${rule.reason}` : rep.dynastyRuleId}
                      </span>
                      <span><b>位置：</b>第 {rep.position} 字</span>
                      <Show when={rep.reviewedBy}>
                        <span><b>审核：</b>{rep.reviewedBy} @ {fmt(rep.reviewedAt!)}</span>
                      </Show>
                      <Show when={rule}>
                        <span><b>严度：</b>
                          <span class={`badge badge-${rule.severity}`}>
                            {rule.severity === "strict" ? "严" : rule.severity === "moderate" ? "中" : "宽"}
                          </span>
                        </span>
                      </Show>
                      <Show when={rule}>
                        <span><b>依据：</b>{rule.sources[0]}</span>
                      </Show>
                    </div>

                    <div class="rep-actions">
                      <div class="rep-buttons">
                        <button class="btn btn-sm btn-success"
                          disabled={rep.status === "confirmed"}
                          onClick={() => applyReplacementStatus(rep.id, "confirmed")}>
                          ✅ 确认替换
                        </button>
                        <button class="btn btn-sm btn-danger"
                          disabled={rep.status === "rejected"}
                          onClick={() => applyReplacementStatus(rep.id, "rejected")}>
                          ❌ 驳回
                        </button>
                        <button class="btn btn-sm btn-warning"
                          disabled={rep.status === "manual"}
                          onClick={() => applyReplacementStatus(rep.id, "manual")}>
                          ✱ 人工标记
                        </button>
                        <button class="btn btn-sm btn-default"
                          onClick={() => setShowAnn({ open: true, replacementId: rep.id, position: rep.position })}>
                          💬 批注
                        </button>
                      </div>
                      <div class="rep-note">
                        <textarea
                          class="note-input"
                          placeholder="输入审读备注（如：此处为专名、参照某本、需对校…）"
                          value={noteInputs()[rep.id] ?? ""}
                          onInput={e => setNoteInputs({ ...noteInputs(), [rep.id]: e.currentTarget.value })}
                          onBlur={() => saveNote(rep.id)}
                        />
                        <Show when={repNotes()[rep.id]}>
                          <div class="rep-note-view">💡 {repNotes()[rep.id]}</div>
                        </Show>
                      </div>
                    </div>
                  </div>
                );
              }}
            </For>
          </Show>

          <Show when={tab() === "compare"}>
            <div style={{ marginBottom: 12, fontSize: 12.5, color: "#374151" }}>
              左侧为原文扫描，右侧为已应用（或待确认）替换字的版本。
              <span class="hl-taboo" style={{ margin: "0 4px" }}>红色高亮</span>=待审/待改，
              <span class="hl-repl" style={{ margin: "0 4px" }}>绿色高亮</span>=已确认替换，
              <span class="hl-manual" style={{ margin: "0 4px" }}>黄色虚线</span>=人工判定。
            </div>
            <div class="text-compare">
              <div class="compare-pane">
                <div class="compare-title">原文（{p()!.dynasty}） · {p()!.totalSuspected} 处疑似</div>
                <div class="compare-body">{renderHighlightedText("original")}</div>
              </div>
              <div class="compare-pane">
                <div class="compare-title">校读后文本 · 已改 {p()!.confirmedCount} 处</div>
                <div class="compare-body">{renderHighlightedText("current")}</div>
              </div>
            </div>

            <div class="panel" style={{ marginTop: 12 }}>
              <div class="panel-header"><h3 class="panel-title">📝 替换字对照清单</h3></div>
              <div class="table-wrap">
                <table class="data-table" style={{ fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th>位置</th>
                      <th>讳字 → 替换</th>
                      <th>依据</th>
                      <th>状态</th>
                      <th>上下文摘要</th>
                      <th>审核 / 备注</th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={repList()}>
                      {rep => {
                        const rule = ruleMap().get(rep.dynastyRuleId);
                        return (
                          <tr>
                            <td class="num-col">{rep.position}</td>
                            <td style={{ fontWeight: 700 }}>
                              <span style={{ color: "#991b1b" }}>{rep.tabooChar}</span>
                              <span style={{ color: "#9ca3af" }}> → </span>
                              <span style={{ color: "#047857" }}>{rep.replacementChar}</span>
                            </td>
                            <td class="small">
                              {rule ? `[${rule.dynasty}] ${rule.emperor}` : rep.dynastyRuleId}
                            </td>
                            <td>
                              <span class={`badge badge-${rep.status}`}>
                                {rep.status === "pending" ? "待审" :
                                  rep.status === "confirmed" ? "已确认" :
                                  rep.status === "rejected" ? "已驳回" : "人工"}
                              </span>
                            </td>
                            <td class="small" style={{ fontFamily: "SimSun, serif" }}>
                              …{rep.contextBefore.slice(-5)}<b>{rep.tabooChar}</b>{rep.contextAfter.slice(0, 5)}…
                            </td>
                            <td class="small">
                              <Show when={rep.note} fallback={<span class="muted">—</span>}>
                                <div>{rep.note}</div>
                                <div class="muted small">{rep.reviewedBy} @ {fmt(rep.reviewedAt!)}</div>
                              </Show>
                            </td>
                          </tr>
                        );
                      }}
                    </For>
                  </tbody>
                </table>
              </div>
            </div>
          </Show>

          <Show when={tab() === "versions"}>
            <div style={{ fontSize: 12.5, color: "#374151", marginBottom: 14 }}>
              版本 / 批次变更记录，每次保存快照或批量操作都会记录。
            </div>
            <Show when={(versions() ?? []).length === 0}><div class="empty-state">暂无版本记录</div></Show>
            <div class="version-timeline">
              <For each={versions() ?? []}>
                {(v, i) => (
                  <div class="version-node">
                    <div class="version-head">
                      <div>
                        <span class="version-tag">v{v.versionNumber}</span>
                        <span style={{ marginLeft: 8, fontWeight: 600 }}>{v.changeSummary}</span>
                        <Show when={v.batchId}>
                          <span class="tag-chip" style={{ marginLeft: 8 }}>批次 {v.batchId}</span>
                        </Show>
                      </div>
                      <div class="small muted">
                        {v.createdBy} · {fmt(v.createdAt)}
                      </div>
                    </div>
                    <div class="version-card">
                      <div class="version-summary">{v.comment}</div>
                      <div class="version-meta">
                        快照时状态：<b>{STATUS_LABEL[v.snapshot.status as ProjectStatus]}</b> ·
                        确认 {v.snapshot.confirmedCount} ·
                        驳回 {v.snapshot.rejectedCount} ·
                        待审 {v.snapshot.pendingCount} ·
                        人工 {v.snapshot.manualCount} ·
                        疑似总计 {v.snapshot.totalSuspected}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <button class="btn btn-xs btn-default" onClick={() => alert(`还原 v${v.versionNumber}（演示）`)}>还原此版本</button>{" "}
                        <button class="btn btn-xs btn-default" onClick={() => alert(`与 v${v.versionNumber} 对比（演示）`)}>版本对比</button>
                      </div>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>

          <Show when={tab() === "rules"}>
            <div style={{ fontSize: 12.5, color: "#374151", marginBottom: 12 }}>
              本项目已启用 {projRules().length} 条朝代避讳规则。
              <button class="btn btn-xs btn-default" style={{ marginLeft: 12 }} onClick={() => alert("管理规则库（演示）")}>＋ 从规则库添加</button>
            </div>
            <div class="table-wrap">
              <table class="rules-table">
                <thead>
                  <tr>
                    <th>朝代</th>
                    <th>皇帝 / 名讳</th>
                    <th style={{ textAlign: "center" }}>字</th>
                    <th style={{ textAlign: "center" }}>严度</th>
                    <th>避讳理由</th>
                    <th>起讫（年）</th>
                    <th>依据</th>
                  </tr>
                </thead>
                <tbody>
                  <For each={projRules()}>
                    {rule => (
                      <tr>
                        <td style={{ fontWeight: 600 }}>{rule.dynasty}</td>
                        <td>{rule.emperor}（{rule.reignTitle}）</td>
                        <td style={{ textAlign: "center", fontFamily: "SimSun, serif", fontSize: 15 }}>
                          <span style={{
                            display: "inline-block",
                            padding: "1px 10px",
                            background: "#fecaca",
                            color: "#7f1d1d",
                            borderRadius: 4,
                            marginRight: 4
                          }}>{rule.tabooCharacter}</span>
                          <span style={{ color: "#9ca3af" }}>→</span>
                          <span style={{
                            display: "inline-block",
                            padding: "1px 10px",
                            background: "#bbf7d0",
                            color: "#14532d",
                            borderRadius: 4,
                            marginLeft: 4
                          }}>{rule.replacementCharacter}</span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span class={`badge badge-${rule.severity}`}>
                            {rule.severity === "strict" ? "严格" :
                              rule.severity === "moderate" ? "中度" : "宽松"}
                          </span>
                        </td>
                        <td class="small">{rule.reason}</td>
                        <td class="small">{rule.startYear} ～ {rule.endYear}</td>
                        <td class="small muted">{rule.sources.join("；")}</td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>
          </Show>

          <Show when={tab() === "annotations"}>
            <div class="flex-between mb-medium">
              <div style={{ fontSize: 12.5, color: "#374151" }}>
                所有批注与笔记，可按替换字或全局笔记。
              </div>
              <button class="btn btn-sm btn-primary" onClick={() => setShowAnn({ open: true })}>＋ 新增批注</button>
            </div>
            <For each={annotations() ?? []} fallback={
              <div class="empty-state">暂无批注，可在「疑似替换字审读」中为某条记录添加批注。</div>
            }>
              {ann => (
                <div class={`annotation-card ${ann.resolved ? "resolved" : ""}`}>
                  <div class="ann-head">
                    <div>
                      <span class="ann-author">{ann.author}</span>
                      <span class={`ann-type-tag ann-type-${ann.type}`}>
                        {ann.type === "replacement" ? "替换说明" :
                          ann.type === "comment" ? "笔记" :
                            ann.type === "query" ? "疑问" :
                              ann.type === "reference" ? "引文" : "问题"}
                      </span>
                      <Show when={ann.replacementId}>
                        <span class="small muted" style={{ marginLeft: 6 }}>
                          关联 {ann.replacementId} · 位置 {ann.position}
                        </span>
                      </Show>
                    </div>
                    <div class="ann-meta">{fmt(ann.createdAt)}</div>
                  </div>
                  <div class="ann-content">{ann.content}</div>
                  <Show when={ann.resolved}>
                    <div class="small muted">
                      ✔ 已解决：{ann.resolvedBy} @ {fmt(ann.resolvedAt!)}
                    </div>
                  </Show>
                  <Show when={!ann.resolved}>
                    <div class="ann-actions">
                      <button class="btn btn-xs btn-success" onClick={() => resolveAnnotation(ann.id)}>标记解决</button>
                    </div>
                  </Show>
                </div>
              )}
            </For>
          </Show>

          <Show when={tab() === "anomalies"}>
            <div style={{ fontSize: 12.5, color: "#374151", marginBottom: 12 }}>
              系统自动检测的异常数据，需要人工确认处理。
            </div>
            <For each={anomalies() ?? []} fallback={
              <div class="empty-state">无异常报告</div>
            }>
              {a => (
                <div class={`anomaly-card severity-${a.severity} ${a.resolved ? "resolved" : ""}`}>
                  <div class="anomaly-head">
                    <div>
                      <span class={`badge badge-${a.severity}`}>
                        {a.severity === "critical" ? "严重" : a.severity === "warning" ? "警告" : "提示"}
                      </span>
                      <span class="anomaly-type" style={{ marginLeft: 10 }}>
                        {a.type}
                      </span>
                      <Show when={a.resolved}>
                        <span style={{ marginLeft: 10, color: "#059669", fontWeight: 600 }}>✔ 已解决</span>
                      </Show>
                    </div>
                    <div class="small muted">检测于 {fmt(a.detectedAt)}</div>
                  </div>
                  <div class="anomaly-desc">{a.description}</div>
                  <Show when={a.suggestedAction}>
                    <div class="anomaly-action">{a.suggestedAction}</div>
                  </Show>
                  <div class="flex-between">
                    <div class="small muted">
                      影响替换字：{a.affectedReplacements.length > 0 ? a.affectedReplacements.join("，") : "无关联条目"}
                    </div>
                    <div class="gap-small">
                      <button class="btn btn-xs btn-default" onClick={() => alert("查看详情（演示）")}>关联跳转</button>
                      <Show when={!a.resolved}>
                        <button class="btn btn-xs btn-success" onClick={() => resolveAnomaly(a.id)}>标记已处理</button>
                      </Show>
                    </div>
                  </div>
                </div>
              )}
            </For>
          </Show>

          <Show when={tab() === "export"}>
            <ExportBlock project={p()!} replacements={repList()} rules={projRules()} annotations={annotations() ?? []} />
          </Show>
        </div>

        <div class="detail-actions-row">
          <div class="small muted">
            💡 提示：可以在「疑似替换字审读」标签中逐条审核每一处疑似，本工具支持确认 / 驳回 / 人工判定三种处理方式。
          </div>
          <div class="gap-medium">
            <button class="btn btn-default" onClick={() => nav("/")}>返回台账</button>
            <button class="btn btn-success" onClick={saveSnapshot}>💾 保存版本快照</button>
            <button class="btn btn-primary" onClick={() => setTab("export")}>📤 导出摘要</button>
          </div>
        </div>
      </div>
    </Show>

    <Show when={showAnn().open}>
      <div class="modal-backdrop" onClick={() => setShowAnn({ open: false })}>
        <div class="modal" onClick={e => e.stopPropagation()}>
          <div class="modal-head">
            <h3>💬 添加批注 / 审读笔记</h3>
            <button class="btn btn-xs btn-default" onClick={() => setShowAnn({ open: false })}>✕</button>
          </div>
          <div class="modal-body">
            <Show when={showAnn().replacementId}>
              <div class="small muted" style={{ marginBottom: 10 }}>
                关联：{showAnn().replacementId}（位置 {showAnn().position}）
              </div>
            </Show>
            <div class="form-row">
              <label>批注类型</label>
              <select class="form-select" value={annForm().type} onChange={e => setAnnForm({ ...annForm(), type: e.currentTarget.value })}>
                <option value="comment">一般笔记</option>
                <option value="query">疑问 / 请示</option>
                <option value="replacement">替换说明</option>
                <option value="reference">参考文献</option>
                <option value="issue">问题报告</option>
              </select>
            </div>
            <div class="form-row">
              <label>批注内容</label>
              <textarea class="form-textarea" placeholder="请输入批注内容…"
                value={annForm().content}
                onInput={e => setAnnForm({ ...annForm(), content: e.currentTarget.value })} />
            </div>
            <div class="form-row">
              <label>批注人</label>
              <input class="form-input" value={annForm().author}
                onInput={e => setAnnForm({ ...annForm(), author: e.currentTarget.value })} />
            </div>
          </div>
          <div class="modal-foot">
            <button class="btn btn-default" onClick={() => setShowAnn({ open: false })}>取消</button>
            <button class="btn btn-primary" onClick={submitAnnotation}>提交批注</button>
          </div>
        </div>
      </div>
    </Show>

    <Show when={showSave()}>
      <div class="modal-backdrop" onClick={() => setShowSave(false)}>
        <div class="modal" onClick={e => e.stopPropagation()}>
          <div class="modal-head">
            <h3>💾 保存版本快照</h3>
            <button class="btn btn-xs btn-default" onClick={() => setShowSave(false)}>✕</button>
          </div>
          <div class="modal-body">
            <div class="small" style={{ color: "#374151", marginBottom: 10 }}>
              当前进度将被完整快照，可在「版本 / 批次历史」中查看或还原。
            </div>
            <div class="export-summary-block">
              <div style={{ fontSize: 13 }}>
                已确认 {p()?.confirmedCount} · 已驳回 {p()?.rejectedCount} · 待审 {p()?.pendingCount} · 人工 {p()?.manualCount}
              </div>
            </div>
          </div>
          <div class="modal-foot">
            <button class="btn btn-default" onClick={() => setShowSave(false)}>取消</button>
            <button class="btn btn-primary" onClick={confirmSnapshot}>确认保存快照</button>
          </div>
        </div>
      </div>
    </Show>
    </div>
  );
}

function ExportBlock(props: {
  project: Project; replacements: SuspectedReplacement[]; rules: DynastyRule[]; annotations: Annotation[];
}) {
  const { project, replacements, rules, annotations } = props;
  const [format, setFormat] = createSignal<"txt" | "csv" | "json" | "xml">("json");
  const [done, setDone] = createSignal(false);

  const confirmedReps = () => replacements.filter(r => r.status === "confirmed");
  const rejectedReps = () => replacements.filter(r => r.status === "rejected");
  const manualReps = () => replacements.filter(r => r.status === "manual");
  const dynastySet = () => Array.from(new Set(rules.map(r => r.dynasty)));

  const summaryText = () => {
    const s = `【审读摘要】《${project.textName}》（${project.dynasty}）
项目：${project.name} [${project.id}]
负责人：${project.assignee ?? "—"}   创建：${project.createdBy}
底本朝代：${project.dynasty}   源朝代：${project.sourceDynasty}
─────
审读统计：
  疑似替换字总数：${replacements.length}
  已确认替换：${confirmedReps().length}
  已驳回（不替换）：${rejectedReps().length}
  待审：${replacements.filter(r => r.status === "pending").length}
  人工判定：${manualReps().length}
  批注/笔记：${annotations.length}
  覆盖朝代：${dynastySet().join("、")}
─────
替换明细：
${confirmedReps().slice(0, 30).map((r, i) => {
  const rule = rules.find(rr => rr.id === r.dynastyRuleId);
  return `  ${i + 1}. 位置${r.position}：「${r.tabooChar}」→「${r.replacementChar}」[${rule?.dynasty}${rule?.emperor}]`;
}).join("\n")}
${confirmedReps().length > 30 ? `  …（共 ${confirmedReps().length} 条，仅列前 30 条）\n` : ""}
─────
审读说明：${project.description}
`;
    return s;
  };

  const doExport = async () => {
    await fetch("/api/exports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: project.id,
        exportedBy: "张校勘",
        format: format(),
        summaryContent: summaryText(),
        stats: {
          totalCharacters: project.originalText.length,
          totalReplacements: replacements.length,
          confirmed: confirmedReps().length,
          rejected: rejectedReps().length,
          manual: manualReps().length,
          annotations: annotations.length,
          dynastiesCovered: dynastySet()
        }
      })
    });
    setDone(true);
    const blob = new Blob([summaryText()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const ext = format() === "json" ? "json" : format() === "csv" ? "csv" : format() === "xml" ? "xml" : "txt";
    a.download = `${project.id}-审读摘要.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{ fontSize: 12.5, color: "#374151", marginBottom: 14 }}>
        生成审读摘要并导出，可选择导出格式。摘要会保存到系统的导出记录中。
      </div>
      <div class="flex-between mb-medium">
        <div class="gap-small">
          <label class="small" style={{ alignSelf: "center" }}>导出格式：</label>
          <select class="filter-select" style={{ fontSize: 12 }}
            value={format()}
            onChange={e => setFormat(e.currentTarget.value as any)}>
            <option value="txt">纯文本 TXT</option>
            <option value="csv">CSV 表格</option>
            <option value="json">JSON 结构化</option>
            <option value="xml">XML 标准</option>
          </select>
        </div>
        <div class="gap-small">
          <button class="btn btn-sm btn-default" onClick={() => {
            navigator.clipboard?.writeText(summaryText());
            alert("已复制到剪贴板");
          }}>📋 复制摘要</button>
          <button class="btn btn-sm btn-primary" onClick={doExport}>
            📤 生成并下载
          </button>
        </div>
      </div>

      <Show when={done()}>
        <div style={{
          padding: "10px 14px",
          background: "#d1fae5",
          border: "1px solid #6ee7b7",
          borderRadius: 6,
          color: "#065f46",
          marginBottom: 14
        }}>
          ✅ 导出成功！该摘要已同步保存到「导出记录」。
        </div>
      </Show>

      <div class="export-summary-block">
        <div class="export-head">
          <div class="export-title">📄 {project.name}</div>
          <div class="export-meta">
            <span style={{ marginRight: 14 }}>
              <b>
                {project.id}
              </b>
            </span>
            <span>格式：{format().toUpperCase()}</span>
          </div>
        </div>
        <div class="export-stats" style={{ marginBottom: 10 }}>
          <div class="export-stat">
            <div class="num">{project.originalText.length}</div>
            <div class="lbl">字数</div>
          </div>
          <div class="export-stat">
            <div class="num">{replacements.length}</div>
            <div class="lbl">疑似</div>
          </div>
          <div class="export-stat">
            <div class="num">{confirmedReps().length}</div>
            <div class="lbl">确认</div>
          </div>
          <div class="export-stat">
            <div class="num">{rejectedReps().length}</div>
            <div class="lbl">驳回</div>
          </div>
          <div class="export-stat">
            <div class="num">{manualReps().length}</div>
            <div class="lbl">人工</div>
          </div>
          <div class="export-stat">
            <div class="num">{dynastySet().length}</div>
            <div class="lbl">朝代</div>
          </div>
        </div>
        <div class="export-summary-text">
          {summaryText().split("\n").map(line => (
            <div>{line || "\u00a0"}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function fmt(s: string) {
  try {
    const d = new Date(s);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}:${ss}`;
  } catch {
    return s;
  }
}
