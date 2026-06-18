import { createAsync } from "@solidjs/router";
import { createSignal, For, Show } from "solid-js";
import type { DynastyRule } from "../types";
import { apiFetch } from "../utils/fetcher";

export default function RulesPage() {
  const rules = createAsync<DynastyRule[]>(() => apiFetch("/api/rules").then(r => r.json()));
  const [dynasty, setDynasty] = createSignal<string>("all");
  const [severity, setSeverity] = createSignal<string>("all");
  const [search, setSearch] = createSignal("");

  const dynastyList = () => Array.from(new Set((rules() ?? []).map(r => r.dynasty))).sort();

  const filtered = () => {
    let list = rules() ?? [];
    if (dynasty() !== "all") list = list.filter(r => r.dynasty === dynasty());
    if (severity() !== "all") list = list.filter(r => r.severity === severity());
    if (search()) {
      const q = search().toLowerCase();
      list = list.filter(r =>
        r.emperor.toLowerCase().includes(q) ||
        r.reignTitle.includes(q) ||
        r.tabooCharacter.includes(q) ||
        r.replacementCharacter.includes(q) ||
        r.reason.includes(q) ||
        r.sources.some(s => s.includes(q))
      );
    }
    return list;
  };

  const statsByDynasty = () => {
    const map = new Map<string, number>();
    for (const r of rules() ?? []) map.set(r.dynasty, (map.get(r.dynasty) ?? 0) + 1);
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], "zh"));
  };

  return (
    <div>
      <div class="page-header">
        <div class="page-title-block">
          <h2>📜 朝代避讳规则库</h2>
          <p class="subtitle">收录西汉至清历代帝王名讳、避讳字及替换规则，共 {(rules() ?? []).length} 条</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-default" onClick={() => alert("导入规则集（演示）")}>📥 导入规则</button>
          <button class="btn btn-primary" onClick={() => alert("新建规则（演示）")}>＋ 新增避讳规则</button>
        </div>
      </div>

      <div class="stats-grid" style={{ gridTemplateColumns: `repeat(${Math.min(6, statsByDynasty().length)}, 1fr)` }}>
        <For each={statsByDynasty()}>
          {([d, c]) => (
            <div class="stat-card" style={{ cursor: "pointer" }} onClick={() => setDynasty(d)}>
              <div class="stat-label">{d}</div>
              <div class="stat-value">{c}</div>
              <div class="stat-hint">条规则</div>
            </div>
          )}
        </For>
      </div>

      <div class="filter-panel">
        <div class="filter-row">
          <div class="filter-group">
            <label class="filter-label">朝代</label>
            <select class="filter-select" value={dynasty()} onChange={e => setDynasty(e.currentTarget.value)}>
              <option value="all">全部朝代</option>
              <For each={dynastyList()}>{d => <option value={d}>{d}</option>}</For>
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">严度</label>
            <select class="filter-select" value={severity()} onChange={e => setSeverity(e.currentTarget.value)}>
              <option value="all">全部严度</option>
              <option value="strict">严格</option>
              <option value="moderate">中度</option>
              <option value="mild">宽松</option>
            </select>
          </div>
          <div class="filter-group" style={{ gridColumn: "span 3" }}>
            <label class="filter-label">检索（皇帝 / 名讳 / 字 / 依据）</label>
            <input type="text" class="filter-input" placeholder="如：李世民、民→人、高祖、旧唐书…"
              value={search()} onInput={e => setSearch(e.currentTarget.value)} />
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <h3 class="panel-title">避讳规则一览表 <span class="panel-meta">共 {filtered().length} 条</span></h3>
          <div class="small muted">可点击朝代卡快速筛选</div>
        </div>
        <div class="table-wrap">
          <table class="rules-table">
            <thead>
              <tr>
                <th style={{ width: "8%" }}>ID</th>
                <th style={{ width: "9%" }}>朝代</th>
                <th style={{ width: "14%" }}>皇帝 / 御名</th>
                <th style={{ width: "15%", textAlign: "center" }}>讳字 → 替换</th>
                <th style={{ width: "8%", textAlign: "center" }}>严度</th>
                <th>避讳理由</th>
                <th style={{ width: "13%" }}>起讫（年）</th>
                <th>依据典籍</th>
              </tr>
            </thead>
            <tbody>
              <For each={filtered()} fallback={<tr><td colspan="8" class="empty-state">没有符合条件的规则</td></tr>}>
                {r => (
                  <tr>
                    <td class="small" style={{ fontFamily: "ui-monospace, monospace" }}>{r.id}</td>
                    <td style={{ fontWeight: 600 }}>{r.dynasty}</td>
                    <td>{r.emperor}（{r.reignTitle}）</td>
                    <td style={{ textAlign: "center", fontFamily: "SimSun, STSong, serif", fontSize: 15 }}>
                      <span style={{
                        display: "inline-block", padding: "1px 10px",
                        background: "#fecaca", color: "#7f1d1d",
                        borderRadius: 4, marginRight: 4
                      }}>{r.tabooCharacter}</span>
                      <span style={{ color: "#9ca3af" }}>→</span>
                      <span style={{
                        display: "inline-block", padding: "1px 10px",
                        background: "#bbf7d0", color: "#14532d",
                        borderRadius: 4, marginLeft: 4
                      }}>{r.replacementCharacter}</span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span class={`badge badge-${r.severity}`}>
                        {r.severity === "strict" ? "严格" : r.severity === "moderate" ? "中度" : "宽松"}
                      </span>
                    </td>
                    <td class="small">{r.reason}</td>
                    <td class="small">
                      {r.startYear < 0 ? `前${-r.startYear}` : r.startYear} ～ {r.endYear < 0 ? `前${-r.endYear}` : r.endYear}
                    </td>
                    <td class="small muted">
                      <For each={r.sources}>{(s, i) => (
                        <span>{i() > 0 ? "；" : ""}{s}</span>
                      )}</For>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
