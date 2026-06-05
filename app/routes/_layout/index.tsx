import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { statusLabels, getStatusBadgeClass, formatDateShort } from "~/utils/format";
import { TopicStatus } from "@prisma/client";

export const Route = createFileRoute("/_layout/")({
  component: TopicsPage,
});

interface Topic {
  id: string;
  title: string;
  summary: string;
  status: TopicStatus;
  priority: number;
  createdAt: string;
  scheduledAt: string | null;
  category?: { id: string; name: string } | null;
  submitter?: { id: string; name: string; role: string };
  schedules?: any[];
}

const statusFilters = [
  { value: "", label: "全部" },
  { value: "DRAFT", label: "草稿" },
  { value: "PENDING_REVIEW", label: "待审核" },
  { value: "APPROVED", label: "审核通过" },
  { value: "COPYRIGHT_MISSING", label: "版权缺失" },
  { value: "TITLE_REVISION", label: "标题待修改" },
  { value: "SCHEDULED", label: "已排期" },
  { value: "PUBLISHED", label: "已发布" },
  { value: "ARCHIVED", label: "已归档" },
  { value: "REJECTED", label: "已拒绝" },
];

function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadTopics();
  }, [statusFilter, searchQuery]);

  const loadTopics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (searchQuery) params.set("search", searchQuery);
      params.set("limit", "50");

      const res = await fetch(`/api/topics?${params.toString()}`);
      const data = await res.json();
      setTopics(data.data || []);
    } catch (error) {
      console.error("加载选题失败:", error);
      setTopics(getMockTopics());
    }
    setLoading(false);
  };

  const getMockTopics = (): Topic[] => {
    const mockCategories = [
      { id: "cat1", name: "科技" },
      { id: "cat2", name: "财经" },
      { id: "cat3", name: "文化" },
      { id: "cat4", name: "体育" },
    ];

    return [
      {
        id: "t1",
        title: "人工智能大模型技术突破：新一代多模态模型发布",
        summary: "某科技公司发布新一代多模态大模型，在多项基准测试中刷新记录。",
        status: TopicStatus.PUBLISHED,
        priority: 1,
        createdAt: "2026-06-01T10:00:00",
        scheduledAt: "2026-06-03T09:00:00",
        category: mockCategories[0],
        submitter: { id: "u1", name: "张编辑", role: "EDITOR" },
      },
      {
        id: "t2",
        title: "全球股市震荡，投资者避险情绪升温",
        summary: "受多重因素影响，全球股市出现震荡。",
        status: TopicStatus.APPROVED,
        priority: 2,
        createdAt: "2026-06-02T14:00:00",
        scheduledAt: null,
        category: mockCategories[1],
        submitter: { id: "u2", name: "李编辑", role: "EDITOR" },
      },
      {
        id: "t3",
        title: "知名导演新作上映首日票房破亿",
        summary: "知名导演最新力作上映首日票房突破亿元大关。",
        status: TopicStatus.COPYRIGHT_MISSING,
        priority: 3,
        createdAt: "2026-06-02T16:00:00",
        scheduledAt: null,
        category: mockCategories[2],
        submitter: { id: "u1", name: "张编辑", role: "EDITOR" },
      },
      {
        id: "t4",
        title: "欧冠决赛前瞻：两支豪门球队对决",
        summary: "欧冠决赛即将打响，两支豪门球队将展开对决。",
        status: TopicStatus.TITLE_REVISION,
        priority: 2,
        createdAt: "2026-06-03T09:00:00",
        scheduledAt: null,
        category: mockCategories[3],
        submitter: { id: "u2", name: "李编辑", role: "EDITOR" },
      },
      {
        id: "t5",
        title: "新能源汽车销量持续增长，市场竞争加剧",
        summary: "新能源汽车市场持续火热，销量持续增长。",
        status: TopicStatus.SCHEDULED,
        priority: 1,
        createdAt: "2026-06-01T11:00:00",
        scheduledAt: "2026-06-08T10:00:00",
        category: mockCategories[0],
        submitter: { id: "u1", name: "张编辑", role: "EDITOR" },
      },
      {
        id: "t6",
        title: "智能手机市场报告发布，国产品牌表现亮眼",
        summary: "最新智能手机市场报告发布，国产品牌市场份额持续提升。",
        status: TopicStatus.SCHEDULED,
        priority: 2,
        createdAt: "2026-06-01T15:00:00",
        scheduledAt: "2026-06-08T10:00:00",
        category: mockCategories[0],
        submitter: { id: "u2", name: "李编辑", role: "EDITOR" },
      },
      {
        id: "t7",
        title: "楼市调控政策解读",
        summary: "最新楼市调控政策出台，对市场产生深远影响。",
        status: TopicStatus.PENDING_REVIEW,
        priority: 1,
        createdAt: "2026-06-04T10:00:00",
        scheduledAt: null,
        category: mockCategories[1],
        submitter: { id: "u1", name: "张编辑", role: "EDITOR" },
      },
      {
        id: "t8",
        title: "马拉松赛事热情高涨，跑者故事",
        summary: "城市马拉松赛事热情高涨，跑者们的故事让人感动。",
        status: TopicStatus.ARCHIVED,
        priority: 2,
        createdAt: "2026-05-20T10:00:00",
        scheduledAt: "2026-05-28T08:00:00",
        category: mockCategories[3],
        submitter: { id: "u2", name: "李编辑", role: "EDITOR" },
      },
      {
        id: "t9",
        title: "年度经济数据发布",
        summary: "国家统计局发布最新经济数据。",
        status: TopicStatus.PUBLISHED,
        priority: 1,
        createdAt: "2026-05-25T10:00:00",
        scheduledAt: "2026-06-02T09:00:00",
        category: mockCategories[1],
        submitter: { id: "u1", name: "张编辑", role: "EDITOR" },
      },
      {
        id: "t10",
        title: "电竞赛事报道",
        summary: "顶级电竞赛事火热进行中。",
        status: TopicStatus.REJECTED,
        priority: 3,
        createdAt: "2026-05-30T10:00:00",
        scheduledAt: null,
        category: mockCategories[3],
        submitter: { id: "u2", name: "李编辑", role: "EDITOR" },
      },
    ];
  };

  return (
    <div className="topics-page">
      <div className="page-header">
        <h2 className="page-title">选题列表</h2>
        <div className="page-actions">
          <Link to="/topics/new" className="btn btn-primary">
            + 提交选题
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="filter-group">
            <span className="filter-label">状态筛选：</span>
            <div className="status-filters">
              {statusFilters.map((f) => (
                <button
                  key={f.value}
                  className={`filter-btn ${statusFilter === f.value ? "active" : ""}`}
                  onClick={() => setStatusFilter(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="search-box">
            <input
              type="text"
              placeholder="搜索选题标题..."
              className="form-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : topics.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <p>暂无选题数据</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>标题</th>
                <th>栏目</th>
                <th>提交人</th>
                <th>状态</th>
                <th>优先级</th>
                <th>排期时间</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {topics.map((topic) => (
                <tr key={topic.id}>
                  <td style={{ maxWidth: "300px" }}>
                    <Link to={`/topics/$topicId`} params={{ topicId: topic.id }} className="topic-title-link">
                      <strong>{topic.title}</strong>
                      <p className="topic-summary">{topic.summary?.slice(0, 60)}...</p>
                    </Link>
                  </td>
                  <td>{topic.category?.name || "-"}</td>
                  <td>{topic.submitter?.name || "-"}</td>
                  <td>
                    <span className={getStatusBadgeClass(topic.status)}>
                      {statusLabels[topic.status]}
                    </span>
                  </td>
                  <td>
                    {"⭐".repeat(topic.priority)}
                  </td>
                  <td>{formatDateShort(topic.scheduledAt)}</td>
                  <td>{formatDateShort(topic.createdAt)}</td>
                  <td>
                    <Link
                      to={`/topics/$topicId`}
                      params={{ topicId: topic.id }}
                      className="btn btn-sm btn-default"
                    >
                      详情
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{pageStyles}</style>
    </div>
  );
}

const pageStyles = `
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
  .page-actions {
    display: flex;
    gap: 12px;
  }
  .filter-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: flex-start;
  }
  .filter-group {
    flex: 1;
    min-width: 0;
  }
  .filter-label {
    font-weight: 500;
    margin-bottom: 8px;
    display: block;
    color: #555;
    font-size: 0.9rem;
  }
  .status-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .filter-btn {
    padding: 6px 14px;
    border: 1px solid #ddd;
    border-radius: 20px;
    background: white;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s;
    color: #555;
  }
  .filter-btn:hover {
    border-color: #1976d2;
    color: #1976d2;
  }
  .filter-btn.active {
    background: #1976d2;
    color: white;
    border-color: #1976d2;
  }
  .search-box {
    width: 280px;
  }
  .loading {
    text-align: center;
    padding: 40px;
    color: #888;
  }
  .topic-title-link {
    display: block;
    color: inherit;
    text-decoration: none;
  }
  .topic-title-link:hover strong {
    color: #1976d2;
  }
  .topic-summary {
    font-size: 0.85rem;
    color: #888;
    margin-top: 4px;
    line-height: 1.4;
  }
  @media (max-width: 768px) {
    .filter-bar { flex-direction: column; }
    .search-box { width: 100%; }
  }
`;

export default TopicsPage;
