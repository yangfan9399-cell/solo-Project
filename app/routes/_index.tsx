import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData, useSearchParams, useSubmit, Form, useNavigation } from "@remix-run/react";
import { listProjects, getProjectStats, deleteProject } from "~/db/queries";
import { seed } from "~/db/seed";
import { statusLabel, riverTypeLabel, fishTypeLabel } from "~/utils/report";
import type { Project, ProjectStatus, RiverType } from "~/types";

export const meta = () => {
  return [{ title: "项目台账 · 小型水电站鱼道流速评估工具" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || undefined;
  const status = (url.searchParams.get("status") as ProjectStatus | undefined) || undefined;
  const river_type = (url.searchParams.get("river_type") as RiverType | undefined) || undefined;
  const has_anomaly_raw = url.searchParams.get("has_anomaly");
  const has_anomaly = has_anomaly_raw ? has_anomaly_raw === "1" : undefined;
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));

  seed();

  const stats = getProjectStats();
  const list = listProjects({ search, status, river_type, has_anomaly, page, per_page: 10 });
  return json({ stats, list, filters: { search, status, river_type, has_anomaly, page } });
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const _action = form.get("_action");
  if (_action === "delete") {
    const id = Number(form.get("id"));
    if (id) deleteProject(id);
  }
  return json({ ok: true });
}

export default function ProjectsIndex() {
  const { stats, list, filters } = useLoaderData<typeof loader>();
  const [, setSearchParams] = useSearchParams();
  const submit = useSubmit();
  const nav = useNavigation();

  function updateFilter(key: string, value: string | undefined) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      next.delete("page");
      return next;
    });
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">📋 项目台账</div>
          <div className="page-subtitle">小型水电站鱼道流速评估项目总览，支持多条件筛选与快速检索</div>
        </div>
        <div className="section-actions">
          <Link to="/projects/new" className="btn btn-primary">➕ 新建评估</Link>
          <Link to="/reports" className="btn btn-secondary">📊 批量导出</Link>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📁</div>
          <div className="stat-value metric-value">{stats.total}</div>
          <div className="stat-label">评估项目总数</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">⚙️</div>
          <div className="stat-value metric-value">{stats.in_progress}</div>
          <div className="stat-label">进行中评估</div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">✅</div>
          <div className="stat-value metric-value">{stats.completed}</div>
          <div className="stat-label">已完成项目</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-icon">⚠️</div>
          <div className="stat-value metric-value">{stats.with_anomaly}</div>
          <div className="stat-label">含异常数据项目</div>
        </div>
      </div>

      {stats.with_anomaly > 0 && (
        <div className="alert alert-warning">
          <span className="alert-icon">⚠️</span>
          <div>
            <strong>异常数据提示</strong>：当前有 {stats.with_anomaly} 个项目存在未处理的数据异常（超范围、不一致或缺失）。点击表格"异常"列或进入项目详情可查看具体异常明细。
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <div className="filters-bar">
            <div className="search-input">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="搜索项目名称、编号、电站或河流..."
                defaultValue={filters.search ?? ""}
                onChange={(e) => updateFilter("search", e.target.value || undefined)}
              />
            </div>
            <div className="select-input">
              <select
                defaultValue={filters.status ?? ""}
                onChange={(e) => updateFilter("status", e.target.value || undefined)}
              >
                <option value="">全部状态</option>
                <option value="draft">草稿</option>
                <option value="in_progress">进行中</option>
                <option value="completed">已完成</option>
                <option value="archived">已归档</option>
              </select>
            </div>
            <div className="select-input">
              <select
                defaultValue={filters.river_type ?? ""}
                onChange={(e) => updateFilter("river_type", e.target.value || undefined)}
              >
                <option value="">全部河流类型</option>
                <option value="mountain">山区河流</option>
                <option value="plain">平原河流</option>
                <option value="transition">过渡段河流</option>
              </select>
            </div>
            <div className="select-input">
              <select
                defaultValue={filters.has_anomaly === undefined ? "" : filters.has_anomaly ? "1" : "0"}
                onChange={(e) => {
                  const v = e.target.value;
                  updateFilter("has_anomaly", v === "" ? undefined : v);
                }}
              >
                <option value="">异常状态</option>
                <option value="1">存在异常</option>
                <option value="0">无异常</option>
              </select>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setSearchParams(new URLSearchParams())}
            >
              重置
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>项目编号</th>
                  <th>项目名称</th>
                  <th>电站 / 河流</th>
                  <th>目标鱼种</th>
                  <th>河流类型</th>
                  <th>状态</th>
                  <th>异常</th>
                  <th>当前版本</th>
                  <th>设计人</th>
                  <th>更新时间</th>
                  <th style={{ textAlign: "right" }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {list.data.length === 0 ? (
                  <tr>
                    <td colSpan={11}>
                      <div className="empty-state">
                        <div className="empty-state-icon">🔍</div>
                        <div className="empty-state-title">未找到匹配的项目</div>
                        <div className="empty-state-desc">尝试修改筛选条件或新建一个评估项目</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  list.data.map((p: Project) => (
                    <tr key={p.id}>
                      <td className="metric-value"><strong>{p.code}</strong></td>
                      <td>
                        <Link to={`/projects/${p.id}`} style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 500 }}>
                          {p.name}
                        </Link>
                      </td>
                      <td>
                        <div>{p.station_name}</div>
                        <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{p.river_name}</div>
                      </td>
                      <td>{fishTypeLabel(p.fish_type)}</td>
                      <td>{riverTypeLabel(p.river_type)}</td>
                      <td>
                        <StatusBadge status={p.status} />
                      </td>
                      <td>
                        {p.has_anomaly ? (
                          <span className="badge badge-danger">
                            <span className="dot"></span>
                            {p.anomaly_count} 项
                          </span>
                        ) : (
                          <span className="badge badge-success">
                            <span className="dot"></span>
                            正常
                          </span>
                        )}
                      </td>
                      <td className="metric-value">{p.current_version ?? "—"}</td>
                      <td>{p.designer}</td>
                      <td style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{p.updated_at.slice(0, 16).replace("T", " ")}</td>
                      <td style={{ textAlign: "right" }}>
                        <div className="action-cell" style={{ justifyContent: "flex-end" }}>
                          <Link to={`/projects/${p.id}`} className="link-btn">编辑</Link>
                          <Link to={`/projects/${p.id}/report`} className="link-btn">报告</Link>
                          <Form method="post" onSubmit={(e) => {
                            if (!confirm(`确定要删除项目【${p.name}】吗？此操作不可恢复。`)) e.preventDefault();
                          }} style={{ display: "inline" }}>
                            <input type="hidden" name="id" value={p.id} />
                            <button type="submit" name="_action" value="delete" className="link-btn danger">删除</button>
                          </Form>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <div className="pagination-info">
              共 <strong>{list.total}</strong> 条记录，当前第 {list.page} 页，每页 {list.per_page} 条
            </div>
            <div className="pagination-buttons">
              <button
                className="page-btn"
                disabled={list.page <= 1 || nav.state !== "idle"}
                onClick={() => updateFilter("page", String(list.page - 1))}
              >上一页</button>
              {Array.from({ length: Math.max(1, Math.ceil(list.total / list.per_page)) }, (_, i) => i + 1)
                .slice(Math.max(0, list.page - 3), Math.max(0, list.page - 3) + 5)
                .map((p) => (
                  <button
                    key={p}
                    className={"page-btn" + (p === list.page ? " active" : "")}
                    onClick={() => updateFilter("page", String(p))}
                  >{p}</button>
                ))}
              <button
                className="page-btn"
                disabled={list.page >= Math.ceil(list.total / list.per_page) || nav.state !== "idle"}
                onClick={() => updateFilter("page", String(list.page + 1))}
              >下一页</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  const map: Record<ProjectStatus, { cls: string; label: string }> = {
    draft: { cls: "badge-neutral", label: "草稿" },
    in_progress: { cls: "badge-info", label: "进行中" },
    completed: { cls: "badge-success", label: "已完成" },
    archived: { cls: "badge-neutral", label: "已归档" },
  };
  const m = map[status];
  return (
    <span className={`badge ${m.cls}`}>
      <span className="dot"></span>
      {m.label}
    </span>
  );
}
