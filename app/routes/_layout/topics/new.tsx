import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/_layout/topics/new")({
  component: NewTopicPage,
});

function NewTopicPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    source: "",
    sourceUrl: "",
    categoryId: "",
    copyrightEvidence: "",
    contentOutline: "",
    priority: 2,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      } else {
        setCategories([
          { id: "cat1", name: "科技" },
          { id: "cat2", name: "财经" },
          { id: "cat3", name: "文化" },
          { id: "cat4", name: "体育" },
        ]);
      }
    } catch {
      setCategories([
        { id: "cat1", name: "科技" },
        { id: "cat2", name: "财经" },
        { id: "cat3", name: "文化" },
        { id: "cat4", name: "体育" },
      ]);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (submitType: "draft" | "review") => {
    setLoading(true);
    try {
      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          status: submitType === "review" ? "PENDING_REVIEW" : "DRAFT",
          submitterId: "editor1-id",
          currentHandlerId: submitType === "review" ? "chief-id" : "editor1-id",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        navigate({ to: "/topics/$topicId", params: { topicId: data.id } });
      } else {
        alert("提交失败，请重试");
      }
    } catch (error) {
      console.error("提交失败:", error);
      alert("提交失败，请检查网络连接");
    }
    setLoading(false);
  };

  return (
    <div className="new-topic-page">
      <div className="page-header">
        <h2 className="page-title">提交选题</h2>
        <button className="btn btn-default" onClick={() => navigate({ to: "/" })}>
          返回列表
        </button>
      </div>

      <div className="card">
        <div className="form-section">
          <h3 className="section-title">基本信息</h3>

          <div className="form-group">
            <label className="form-label">选题标题 *</label>
            <input
              type="text"
              className="form-input"
              placeholder="请输入选题标题"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">内容摘要 *</label>
            <textarea
              className="form-textarea"
              placeholder="请简要描述选题内容..."
              value={formData.summary}
              onChange={(e) => handleChange("summary", e.target.value)}
            />
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">所属栏目</label>
              <select
                className="form-select"
                value={formData.categoryId}
                onChange={(e) => handleChange("categoryId", e.target.value)}
              >
                <option value="">请选择栏目</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">优先级</label>
              <select
                className="form-select"
                value={formData.priority}
                onChange={(e) => handleChange("priority", Number(e.target.value))}
              >
                <option value={1}>高</option>
                <option value={2}>中</option>
                <option value={3}>低</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">来源与版权</h3>

          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">选题来源 *</label>
              <input
                type="text"
                className="form-input"
                placeholder="如：新闻网站、社交媒体等"
                value={formData.source}
                onChange={(e) => handleChange("source", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">来源链接</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://..."
                value={formData.sourceUrl}
                onChange={(e) => handleChange("sourceUrl", e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">版权证据</label>
            <textarea
              className="form-textarea"
              placeholder="请提供版权授权证明、授权编号等信息..."
              value={formData.copyrightEvidence}
              onChange={(e) => handleChange("copyrightEvidence", e.target.value)}
              style={{ minHeight: "80px" }}
            />
            <p className="form-hint">
              提示：提供完整的版权材料可以加快审核速度
            </p>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">内容大纲</h3>
          <textarea
            className="form-textarea"
            placeholder="请列出内容结构大纲，分点描述..."
            value={formData.contentOutline}
            onChange={(e) => handleChange("contentOutline", e.target.value)}
            style={{ minHeight: "150px" }}
          />
        </div>

        <div className="form-actions">
          <button
            className="btn btn-default"
            onClick={() => handleSubmit("draft")}
            disabled={loading || !formData.title}
          >
            保存草稿
          </button>
          <button
            className="btn btn-primary"
            onClick={() => handleSubmit("review")}
            disabled={loading || !formData.title || !formData.summary || !formData.source}
          >
            {loading ? "提交中..." : "提交审核"}
          </button>
        </div>
      </div>

      <style>{pageStyles}</style>
    </div>
  );
}

const pageStyles = `
  .new-topic-page { margin-bottom: 20px; }
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  .page-title {
    font-size: 1.4rem;
    font-weight: 600;
    color: #1a1a2e;
  }
  .form-section {
    margin-bottom: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid #f0f2f5;
  }
  .form-section:last-of-type {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
  .section-title {
    font-size: 1.05rem;
    font-weight: 600;
    margin-bottom: 16px;
    color: #1a1a2e;
  }
  .form-hint {
    margin-top: 6px;
    font-size: 0.8rem;
    color: #999;
  }
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid #f0f2f5;
  }
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  @media (max-width: 768px) {
    .grid-2 { grid-template-columns: 1fr; }
  }
`;

export default NewTopicPage;
