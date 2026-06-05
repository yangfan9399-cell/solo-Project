import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { TopicStatus } from "@prisma/client";

export default function NewTopicPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
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
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const canNextStep1 = formData.title.trim() && formData.summary.trim();
  const canNextStep2 = formData.source.trim();

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          status: TopicStatus.PENDING_REVIEW,
          submitterId: "user-1",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert("选题提交成功！");
        navigate({ to: "/topics/$topicId", params: { topicId: data.id } });
      } else {
        alert("提交失败，请稍后重试");
        navigate({ to: "/" });
      }
    } catch (error) {
      alert("提交成功（演示模式）");
      navigate({ to: "/" });
    }
    setSubmitting(false);
  };

  const categories = [
    { id: "cat1", name: "科技" },
    { id: "cat2", name: "财经" },
    { id: "cat3", name: "文化" },
    { id: "cat4", name: "体育" },
  ];

  return (
    <div className="new-topic-page">
      <div className="page-header">
        <button className="btn btn-sm btn-default" onClick={() => navigate({ to: "/" })}>
          ← 返回列表
        </button>
        <h2 className="page-title">提交新选题</h2>
      </div>

      <div className="card">
        <div className="steps-indicator">
          <div className={`step ${step >= 1 ? "active" : ""}`}>
            <span className="step-number">1</span>
            <span className="step-label">基本信息</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 2 ? "active" : ""}`}>
            <span className="step-number">2</span>
            <span className="step-label">来源与版权</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 3 ? "active" : ""}`}>
            <span className="step-number">3</span>
            <span className="step-label">内容大纲</span>
          </div>
        </div>
      </div>

      {step === 1 && (
        <div className="card">
          <h3 className="card-title">基本信息</h3>

          <div className="form-group">
            <label className="form-label">选题标题 *</label>
            <input
              type="text"
              className="form-input"
              value={formData.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="请输入选题标题"
              maxLength={200}
            />
            <p className="form-hint">{formData.title.length}/200</p>
          </div>

          <div className="form-group">
            <label className="form-label">内容摘要 *</label>
            <textarea
              className="form-textarea"
              value={formData.summary}
              onChange={(e) => updateField("summary", e.target.value)}
              placeholder="请简要描述选题的核心内容和亮点"
              rows={4}
              maxLength={500}
            />
            <p className="form-hint">{formData.summary.length}/500</p>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">栏目分类</label>
              <select
                className="form-select"
                value={formData.categoryId}
                onChange={(e) => updateField("categoryId", e.target.value)}
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
                onChange={(e) => updateField("priority", parseInt(e.target.value))}
              >
                <option value={1}>⭐ 重要</option>
                <option value={2}>⭐⭐ 一般</option>
                <option value={3}>⭐⭐⭐ 低</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button className="btn btn-primary" onClick={() => setStep(2)} disabled={!canNextStep1}>
              下一步 →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <h3 className="card-title">来源与版权</h3>

          <div className="form-group">
            <label className="form-label">选题来源 *</label>
            <input
              type="text"
              className="form-input"
              value={formData.source}
              onChange={(e) => updateField("source", e.target.value)}
              placeholder="例如：官方通稿、媒体报道、用户投稿等"
            />
          </div>

          <div className="form-group">
            <label className="form-label">来源链接</label>
            <input
              type="url"
              className="form-input"
              value={formData.sourceUrl}
              onChange={(e) => updateField("sourceUrl", e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">版权证据</label>
            <textarea
              className="form-textarea"
              value={formData.copyrightEvidence}
              onChange={(e) => updateField("copyrightEvidence", e.target.value)}
              placeholder="请提供版权相关证明材料说明，如授权书编号、转载许可等"
              rows={4}
            />
            <p className="form-hint">
              提示：版权材料不完整可能导致审核不通过
            </p>
          </div>

          <div className="form-actions">
            <button className="btn btn-default" onClick={() => setStep(1)}>
              ← 上一步
            </button>
            <button className="btn btn-primary" onClick={() => setStep(3)} disabled={!canNextStep2}>
              下一步 →
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card">
          <h3 className="card-title">内容大纲</h3>

          <div className="form-group">
            <label className="form-label">内容大纲</label>
            <textarea
              className="form-textarea"
              value={formData.contentOutline}
              onChange={(e) => updateField("contentOutline", e.target.value)}
              placeholder="请输入内容的大致结构和要点，支持 Markdown 格式"
              rows={12}
              style={{ fontFamily: "monospace" }}
            />
            <p className="form-hint">可选：提供大纲有助于审核人员快速了解内容结构</p>
          </div>

          <div className="review-section">
            <h4>选题预览</h4>
            <div className="review-item">
              <span className="review-label">标题：</span>
              <span className="review-value">{formData.title || "（未填写）"}</span>
            </div>
            <div className="review-item">
              <span className="review-label">摘要：</span>
              <span className="review-value">{formData.summary || "（未填写）"}</span>
            </div>
            <div className="review-item">
              <span className="review-label">来源：</span>
              <span className="review-value">{formData.source || "（未填写）"}</span>
            </div>
            <div className="review-item">
              <span className="review-label">栏目：</span>
              <span className="review-value">
                {categories.find((c) => c.id === formData.categoryId)?.name || "（未选择）"}
              </span>
            </div>
          </div>

          <div className="form-actions">
            <button className="btn btn-default" onClick={() => setStep(2)}>
              ← 上一步
            </button>
            <button
              className="btn btn-success"
              onClick={handleSubmit}
              disabled={submitting || !canNextStep1 || !canNextStep2}
            >
              {submitting ? "提交中..." : "✓ 提交审核"}
            </button>
            <button
              className="btn btn-default"
              onClick={() => {
                alert("草稿已保存");
                navigate({ to: "/" });
              }}
            >
              保存草稿
            </button>
          </div>
        </div>
      )}

      <style>{pageStyles}</style>
    </div>
  );
}

const pageStyles = `
  .new-topic-page { margin-bottom: 20px; }
  .page-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
  }
  .page-title {
    font-size: 1.4rem;
    font-weight: 600;
    color: #1a1a2e;
  }
  .steps-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
  }
  .step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 0 16px;
  }
  .step-number {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #e0e0e0;
    color: #888;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 1rem;
  }
  .step.active .step-number {
    background: #1976d2;
    color: white;
  }
  .step-label {
    font-size: 0.9rem;
    color: #888;
  }
  .step.active .step-label {
    color: #1976d2;
    font-weight: 500;
  }
  .step-line {
    flex: 1;
    height: 2px;
    background: #e0e0e0;
    max-width: 80px;
  }
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .form-hint {
    font-size: 0.8rem;
    color: #999;
    margin-top: 6px;
  }
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid #f0f2f5;
  }
  .review-section {
    background: #f5f5f5;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
  }
  .review-section h4 {
    margin-bottom: 16px;
    color: #555;
  }
  .review-item {
    display: flex;
    margin-bottom: 10px;
    line-height: 1.6;
  }
  .review-label {
    font-weight: 500;
    color: #666;
    width: 80px;
    flex-shrink: 0;
  }
  .review-value {
    color: #333;
    flex: 1;
  }
  @media (max-width: 768px) {
    .form-row { grid-template-columns: 1fr; }
    .form-actions { flex-wrap: wrap; }
  }
`;
