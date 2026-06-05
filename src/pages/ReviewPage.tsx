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
  byCategory: Array<{
    id: string;
    name: string;
    total: number;
    published: number;
    rejected: number;
    pending: number;
    publishRate: number;
  }>;
  byEditor: Array<{
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
  }>;
  rejectReasons: Array<{
    reason: string;
    count: number;
  }>;
  delayDistribution: Array<{
    range: string;
    count: number;
  }>;
}

type TabKey = "overview" | "category" | "editor" | "reasons" | "delays";

export default function ReviewPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await fetch("/api/stats/review");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        setStats(getMockStats());
      }
    } catch (error) {
      setStats(getMockStats());
    }
    setLoading(false);
  };

  const getMockStats = (): StatsData => ({
    overview: {
      total: 12,
      published: 3,
      pending: 3,
      rejected: 1,
      delayed: 2,
      avgDelay: 1.5,
      publishRate: "25.0%",
    },
    byCategory: [
      { id: "cat1", name: "科技", total: 4, published: 1, rejected: 0, pending: 3, publishRate: 25 },
      { id: "cat2", name: "财经", total: 3, published: 1, rejected: 0, pending: 2, publishRate: 33.3 },
      { id: "cat3", name: "文化", total: 2, published: 0, rejected: 0, pending: 2, publishRate: 0 },
      { id: "cat4", name: "体育", total: 3, published: 1, rejected: 1, pending: 1, publishRate: 33.3 },
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
        totalDelays: 1,
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
        totalDelays: 2,
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

  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview", label: "总览" },
    { key: "category", label: "按栏目" },
    { key: "editor", label: "按编辑" },
    { key: "reasons", label: "退回原因" },
    { key: "delays", label: "延期分析" },
  ];

  if (loading || !stats) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="review-page">
      <div className="page-header">
        <h2 className="page-title">复盘统计</h2>
        <p className="page-subtitle">多维度分析选题运营数据</p>
      </div>

      <div className="card">
        <div className="stats-overview">
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
            <div className="stats-label">进行中</div>
          </div>
          <div className="stats-card danger">
            <div className="stats-number">{stats.overview.rejected}</div>
            <div className="stats-label">已拒绝</div>
          </div>
          <div className="stats-card info">
            <div className="stats-number">{stats.overview.publishRate}</div>
            <div className="stats-label">发布率</div>
          </div>
          <div className="stats-card warning">
            <div className="stats-number">{stats.overview.delayed}</div>
            <div className="stats-label">延期选题</div>
          </div>
        </div>
      </div>

      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === "overview" && (
          <div className="grid grid-2">
            <div className="card">
              <h3 className="card-title">栏目分布</h3>
              <div className="bar-chart">
                {stats.byCategory.map((cat) => (
                  <div key={cat.id} className="bar-item">
                    <div className="bar-label">{cat.name}</div>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${(cat.total / Math.max(...stats.byCategory.map(c => c.total))) * 100}%` }}
                      >
                        <span className="bar-value">{cat.total}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="card-title">延期分布</h3>
              <div className="donut-chart-wrapper">
                <div className="donut-chart">
                  {stats.delayDistribution.map((item, i) => (
                    <div
                      key={item.range}
                      className="donut-segment"
                      style={{
                        background: getDelayColor(i),
                        transform: getDonutTransform(
                          i,
                          stats.delayDistribution.map((d) => d.count)
                        ),
                      }}
                    />
                  ))}
                  <div className="donut-hole">
                    <div className="donut-center">
                      <div className="donut-total">{stats.overview.total}</div>
                      <div className="donut-label">总选题</div>
                    </div>
                  </div>
                </div>
                <div className="donut-legend">
                  {stats.delayDistribution.map((item, i) => (
                    <div key={item.range} className="legend-item">
                      <span
                        className="legend-color"
                        style={{ background: getDelayColor(i) }}
                      />
                      <span className="legend-text">
                        {item.range}: {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "category" && (
          <div className="card">
            <h3 className="card-title">按栏目统计</h3>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>栏目</th>
                    <th>选题数</th>
                    <th>已发布</th>
                    <th>进行中</th>
                    <th>已拒绝</th>
                    <th>发布率</th>
                    <th>表现</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.byCategory.map((cat) => (
                    <tr key={cat.id}>
                      <td>
                        <strong>{cat.name}</strong>
                      </td>
                      <td>{cat.total}</td>
                      <td style={{ color: "#2e7d32" }}>{cat.published}</td>
                      <td style={{ color: "#ed6c02" }}>{cat.pending}</td>
                      <td style={{ color: "#d32f2f" }}>{cat.rejected}</td>
                      <td>{cat.publishRate.toFixed(1)}%</td>
                      <td>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${cat.publishRate}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "editor" && (
          <div className="card">
            <h3 className="card-title">编辑绩效对比</h3>
            <div className="editor-cards">
              {stats.byEditor.map((editor) => (
                <div key={editor.id} className="editor-card">
                  <div className="editor-header">
                    <div className="editor-avatar">
                      {editor.name.charAt(0)}
                    </div>
                    <div className="editor-info">
                      <div className="editor-name">{editor.name}</div>
                      <div className="editor-role">编辑</div>
                    </div>
                  </div>
                  <div className="editor-stats">
                    <div className="editor-stat">
                      <span className="stat-value">{editor.total}</span>
                      <span className="stat-label">总选题</span>
                    </div>
                    <div className="editor-stat">
                      <span className="stat-value success">{editor.published}</span>
                      <span className="stat-label">已发布</span>
                    </div>
                    <div className="editor-stat">
                      <span className="stat-value danger">{editor.rejected}</span>
                      <span className="stat-label">被拒绝</span>
                    </div>
                  </div>
                  <div className="editor-progress">
                    <div className="progress-label">
                      发布率 {editor.publishRate.toFixed(1)}%
                    </div>
                    <div className="progress-bar large">
                      <div
                        className="progress-fill"
                        style={{ width: `${editor.publishRate}%` }}
                      />
                    </div>
                  </div>
                  <div className="editor-delays">
                    <span>延期选题：{editor.delayedTopics} 个</span>
                    <span>延期次数：{editor.totalDelays} 次</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "reasons" && (
          <div className="card">
            <h3 className="card-title">退回原因分析</h3>
            <div className="reasons-list">
              {stats.rejectReasons.map((item, index) => (
                <div key={item.reason} className="reason-item">
                  <div className="reason-rank">#{index + 1}</div>
                  <div className="reason-info">
                    <div className="reason-name">{item.reason}</div>
                    <div className="reason-bar-wrapper">
                      <div className="reason-bar">
                        <div
                          className="reason-bar-fill"
                          style={{
                            width: `${(item.count / Math.max(...stats.rejectReasons.map(r => r.count), 1)) * 100}%`,
                            background: getReasonColor(index),
                          }}
                        />
                      </div>
                      <span className="reason-count">{item.count} 次</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "delays" && (
          <div className="card">
            <h3 className="card-title">延期次数分布</h3>
            <div className="delay-stats">
              <div className="delay-summary">
                <div className="summary-number">{stats.overview.delayed}</div>
                <div className="summary-label">延期选题数</div>
              </div>
              <div className="delay-summary">
                <div className="summary-number">{stats.overview.avgDelay}</div>
                <div className="summary-label">平均延期次数</div>
              </div>
            </div>

            <div className="delay-distribution">
              {stats.delayDistribution.map((item, i) => (
                <div key={item.range} className="delay-item">
                  <div className="delay-range">{item.range}</div>
                  <div className="delay-bar-wrapper">
                    <div
                      className="delay-bar"
                      style={{
                        height: `${(item.count / Math.max(...stats.delayDistribution.map(d => d.count), 1)) * 100}%`,
                        background: getDelayColor(i),
                      }}
                    />
                  </div>
                  <div className="delay-count">{item.count}</div>
                </div>
              ))}
            </div>

            <div className="delay-suggestions">
              <h4>改进建议</h4>
              <ul>
                <li>对延期超过2次的选题进行重点跟进</li>
                <li>分析延期原因，优化审核流程</li>
                <li>提前规划排期，避免临时变动</li>
                <li>加强编辑与排期人员的沟通协作</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <style>{pageStyles}</style>
    </div>
  );
}

function getDelayColor(index: number): string {
  const colors = ["#4caf50", "#ff9800", "#f44336", "#9c27b0"];
  return colors[index % colors.length];
}

function getReasonColor(index: number): string {
  const colors = ["#f44336", "#ff9800", "#9c27b0", "#2196f3"];
  return colors[index % colors.length];
}

function getDonutTransform(index: number, values: number[]): string {
  const total = values.reduce((a, b) => a + b, 0);
  if (total === 0) return "rotate(0deg)";
  const startAngle = values.slice(0, index).reduce((a, b) => a + b, 0) / total * 360;
  const angle = values[index] / total * 360;
  return `rotate(${startAngle}deg) skewY(${angle - 90}deg)`;
}

const pageStyles = `
  .review-page { margin-bottom: 20px; }
  .page-header {
    margin-bottom: 20px;
  }
  .page-title {
    font-size: 1.4rem;
    font-weight: 600;
    color: #1a1a2e;
  }
  .page-subtitle {
    color: #888;
    margin-top: 4px;
    font-size: 0.95rem;
  }
  .stats-overview {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 16px;
  }
  .stats-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    border-top: 3px solid #1976d2;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
  .stats-card.success { border-top-color: #2e7d32; }
  .stats-card.success .stats-number { color: #2e7d32; }
  .stats-card.warning { border-top-color: #ed6c02; }
  .stats-card.warning .stats-number { color: #ed6c02; }
  .stats-card.danger { border-top-color: #d32f2f; }
  .stats-card.danger .stats-number { color: #d32f2f; }
  .stats-card.info { border-top-color: #0277bd; }
  .stats-card.info .stats-number { color: #0277bd; font-size: 1.6rem; }
  .stats-number {
    font-size: 2rem;
    font-weight: 700;
    color: #1976d2;
    margin-bottom: 4px;
  }
  .stats-label {
    font-size: 0.85rem;
    color: #666;
  }
  .bar-chart {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .bar-item {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .bar-label {
    width: 80px;
    font-size: 0.9rem;
    color: #555;
    text-align: right;
  }
  .bar-track {
    flex: 1;
    height: 32px;
    background: #f5f5f5;
    border-radius: 6px;
    overflow: hidden;
    position: relative;
  }
  .bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #1976d2, #4fc3f7);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 8px;
    transition: width 0.5s ease;
    min-width: 30px;
  }
  .bar-value {
    color: white;
    font-weight: 600;
    font-size: 0.85rem;
  }
  .donut-chart-wrapper {
    display: flex;
    align-items: center;
    gap: 32px;
  }
  .donut-chart {
    width: 160px;
    height: 160px;
    border-radius: 50%;
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
  }
  .donut-segment {
    position: absolute;
    width: 50%;
    height: 50%;
    top: 0;
    right: 0;
    transform-origin: bottom left;
  }
  .donut-hole {
    position: absolute;
    top: 20%;
    left: 20%;
    width: 60%;
    height: 60%;
    background: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .donut-center {
    text-align: center;
  }
  .donut-total {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1976d2;
  }
  .donut-label {
    font-size: 0.8rem;
    color: #888;
  }
  .donut-legend {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .legend-color {
    width: 12px;
    height: 12px;
    border-radius: 3px;
  }
  .legend-text {
    font-size: 0.85rem;
    color: #555;
  }
  .progress-bar {
    height: 8px;
    background: #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
    width: 120px;
  }
  .progress-bar.large {
    height: 12px;
    width: 100%;
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #2e7d32, #66bb6a);
    border-radius: 4px;
    transition: width 0.5s ease;
  }
  .table-wrapper {
    overflow-x: auto;
  }
  .editor-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
  }
  .editor-card {
    background: #fafafa;
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #eee;
  }
  .editor-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
  }
  .editor-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1976d2, #4fc3f7);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    font-weight: 600;
  }
  .editor-name {
    font-weight: 600;
    font-size: 1.05rem;
  }
  .editor-role {
    font-size: 0.85rem;
    color: #888;
  }
  .editor-stats {
    display: flex;
    justify-content: space-around;
    margin-bottom: 16px;
    padding: 16px 0;
    border-top: 1px solid #eee;
    border-bottom: 1px solid #eee;
  }
  .editor-stat {
    text-align: center;
  }
  .stat-value {
    font-size: 1.3rem;
    font-weight: 700;
    color: #333;
    display: block;
  }
  .stat-value.success { color: #2e7d32; }
  .stat-value.danger { color: #d32f2f; }
  .stat-label {
    font-size: 0.8rem;
    color: #888;
  }
  .editor-progress {
    margin-bottom: 12px;
  }
  .progress-label {
    font-size: 0.85rem;
    color: #555;
    margin-bottom: 6px;
  }
  .editor-delays {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    color: #888;
  }
  .reasons-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .reason-item {
    display: flex;
    gap: 16px;
    align-items: flex-start;
  }
  .reason-rank {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #f5f5f5;
    color: #666;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    flex-shrink: 0;
  }
  .reason-info {
    flex: 1;
  }
  .reason-name {
    font-weight: 500;
    margin-bottom: 8px;
    color: #333;
  }
  .reason-bar-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .reason-bar {
    flex: 1;
    height: 24px;
    background: #f5f5f5;
    border-radius: 6px;
    overflow: hidden;
  }
  .reason-bar-fill {
    height: 100%;
    border-radius: 6px;
    transition: width 0.5s ease;
  }
  .reason-count {
    font-size: 0.9rem;
    color: #666;
    min-width: 60px;
    text-align: right;
  }
  .delay-stats {
    display: flex;
    gap: 24px;
    margin-bottom: 32px;
  }
  .delay-summary {
    flex: 1;
    text-align: center;
    padding: 24px;
    background: #f5f5f5;
    border-radius: 8px;
  }
  .summary-number {
    font-size: 2.5rem;
    font-weight: 700;
    color: #1976d2;
  }
  .summary-label {
    color: #666;
    margin-top: 4px;
  }
  .delay-distribution {
    display: flex;
    justify-content: space-around;
    align-items: flex-end;
    height: 200px;
    padding: 0 20px;
    margin-bottom: 32px;
    border-bottom: 2px solid #e0e0e0;
  }
  .delay-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 60px;
  }
  .delay-bar-wrapper {
    flex: 1;
    width: 100%;
    display: flex;
    align-items: flex-end;
    margin: 8px 0;
  }
  .delay-bar {
    width: 100%;
    border-radius: 6px 6px 0 0;
    transition: height 0.5s ease;
    min-height: 4px;
  }
  .delay-range {
    font-size: 0.85rem;
    color: #555;
  }
  .delay-count {
    font-weight: 600;
    color: #333;
    font-size: 1.1rem;
  }
  .delay-suggestions {
    background: #e3f2fd;
    padding: 20px;
    border-radius: 8px;
  }
  .delay-suggestions h4 {
    color: #1565c0;
    margin-bottom: 12px;
  }
  .delay-suggestions ul {
    margin-left: 20px;
    color: #1976d2;
  }
  .delay-suggestions li {
    margin-bottom: 6px;
  }
  @media (max-width: 768px) {
    .stats-overview { grid-template-columns: repeat(2, 1fr); }
    .donut-chart-wrapper { flex-direction: column; }
    .delay-stats { flex-direction: column; }
  }
`;
