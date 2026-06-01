import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData, useFetcher, useSearchParams } from "@remix-run/react";
import { useState } from "react";
import Layout from "~/components/Layout";
import {
  getAllExhibits,
  searchExhibits,
  deleteExhibit,
  getAvailableExhibits,
} from "~/services/exhibitService";
import { EXHIBIT_CATEGORIES } from "~/types";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";
  const category = url.searchParams.get("category") || "";
  const viewMode = url.searchParams.get("view") || "grid";

  let exhibits = query ? searchExhibits(query) : getAllExhibits();

  if (category) {
    exhibits = exhibits.filter((e) => e.category === category);
  }

  return json({ exhibits, query, category, viewMode });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    const id = Number(formData.get("id"));
    deleteExhibit(id);
    return json({ success: true });
  }

  return json({ success: false });
}

export default function ExhibitsIndex() {
  const { exhibits, query, category, viewMode } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const fetcher = useFetcher();
  const [searchInput, setSearchInput] = useState(query);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: searchInput, category, view: viewMode });
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`确定要删除展品"${name}"吗？`)) {
      fetcher.submit({ intent: "delete", id: String(id) }, { method: "post" });
    }
  };

  return (
    <Layout title="展品档案">
      <div className="page-header">
        <h1 className="page-title">展品档案管理</h1>
        <div className="page-actions">
          <Link to="/exhibits/new" className="btn btn-primary">
            ➕ 新增展品
          </Link>
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", gap: "16px", marginBottom: "24px", alignItems: "center" }}>
          <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: "400px" }}>
            <div className="search-box">
              <input
                type="text"
                placeholder="搜索展品名称、编号、类别、年代..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
          </form>

          <div className="filter-item">
            <label>类别：</label>
            <select
              value={category}
              onChange={(e) => setSearchParams({ q: query, category: e.target.value, view: viewMode })}
            >
              <option value="">全部</option>
              {EXHIBIT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label>视图：</label>
            <select
              value={viewMode}
              onChange={(e) => setSearchParams({ q: query, category, view: e.target.value })}
            >
              <option value="grid">卡片视图</option>
              <option value="list">列表视图</option>
            </select>
          </div>
        </div>

        {exhibits.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏺</div>
            <div className="empty-state-title">暂无展品</div>
            <p>点击"新增展品"按钮创建第一个展品档案</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="exhibit-grid">
            {exhibits.map((exhibit) => (
              <div key={exhibit.id} className="exhibit-card">
                <img
                  src={
                    exhibit.image_url ||
                    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400"
                  }
                  alt={exhibit.name}
                  className="exhibit-card-image"
                />
                <div className="exhibit-card-content">
                  <div className="exhibit-card-title">{exhibit.name}</div>
                  <div className="exhibit-card-meta">
                    <span className="badge badge-info">{exhibit.code}</span>
                    <span className="badge badge-primary">{exhibit.category}</span>
                    {exhibit.era && <span>{exhibit.era}</span>}
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                    <Link to={`/exhibits/${exhibit.id}`} className="btn btn-sm btn-secondary">
                      查看
                    </Link>
                    <Link to={`/exhibits/${exhibit.id}/edit`} className="btn btn-sm btn-outline">
                      编辑
                    </Link>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(exhibit.id, exhibit.name)}
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>展品编号</th>
                  <th>展品名称</th>
                  <th>类别</th>
                  <th>年代</th>
                  <th>材质</th>
                  <th>存放位置</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {exhibits.map((exhibit) => (
                  <tr key={exhibit.id}>
                    <td>
                      <span className="badge badge-info">{exhibit.code}</span>
                    </td>
                    <td>
                      <Link
                        to={`/exhibits/${exhibit.id}`}
                        style={{ color: "var(--accent-color)", textDecoration: "none" }}
                      >
                        {exhibit.name}
                      </Link>
                    </td>
                    <td>{exhibit.category}</td>
                    <td>{exhibit.era || "-"}</td>
                    <td>{exhibit.material || "-"}</td>
                    <td>{exhibit.storage_location || "-"}</td>
                    <td>
                      <span
                        className={`badge ${
                          exhibit.condition === "完好" ? "badge-success" : "badge-warning"
                        }`}
                      >
                        {exhibit.condition || "未知"}
                      </span>
                    </td>
                    <td style={{ display: "flex", gap: "8px" }}>
                      <Link to={`/exhibits/${exhibit.id}`} className="btn btn-sm btn-secondary">
                        查看
                      </Link>
                      <Link to={`/exhibits/${exhibit.id}/edit`} className="btn btn-sm btn-outline">
                        编辑
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
