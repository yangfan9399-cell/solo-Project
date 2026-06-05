import { useEffect, useState } from "react";

interface StatsData {
  overview: {
    total: number;
    published: number;
    pending: number;
    rejected: number;
    delayed: number;
    avgDelay: number;
    publishRate: string;
  };
  byCategory: {
    id: string;
    name: string;
    total: number;
    published: number;
    rejected: number;
    pending: number;
    publishRate: number;
  }[];
  byEditor: {
    id: string;
    name: string;
    role: string;
    total: number;
    published: number;
    rejected: number;
    publishRate: number;
    rejectRate: number;
    totalDelays: number;
    delayedTopics: number;
  }[];
  rejectReasons: { reason: string; count: number }[];
  delayDistribution: { range: string; count: number }[];
}

export default function ReviewPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stats/review");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        setStats(getMockStats());
      }
    } catch (error) {
      console.error("加载统计数据失败:", error);
      setStats(getMockStats());
    }
    setLoading(false);
  };

  const getMockStats = (): StatsData => ({
    overview: {
      total: 12,
      published: 3,
      pending: 5,
      rejected: 1,
      delayed: 2,
      avgDelay: 1.5,
      publishRate: "25.0%",
    },
    byCategory: [
      { id: "cat1", name: "科技", total: 5, published: 1, rejected: 0, pending: 4, publishRate: 20 },
      { id: "cat2", name: "财经", total: 3, published: 1, rejected: 0, pending: 2, publishRate: 33.3 },
      { id: "cat3", name: "文化", total: 2, published: 0, rejected: 0, pending: 2, publishRate: 0 },
      { id: "cat4", name: "体育", total: 2, published: 1, rejected: 1, pending: 0, publishRate: 50 },
    ],
    byEditor: [
      {
        id: "u1",
        name: "张编辑",
        role: "EDITOR",
        total: 7,
        published: 2,
        rejected: 0,
        publishRate: 28.6,
        rejectRate: 0,
        totalDelays: 2,
        delayedTopics: 1,
      },
      {
        id: "u2",
        name: "李编辑",
        role: "EDITOR",
        total: 5,
        published: 1,
        rejected: 1,
        publishRate: 20,
        rejectRate: 20,
        totalDelays: 1,
        delayedTopics: 1,
      },
    ],
    rejectReasons: [
      { reason: "版权材料缺失", count: 1 },
      { reason: "标题需修改", count: 1 },
      { reason: "内容不符合定位", count: 1 },
      { reason: "质量不达标", count: 0 },
    ],
    delayDistribution: [
      { range: "0次", count: 10 },
      { range: "1次", count: 1 },
      { range: "2次", count: 1 },
      { range: "3次及以上", count: 0 },
    ],
  });

  if (loading || !stats) {
    return <div className="card"><p>加载中...</p></div>;
  }

  const tabs = [
    { id: "overview", label: "总览" },
    { id: "byCategory", label: "按栏目" },
    { id: "byEditor", label: "按编辑" },
    { id: "rejectReasons", label: "退回原因" },
    { id: "delays", label: "延期分析" },
  ];

  const maxCategoryTotal = Math.max(...stats.byCategory.map((c) => c.total), 1);
  const maxEditorTotal = Math.max(...stats.byEditor.map((e) => e.total), 1);
  const maxRejectCount = Math.max(...stats.rejectReasons.map((r) => r.count), 1);
  const maxDelayCount = Math.max(...stats.delayDistribution.map((d) => d.count), 1);

  return (
    <div className="review-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">复盘统计</h2>
          <p style={{ color: "#888" }}>选题审核与发布全流程数据复盘</p>
        </div>
      </div>

      <div className="stats-grid-4">
        <div className="stats-card">
          <div className="stats-number">{stats.overview.total}</div>
          <div className="stats-label">选题总数</div>
        </div>
        <div className="stats-card success">
          <div className="stats-number">{stats.overview.published}</div>
          <div className="stats-label">已发布</div>
        </div>
        <div className="stats-card warning">
          <div className="stats-number">{stats.overview.pending}</div>
          <div className="stats-label">处理中</div>
        </div>
        <div className="stats-card danger">
          <div className="stats-number">{stats.overview.rejected}</div>
          <div className="stats-label">已拒绝</div>
        </div>
      </div>

      <div className="stats-grid-2">
        <div className="stats-card">
          <div className="stats-number primary">{stats.overview.publishRate}</div>
          <div className="stats-label">整体发布率</div>
        </div>
        <div className="stats-card">
          <div className="stats-number accent">
            {stats.overview.delayed} <span style={{ fontSize: "1rem" }}>篇</span>
          </div>
          <div className="stats-label">延期选题（平均 {stats.overview.avgDelay} 次）</div>
        </div>
      </div>

      <div className="card">
        <div className="tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="tab-content">
          {activeTab === "overview" && (
            <div className="overview-tab">
              <h3 className="chart-title">全流程状态分布</h3>
              <div className="status-bars">
                {[
                  { label: "草稿", count: 1, color: "#90caf9" },
                  { label: "待审核", count: 2, color: "#ffb74d" },
                  { label: "审核通过", count: 1, color: "#a5d6a7" },
                  { label: "版权缺失", count: 1, color: "#f48fb1" },
                  { label: "标题修改", count: 1, color: "#ce93d8" },
                  { label: "已排期", count: 3, color: "#80cbc4" },
                  { label: "已发布", count: 2, color: "#66bb6a" },
                  { label: "已归档", count: 1, color: "#bdbdbd" },
                  { label: "已拒绝", count: 1, color: "#e57373" },
                ].map((s) => (
                  <div key={s.label} className="status-bar-item">
                    <span className="bar-label">{s.label}</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${(s.count / 12) * 100}%`, background: s.color }}
                      />
                    </div>
                    <span className="bar-count">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "byCategory" && (
            <div className="by-category-tab">
              <h3 className="chart-title">各栏目选题分布</h3>
              <div className="bar-chart-list">
                {stats.byCategory.map((cat) => (
                  <div key={cat.id} className="bar-chart-item">
                    <div className="bar-chart-label">
                      {cat.name} <span className="bar-chart-total">({cat.total})</span>
                    </div>
                    <div className="bar-chart-track">
                      <div
                        className="bar-chart-fill"
                        style={{ width: `${(cat.published / maxCategoryTotal) * 100}%` }}
                      >
                        {cat.published > 0 && <span>{cat.published}</span>}
                      </div>
                    </div>
                    <div className="bar-chart-stats">
                      <span className="stat-published">发布 {cat.published}</span>
                      <span className="stat-pending">处理中 {cat.pending}</span>
                      <span className="stat-rejected">拒绝 {cat.rejected}</span>
                      <span className="stat-rate">发布率 {cat.publishRate.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "byEditor" && (
            <div className="by-editor-tab">
              <h3 className="chart-title">编辑绩效对比</h3>
              <div className="editor-cards">
                {stats.byEditor.map((editor) => (
                  <div key={editor.id} className="editor-card">
                    <div className="editor-header">
                      <div className="editor-avatar">
                        {editor.name.charAt(0)}
                      </div>
                      <div className="editor-info">
                        <h4>{editor.name}</h4>
                        <p>共 {editor.total} 篇选题</p>
                      </div>
                    </div>
                    <div className="editor-stats">
                      <div className="editor-stat">
                        <div className="stat-value published">{editor.published}</div>
                        <div className="stat-label">已发布</div>
                      </div>
                      <div className="editor-stat">
                        <div className="stat-value rejected">{editor.rejected}</div>
                        <div className="stat-label">被拒绝</div>
                      </div>
                      <div className="editor-stat">
                        <div className="stat-value rate">{editor.publishRate.toFixed(1)}%</div>
                        <div className="stat-label">发布率</div>
                      </div>
                      <div className="editor-stat">
                        <div className="stat-value delayed">{editor.totalDelays}</div>
                        <div className="stat-label">延期次数</div>
                      </div>
                    </div>
                    <div className="editor-progress">
                      <div
                        className="progress-bar"
                        style={{ width: `${(editor.total / maxEditorTotal) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "rejectReasons" && (
            <div className="reject-reasons-tab">
              <h3 className="chart-title">退回/拒绝原因分布</h3>
              <div className="reasons-chart">
                {stats.rejectReasons.map((reason) => (
                  <div key={reason.reason} className="reason-item">
                    <span className="reason-label">{reason.reason}</span>
                    <div className="reason-bar">
                      <div
                        className="reason-fill"
                        style={{ width: `${(reason.count / maxRejectCount) * 100}%` }}
                      />
                    </div>
                    <span className="reason-count">{reason.count} 篇</span>
                  </div>
                ))}
              </div>
              <div className="reasons-summary">
                <p style={{ color: "#666", marginTop: "16px" }}>
                  💡 <strong>优化建议：</strong>
                </p>
                <ul style={{ color: "#666", marginLeft: "20px", marginTop: "8px", lineHeight: "1.8" }}>
                  <li>版权材料缺失问题较突出，建议在提交环节加强版权审查</li>
                  <li>标题质量有待提升，可提供标题写作指南或模板</li>
                  <li>加强选题前期沟通，减少因定位不符导致的拒绝</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === "delays" && (
            <div className="delays-tab">
              <h3 className="chart-title">延期次数分布</h3>
              <div className="delay-chart">
                {stats.delayDistribution.map((d) => (
                  <div key={d.range} className="delay-item">
                    <span className="delay-label">{d.range}</span>
                    <div className="delay-bar">
                      <div
                        className="delay-fill"
                        style={{ width: `${(d.count / maxDelayCount) * 100}%` }}
                      />
                    </div>
                    <span className="delay-count">{d.count} 篇</span>
                  </div>
                ))}
              </div>

              <h3 className="chart-title" style={{ marginTop: "32px" }}>延期原因分析</h3>
              <div className="delay-analysis">
                <div className="analysis-item">
                  <div className="analysis-icon">⏳</div>
                  <div>
                    <h4>排期冲突</h4>
                    <p>同栏目选题扎堆发布，导致部分选题被迫延期</p>
                  </div>
                </div>
                <div className="analysis-item">
                  <div className="analysis-icon">📝</div>
                  <div>
                    <h4>内容修改</h4>
                    <p>审核退回修改，需要额外时间完善内容</p>
                  </div>
                </div>
                <div className="analysis-item">
                  <div className="analysis-icon">⚖️</div>
                  <div>
                    <h4>版权确认</h4>
                    <p>版权材料补充和确认耗时较长</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{pageStyles}</style>
    </div>
  );
}

const pageStyles = `
  .review-page { margin-bottom: 20px; }
  .page-header { margin-bottom: 20px; }
  .page-title {
    font-size: 1.4rem;
    font-weight: 600;
    color: #1a1a2e;
    margin-bottom: 4px;
  }
  .stats-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    text-align: center;
    border-top: 3px solid #1976d2;
  }
  .stats-card.success { border-top-color: #2e7d32; }
  .stats-card.warning { border-top-color: #ed6c02; }
  .stats-card.danger { border-top-color: #d32f2f; }
  .stats-number {
    font-size: 2rem;
    font-weight: 700;
    color: #1976d2;
    margin-bottom: 4px;
  }
  .stats-number.primary { color: #1976d2; }
  .stats-number.accent { color: #ff9800; }
  .stats-label {
    font-size: 0.9rem;
    color: #666;
  }
  .stats-grid-4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 16px;
  }
  .stats-grid-2 {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 20px;
  }
  @media (max-width: 768px) {
    .stats-grid-4 { grid-template-columns: repeat(2, 1fr); }
    .stats-grid-2 { grid-template-columns: 1fr; }
  }
  .tabs {
    display: flex;
    border-bottom: 2px solid #f0f2f5;
    margin-bottom: 20px;
    overflow-x: auto;
  }
  .tab-btn {
    padding: 12px 24px;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.95rem;
    color: #666;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    transition: all 0.2s;
    white-space: nowrap;
  }
  .tab-btn:hover { color: #1976d2; }
  .tab-btn.active {
    color: #1976d2;
    border-bottom-color: #1976d2;
    font-weight: 500;
  }
  .tab-content { min-height: 300px; }
  .chart-title {
    font-size: 1.05rem;
    font-weight: 600;
    margin-bottom: 16px;
    color: #333;
  }
  .status-bars {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .status-bar-item {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .bar-label {
    width: 80px;
    font-size: 0.9rem;
    color: #555;
    text-align: right;
    flex-shrink: 0;
  }
  .bar-track {
    flex: 1;
    height: 24px;
    background: #f5f5f5;
    border-radius: 4px;
    overflow: hidden;
  }
  .bar-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s ease;
  }
  .bar-count {
    width: 40px;
    font-size: 0.9rem;
    color: #333;
    font-weight: 500;
    flex-shrink: 0;
  }
  .bar-chart-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .bar-chart-item {
    padding-bottom: 16px;
    border-bottom: 1px solid #f0f2f5;
  }
  .bar-chart-item:last-child { border-bottom: none; }
  .bar-chart-label {
    font-weight: 500;
    margin-bottom: 8px;
    color: #333;
  }
  .bar-chart-total {
    color: #888;
    font-weight: normal;
    font-size: 0.9rem;
  }
  .bar-chart-track {
    height: 28px;
    background: #f5f5f5;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 8px;
  }
  .bar-chart-fill {
    height: 100%;
    background: linear-gradient(90deg, #66bb6a, #43a047);
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 8px;
    color: white;
    font-size: 0.85rem;
    font-weight: 500;
    transition: width 0.3s ease;
  }
  .bar-chart-stats {
    display: flex;
    gap: 16px;
    font-size: 0.85rem;
    flex-wrap: wrap;
  }
  .stat-published { color: #2e7d32; }
  .stat-pending { color: #ed6c02; }
  .stat-rejected { color: #d32f2f; }
  .stat-rate { color: #1976d2; }
  .editor-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
  }
  .editor-card {
    background: #fafafa;
    border-radius: 12px;
    padding: 20px;
  }
  .editor-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }
  .editor-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1976d2, #1565c0);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    font-weight: 600;
  }
  .editor-info h4 {
    font-size: 1.05rem;
    font-weight: 600;
    color: #333;
  }
  .editor-info p {
    font-size: 0.85rem;
    color: #888;
  }
  .editor-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-bottom: 12px;
  }
  .editor-stat {
    text-align: center;
  }
  .stat-value {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 2px;
  }
  .stat-value.published { color: #2e7d32; }
  .stat-value.rejected { color: #d32f2f; }
  .stat-value.rate { color: #1976d2; }
  .stat-value.delayed { color: #ed6c02; }
  .stat-label {
    font-size: 0.75rem;
    color: #888;
  }
  .editor-progress {
    height: 6px;
    background: #e0e0e0;
    border-radius: 3px;
    overflow: hidden;
  }
  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #1976d2, #42a5f5);
    border-radius: 3px;
    transition: width 0.3s ease;
  }
  .reasons-chart {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .reason-item {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .reason-label {
    width: 140px;
    font-size: 0.9rem;
    color: #555;
    flex-shrink: 0;
  }
  .reason-bar {
    flex: 1;
    height: 28px;
    background: #f5f5f5;
    border-radius: 4px;
    overflow: hidden;
  }
  .reason-fill {
    height: 100%;
    background: linear-gradient(90deg, #ef5350, #e53935);
    border-radius: 4px;
    transition: width 0.3s ease;
  }
  .reason-count {
    width: 60px;
    font-size: 0.9rem;
    color: #333;
    font-weight: 500;
    flex-shrink: 0;
  }
  .delay-chart {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .delay-item {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .delay-label {
    width: 80px;
    font-size: 0.9rem;
    color: #555;
    flex-shrink: 0;
  }
  .delay-bar {
    flex: 1;
    height: 28px;
    background: #f5f5f5;
    border-radius: 4px;
    overflow: hidden;
  }
  .delay-fill {
    height: 100%;
    background: linear-gradient(90deg, #ff9800, #f57c00);
    border-radius: 4px;
    transition: width 0.3s ease;
  }
  .delay-count {
    width: 60px;
    font-size: 0.9rem;
    color: #333;
    font-weight: 500;
    flex-shrink: 0;
  }
  .delay-analysis {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
  }
  .analysis-item {
    display: flex;
    gap: 12px;
    padding: 16px;
    background: #fafafa;
    border-radius: 8px;
  }
  .analysis-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }
  .analysis-item h4 {
    font-size: 0.95rem;
    font-weight: 600;
    color: #333;
    margin-bottom: 4px;
  }
  .analysis-item p {
    font-size: 0.85rem;
    color: #666;
    line-height: 1.5;
  }
`;
