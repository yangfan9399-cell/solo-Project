import { createAsync, A } from "@solidjs/router";
import { createSignal, For, Show } from "solid-js";
import type { ExportSummary } from "../types";
import { apiFetch } from "../utils/fetcher";

export default function ExportsPage() {
  const summaries = createAsync<ExportSummary[]>(() => apiFetch("/api/exports").then(r => r.json()));
  const projects = createAsync(() => apiFetch("/api/projects").then(r => r.json() as any));
  const [format, setFormat] = createSignal("all");
  const [projectId, setProjectId] = createSignal("all");

  const filtered = () => {
    let list = summaries() ?? [];
    if (format() !== "all") list = list.filter(e => e.format === format());
    if (projectId() !== "all") list = list.filter(e => e.projectId === projectId());
    return list;
  };

  const projectName = (id: string) => projects()?.find((p: any) => p.id === id)?.name ?? id;

  return (
    <div>
      <div class="page-header">
        <div class="page-title-block">
          <h2>📤 审读摘要导出记录</h2>
          <p class="subtitle">所有项目的历史审读摘要导出与批次归档</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-default" onClick={() => alert("批量下载（演示）")}>📦 批量打包下载</button>
        </div>
      </div>

      <div class="filter-panel">
        <div class="filter-row">
          <div class="filter-group">
            <label class="filter-label">项目</label>
            <select class="filter-select" value={projectId()} onChange={e => setProjectId(e.currentTarget.value)}>
              <option value="all">全部项目</option>
              <For each={projects() ?? []}>
                {(p: any) => <option value={p.id}>{p.name} [{p.id}]</option>}
              </For>
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">导出格式</label>
            <select class="filter-select" value={format()} onChange={e => setFormat(e.currentTarget.value)}>
              <option value="all">全部格式</option>
              <option value="txt">纯文本 TXT</option>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="xml">XML</option>
            </select>
          </div>
          <div class="filter-group" />
          <div class="filter-group" />
          <div class="filter-group" />
        </div>
      </div>

      <Show when={filtered().length === 0} fallback={
        <For each={filtered()}>
          {exp => (
            <div class="panel" style={{ marginBottom: 16 }}>
              <div class="panel-header">
                <h3 class="panel-title">📄 {projectName(exp.projectId)}</h3>
                <div class="gap-small">
                  <span class="tag-chip">{exp.format.toUpperCase()}</span>
                  <span class="small muted">{exp.id}</span>
                </div>
              </div>
              <div class="panel-body">
                <div class="export-head" style={{ marginBottom: 8 }}>
                  <div class="export-meta">
                    <span style={{ marginRight: 18 }}>📅 导出：{fmt(exp.exportedAt)}</span>
                    <span style={{ marginRight: 18 }}>👤 {exp.exportedBy}</span>
                    <Show when={exp.versionId}><span>🏷 版本 {exp.versionId}</span></Show>
                  </div>
                  <div class="gap-small">
                    <button class="btn btn-xs btn-default" onClick={() => {
                      const blob = new Blob([exp.summaryContent], { type: "text/plain;charset=utf-8" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${exp.id}-摘要.${exp.format}`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}>⬇ 重新下载</button>
                    <button class="btn btn-xs btn-default" onClick={() => {
                      navigator.clipboard?.writeText(exp.summaryContent);
                      alert("已复制摘要内容");
                    }}>📋 复制</button>
                    <A href={`/project/${exp.projectId}`}>
                      <button class="btn btn-xs btn-primary">打开项目 →</button>
                    </A>
                  </div>
                </div>
                <div class="export-stats" style={{ marginBottom: 12 }}>
                  <div class="export-stat">
                    <div class="num">{exp.stats.totalCharacters}</div>
                    <div class="lbl">总字数</div>
                  </div>
                  <div class="export-stat">
                    <div class="num">{exp.stats.totalReplacements}</div>
                    <div class="lbl">疑似字</div>
                  </div>
                  <div class="export-stat">
                    <div class="num">{exp.stats.confirmed}</div>
                    <div class="lbl">已确认</div>
                  </div>
                  <div class="export-stat">
                    <div class="num">{exp.stats.rejected}</div>
                    <div class="lbl">已驳回</div>
                  </div>
                  <div class="export-stat">
                    <div class="num">{exp.stats.manual}</div>
                    <div class="lbl">人工</div>
                  </div>
                  <div class="export-stat">
                    <div class="num">{exp.stats.annotations}</div>
                    <div class="lbl">批注</div>
                  </div>
                </div>
                <div style={{
                  background: "#fafafa",
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  padding: "12px 16px",
                  fontSize: 13,
                  lineHeight: 1.8,
                  maxHeight: 260,
                  overflow: "auto",
                  whiteSpace: "pre-wrap",
                  fontFamily: "SimSun, STSong, serif"
                }}>
                  {exp.summaryContent}
                </div>
                <div class="small muted" style={{ marginTop: 8 }}>
                  💡 涉及朝代：{exp.stats.dynastiesCovered.join("、")}
                </div>
              </div>
            </div>
          )}
        </For>
      }>
        <div class="panel">
          <div class="panel-body empty-state">暂无导出记录，可在项目详情页导出摘要。
            <div style={{ marginTop: 10 }}>
              <A href="/"><button class="btn btn-sm btn-primary">前往项目台账 →</button></A>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}

function fmt(s: string) {
  try {
    const d = new Date(s);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}`;
  } catch { return s; }
}
