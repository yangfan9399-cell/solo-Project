import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData, useSearchParams } from "@remix-run/react";
import Layout from "~/components/Layout";
import { getAllDamages } from "~/services/damageService";
import { getAllExhibits } from "~/services/exhibitService";
import { DAMAGE_TYPES } from "~/types";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "";
  const severity = url.searchParams.get("severity") || "";
  const damageType = url.searchParams.get("damageType") || "";

  let damages = getAllDamages();
  const exhibits = getAllExhibits();

  if (status) {
    damages = damages.filter((d) => d.status === status);
  }
  if (severity) {
    damages = damages.filter((d) => d.damage_severity === severity);
  }
  if (damageType) {
    damages = damages.filter((d) => d.damage_type === damageType);
  }

  return json({ damages, exhibits, status, severity, damageType });
}

export default function DamagesIndex() {
  const { damages, exhibits, status, severity, damageType } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  const getExhibitName = (exhibitId: number) => {
    const exhibit = exhibits.find((e) => e.id === exhibitId);
    return exhibit?.name || "未知展品";
  };

  return (
    <Layout title="损伤记录">
      <div className="page-header">
        <h1 className="page-title">损伤记录管理</h1>
        <div className="page-actions">
          <Link to="/damages/new" className="btn btn-primary">
            ➕ 记录损伤
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="filter-item">
            <label>状态：</label>
            <select
              value={status}
              onChange={(e) =>
                setSearchParams({ status: e.target.value, severity, damageType })
              }
            >
              <option value="">全部状态</option>
              <option value="reported">已报告</option>
              <option value="investigating">调查中</option>
              <option value="repairing">修复中</option>
              <option value="resolved">已解决</option>
            </select>
          </div>

          <div className="filter-item">
            <label>严重程度：</label>
            <select
              value={severity}
              onChange={(e) =>
                setSearchParams({ status, severity: e.target.value, damageType })
              }
            >
              <option value="">全部</option>
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
              <option value="critical">严重</option>
            </select>
          </div>

          <div className="filter-item">
            <label>损伤类型：</label>
            <select
              value={damageType}
              onChange={(e) =>
                setSearchParams({ status, severity, damageType: e.target.value })
              }
            >
              <option value="">全部类型</option>
              {DAMAGE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {damages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <div className="empty-state-title">暂无损伤记录</div>
            <p>所有展品状态良好</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>展品</th>
                  <th>损伤类型</th>
                  <th>部位</th>
                  <th>严重程度</th>
                  <th>状态</th>
                  <th>报告人</th>
                  <th>发现日期</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {damages.map((damage) => (
                  <tr key={damage.id}>
                    <td>
                      <span className="badge badge-info">
                        D-{String(damage.id).padStart(4, "0")}
                      </span>
                    </td>
                    <td>{getExhibitName(damage.exhibit_id)}</td>
                    <td>{damage.damage_type || "-"}</td>
                    <td>{damage.damage_location || "-"}</td>
                    <td>
                      <span
                        className={`badge ${
                          damage.damage_severity === "critical"
                            ? "badge-danger"
                            : damage.damage_severity === "high"
                            ? "badge-warning"
                            : "badge-primary"
                        }`}
                      >
                        {damage.damage_severity === "critical"
                          ? "严重"
                          : damage.damage_severity === "high"
                          ? "高"
                          : damage.damage_severity === "medium"
                          ? "中"
                          : "低"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          damage.status === "resolved"
                            ? "badge-success"
                            : damage.status === "repairing"
                            ? "badge-warning"
                            : damage.status === "investigating"
                            ? "badge-info"
                            : "badge-danger"
                        }`}
                      >
                        {damage.status === "reported"
                          ? "已报告"
                          : damage.status === "investigating"
                          ? "调查中"
                          : damage.status === "repairing"
                          ? "修复中"
                          : "已解决"}
                      </span>
                    </td>
                    <td>{damage.reporter_name}</td>
                    <td>{damage.discovery_date.slice(0, 10)}</td>
                    <td>
                      <Link
                        to={`/damages/${damage.id}`}
                        className="btn btn-sm btn-secondary"
                      >
                        查看
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
