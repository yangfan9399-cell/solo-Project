import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import Layout from "~/components/Layout";
import { getExhibitById } from "~/services/exhibitService";
import { getDamagesByExhibitId } from "~/services/damageService";

export async function loader({ params }: LoaderFunctionArgs) {
  const id = Number(params.id);
  const exhibit = getExhibitById(id);
  const damages = getDamagesByExhibitId(id);

  if (!exhibit) {
    throw new Response("展品不存在", { status: 404 });
  }

  return json({ exhibit, damages });
}

export default function ExhibitDetail() {
  const { exhibit, damages } = useLoaderData<typeof loader>();

  return (
    <Layout title="展品详情">
      <div className="page-header">
        <h1 className="page-title">{exhibit.name}</h1>
        <div className="page-actions">
          <Link to="/exhibits" className="btn btn-outline">
            ← 返回列表
          </Link>
          <Link to={`/exhibits/${exhibit.id}/edit`} className="btn btn-secondary">
            ✏️ 编辑
          </Link>
          <Link to={`/loans/new?exhibitId=${exhibit.id}`} className="btn btn-primary">
            📋 申请借展
          </Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "24px" }}>
        <div>
          <div className="card">
            <img
              src={
                exhibit.image_url ||
                "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400"
              }
              alt={exhibit.name}
              className="exhibit-image"
            />
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">基本信息</div>
            </div>
            <div className="detail-grid">
              <div className="detail-item">
                <div className="detail-label">展品编号</div>
                <div className="detail-value">{exhibit.code}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">展品类别</div>
                <div className="detail-value">{exhibit.category}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">年代</div>
                <div className="detail-value">{exhibit.era || "-"}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">材质</div>
                <div className="detail-value">{exhibit.material || "-"}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">尺寸</div>
                <div className="detail-value">{exhibit.dimensions || "-"}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">重量</div>
                <div className="detail-value">{exhibit.weight || "-"}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">文物等级</div>
                <div className="detail-value">{exhibit.value || "-"}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">保存状态</div>
                <div className="detail-value">
                  <span
                    className={`badge ${
                      exhibit.condition === "完好" ? "badge-success" : "badge-warning"
                    }`}
                  >
                    {exhibit.condition || "未知"}
                  </span>
                </div>
              </div>
              <div className="detail-item">
                <div className="detail-label">存放位置</div>
                <div className="detail-value">{exhibit.storage_location || "-"}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">保险信息</div>
                <div className="detail-value">{exhibit.insurance_info || "-"}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">展品描述</div>
            </div>
            <p>{exhibit.description || "暂无描述"}</p>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">损伤记录</div>
            </div>
            {damages.length === 0 ? (
              <div className="empty-state" style={{ padding: "32px" }}>
                <div className="empty-state-icon">✅</div>
                <div className="empty-state-title">暂无损伤记录</div>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>发现日期</th>
                      <th>损伤类型</th>
                      <th>严重程度</th>
                      <th>状态</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {damages.map((damage) => (
                      <tr key={damage.id}>
                        <td>{damage.discovery_date}</td>
                        <td>{damage.damage_type || "-"}</td>
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
                              damage.status === "resolved" ? "badge-success" : "badge-warning"
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
                        <td>
                          <Link to={`/damages/${damage.id}`} className="btn btn-sm btn-secondary">
                            查看
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div style={{ marginTop: "16px" }}>
              <Link
                to={`/damages/new?exhibitId=${exhibit.id}`}
                className="btn btn-sm btn-outline"
              >
                ➕ 记录损伤
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
