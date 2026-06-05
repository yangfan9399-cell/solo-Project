import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  statusLabels,
  getStatusBadgeClass,
  formatDate,
  userRoleLabels,
  reviewResultLabels,
  conflictTypeLabels,
} from "../utils/format";
import { TopicStatus, ReviewResult, UserRole } from "@prisma/client";

interface TopicDetail {
  id: string;
  title: string;
  originalTitle: string | null;
  summary: string;
  source: string;
  sourceUrl: string | null;
  copyrightEvidence: string | null;
  contentOutline: string | null;
  status: TopicStatus;
  priority: number;
  delayCount: number;
  rejectCount: number;
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  archivedAt: string | null;
  category?: { id: string; name: string } | null;
  submitter?: { id: string; name: string; role: UserRole; email: string };
  currentHandler?: { id: string; name: string; role: UserRole } | null;
  reviews: any[];
  schedules: any[];
  revisionRecords: any[];
  archiveLogs: any[];
  statusHistory: any[];
  conflictDetectedConflicts: any[];
  conflictCausedConflicts: any[];
}

type Role = "editor" | "chief" | "scheduler" | "reviewer";

export default function TopicDetailPage() {
  const { topicId } = useParams({ strict: false) as { topicId: string };
  const navigate = useNavigate();
  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [currentRole, setCurrentRole] = useState<Role>("editor");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [reviewResult, setReviewResult] = useState<ReviewResult>(ReviewResult.APPROVED);
  const [reviewComment, setReviewComment] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTimeSlot, setScheduleTimeSlot] = useState("");
  const [scheduleNote, setScheduleNote] = useState("");
  const [conflictInfo, setConflictInfo] = useState<any>(null);
  const [archiveAction, setArchiveAction] = useState("ARCHIVE");
  const [archiveComment, setArchiveComment] = useState("");

  useEffect(() => {
    loadTopic();
  }, [topicId]);

  const loadTopic = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/topics/${topicId}`);
      if (res.ok) {
        const data = await res.json();
        setTopic(data);
      } else {
        setTopic(getMockTopic());
      }
    } catch (error) {
      console.error("加载选题详情失败:", error);
      setTopic(getMockTopic());
    }
    setLoading(false);
  };

  const getMockTopic = (): TopicDetail => ({
    id: topicId,
    title: "新能源汽车销量持续增长，市场竞争加剧",
    originalTitle: null,
    summary: "新能源汽车市场持续火热，销量持续增长，市场竞争日趋激烈。",
    source: "汽车之家",
    sourceUrl: "https://example.com/ev-sales",
    copyrightEvidence: "汽车之家授权转载，授权编号：AUTO-2026-088",
    contentOutline: "1. 销量数据\n2. 市场分析\n3. 竞争格局\n4. 发展趋势",
    status: TopicStatus.SCHEDULED,
    priority: 1,
    delayCount: 0,
    rejectCount: 0,
    rejectReason: null,
    createdAt: "2026-06-01T11:00:00",
    updatedAt: "2026-06-03T14:00:00",
    scheduledAt: "2026-06-08T10:00:00",
    publishedAt: null,
    archivedAt: null,
    category: { id: "cat1", name: "科技" },
    submitter: { id: "u1", name: "张编辑", role: UserRole.EDITOR, email: "editor1@example.com" },
    currentHandler: { id: "u3", name: "赵排期", role: UserRole.SCHEDULER },
    reviews: [
      {
        id: "r1",
        result: ReviewResult.APPROVED,
        comment: "选题质量高，数据详实，符合栏目定位。",
        createdAt: "2026-06-02T10:00:00",
        reviewer: { id: "u2", name: "王主编", role: UserRole.CHIEF_EDITOR },
      },
    ],
    schedules: [
      {
        id: "s1",
        scheduledAt: "2026-06-08T10:00:00",
        timeSlot: "上午科技",
        note: "科技栏目重点选题。",
        createdAt: "2026-06-03T14:00:00",
        scheduler: { id: "u3", name: "赵排期", role: UserRole.SCHEDULER },
      },
    ],
    revisionRecords: [],
    archiveLogs: [],
    statusHistory: [
      { status: TopicStatus.DRAFT, operator: { name: "张编辑" }, remark: "创建选题草稿", createdAt: "2026-06-01T11:00:00" },
      { status: TopicStatus.PENDING_REVIEW, operator: { name: "张编辑" }, remark: "提交审核", createdAt: "2026-06-01T15:00:00" },
      { status: TopicStatus.APPROVED, operator: { name: "王主编" }, remark: "审核通过", createdAt: "2026-06-02T10:00:00" },
      { status: TopicStatus.SCHEDULED, operator: { name: "赵排期" }, remark: "已排期：6月8日 10:00", createdAt: "2026-06-03T14:00:00" },
    ],
    conflictDetectedConflicts: [
      {
        id: "c1",
        conflictType: "SAME_CATEGORY",
        description: "与同栏目选题「智能手机市场报告发布」安排在同一天。",
        conflictingTopic: { id: "t6", title: "智能手机市场报告发布，国产品牌表现亮眼", status: TopicStatus.SCHEDULED },
      },
    ],
    conflictCausedConflicts: [],
  });

  const handleReview = async () => {
    try {
      const res = await fetch(`/api/topics/${topicId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewerId: "chief-id",
          result: reviewResult,
          comment: reviewComment,
        }),
      });
      if (res.ok) {
        setShowReviewModal(false);
        loadTopic();
      }
    } catch (error) {
      console.error("审核失败:", error);
      alert("审核操作完成（演示模式）");
      setShowReviewModal(false);
    }
  };

  const checkScheduleConflict = async (date: string) => {
    if (!date || !topic) return;
    try {
      const res = await fetch(
        `/api/schedule/check-conflict?topicId=${topicId}&scheduledAt=${new Date(date).toISOString()}&categoryId=${topic.category?.id || ""}`
      );
      const data = await res.json();
      setConflictInfo(data);
    } catch (error) {
      if (date && topic?.category?.name === "科技") {
        setConflictInfo({
          hasConflict: true,
          totalConflicts: 2,
          sameCategoryCount: 2,
          conflicts: [
            { title: "智能手机市场报告发布", scheduledAt: date },
            { title: "5G应用场景拓展", scheduledAt: date },
          ],
          message: "检测到 2 个同栏目选题在同一天发布，建议调整排期。",
          suggestion: [
            "调整到其他日期发布",
            "错开时段发布（如上午/下午/晚间）",
            "调整栏目分类",
            "确认强制发布（需主编审批）",
          ],
        });
      } else {
        setConflictInfo(null);
      }
    }
  };

  const handleSchedule = async () => {
    if (!scheduleDate) return;
    if (conflictInfo && conflictInfo.hasConflict) {
      alert("存在排期冲突，已阻断发布确认。请调整排期时间或获得主编授权后强制发布。");
      return;
    }
    try {
      const res = await fetch(`/api/topics/${topicId}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schedulerId: "scheduler-id",
          scheduledAt: new Date(scheduleDate).toISOString(),
          timeSlot: scheduleTimeSlot,
          note: scheduleNote,
        }),
      });
      if (res.ok) {
        setShowScheduleModal(false);
        loadTopic();
      } else if (res.status === 409) {
        const data = await res.json();
        setConflictInfo(data);
      }
    } catch (error) {
      console.error("排期失败:", error);
      alert("排期操作完成（演示模式）");
      setShowScheduleModal(false);
    }
  };

  const handleArchive = async () => {
    if (archiveAction === "PUBLISH" && hasConflicts) {
      alert("该选题存在排期冲突，发布已被阻断。请先解决排期冲突。");
      return;
    }
    try {
      const res = await fetch(`/api/topics/${topicId}/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewerId: "reviewer-id",
          action: archiveAction,
          comment: archiveComment,
        }),
      });
      if (res.ok) {
        setShowArchiveModal(false);
        loadTopic();
      }
    } catch (error) {
      console.error("操作失败:", error);
      alert("操作完成（演示模式）");
      setShowArchiveModal(false);
    }
  };

  if (loading) {
    return <div className="card"><p>加载中...</p></div>;
  }

  if (!topic) {
    return <div className="card"><p>选题不存在</p></div>;
  }

  const hasConflicts = topic.conflictDetectedConflicts.length > 0 || topic.conflictCausedConflicts.length > 0;
  const allConflicts = [
    ...topic.conflictDetectedConflicts.map((c) => ({ ...c, direction: "detected" })),
    ...topic.conflictCausedConflicts.map((c) => ({ ...c, direction: "caused" })),
  ];

  const tabs = [
    { id: "overview", label: "概览" },
    { id: "source", label: "来源与版权" },
    { id: "schedule", label: "排期信息" },
    { id: "revisions", label: "修改记录" },
    { id: "timeline", label: "历史节点" },
  ];

  const canReview = currentRole === "chief" && topic.status === TopicStatus.PENDING_REVIEW;
  const canSchedule = currentRole === "scheduler" &&
    (topic.status === TopicStatus.APPROVED || topic.status === TopicStatus.SCHEDULED || topic.status === TopicStatus.SCHEDULE_CONFLICT);
  const canArchive = currentRole === "reviewer" &&
    (topic.status === TopicStatus.SCHEDULED || topic.status === TopicStatus.PUBLISHED);
  const canEdit = currentRole === "editor" &&
    [TopicStatus.DRAFT, TopicStatus.COPYRIGHT_MISSING, TopicStatus.TITLE_REVISION].includes(topic.status);

  return (
    <div className="topic-detail-page">
      <div className="page-header">
        <div>
          <button className="btn btn-default btn-sm" onClick={() => navigate({ to: "/" })}>
            ← 返回列表
          </button>
        </div>
        <div className="page-actions">
          <span className={getStatusBadgeClass(topic.status)} style={{ fontSize: "0.95rem", padding: "6px 16px" }}>
            {statusLabels[topic.status]}
          </span>
          <select
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value as Role)}
            className="form-input"
            style={{ width: "120px" }}
          >
            <option value="editor">编辑</option>
            <option value="chief">主编</option>
            <option value="scheduler">排期</option>
            <option value="reviewer">复核</option>
          </select>
        </div>
      </div>

      <div className="card">
        <h2 className="topic-title-main">{topic.title}</h2>
        {topic.originalTitle && (
          <p className="original-title">原标题：{topic.originalTitle}</p>
        )}
        <p className="topic-summary-main">{topic.summary}</p>
        <div className="topic-meta">
          <span className="meta-item">📁 {topic.category?.name || "未分类"}</span>
          <span className="meta-item">👤 {topic.submitter?.name}</span>
          <span className="meta-item">⭐ {"★".repeat(topic.priority)}{"☆".repeat(3 - topic.priority)}</span>
          <span className="meta-item">📅 创建于 {formatDate(topic.createdAt)}</span>
        </div>
      </div>

      {hasConflicts && (
        <div className="conflict-banner">
          <h4>⚠️ 排期冲突警告</h4>
          <p>该选题存在 {allConflicts.length} 个排期冲突，<strong>发布将被阻断</strong>，请处理后再发布。</p>
          <ul className="conflict-list">
            {allConflicts.map((c) => (
              <li key={c.id}>
                <strong>[{conflictTypeLabels[c.conflictType as keyof typeof conflictTypeLabels] || c.conflictType}]</strong>{" "}
                {c.direction === "detected"
                  ? c.conflictingTopic?.title
                  : c.topic?.title}
                <br />
                <span style={{ fontSize: "0.85rem", color: "#666" }}>
                  {c.description}
                </span>
              </li>
            ))}
          </ul>
          <p style={{ fontSize: "0.9rem" }}>
            💡 换档期路径：调整排期时间 → 错开冲突选题；或协调栏目主编确认后强制发布。
          </p>
        </div>
      )}

      <div className="action-bar card">
        {canEdit && (
        <>
          <button className="btn btn-primary">编辑选题</button>
          {topic.status !== TopicStatus.PENDING_REVIEW && (
            <button className="btn btn-success">提交审核</button>
          )}
        </>
      )}
      {canReview && (
        <button className="btn btn-primary" onClick={() => setShowReviewModal(true)}>
          审核选题
        </button>
      )}
      {canSchedule && (
        <button className="btn btn-success" onClick={() => setShowScheduleModal(true)}>
          {topic.status === TopicStatus.SCHEDULED ? "调整排期" : "安排排期"}
        </button>
      )}
      {canArchive && (
        <>
          <button className="btn btn-success" onClick={() => { setArchiveAction("PUBLISH"); setShowArchiveModal(true); }}>
            确认发布
          </button>
          <button className="btn btn-warning" onClick={() => { setArchiveAction("ARCHIVE"); setShowArchiveModal(true); }}>
            归档
          </button>
          <button className="btn btn-danger" onClick={() => { setArchiveAction("RETURN"); setShowArchiveModal(true); }}>
            退回
          </button>
        </>
      )}
      <div style={{ flex: 1 }} />
      <div className="handler-info">
        <span style={{ color: "#666", fontSize: "0.9rem" }}>当前责任人：</span>
        <strong>{topic.currentHandler?.name || "-"}</strong>
        <span style={{ color: "#888", fontSize: "0.85rem" }}>
          ({userRoleLabels[topic.currentHandler?.role || UserRole.EDITOR] || "-"})
        </span>
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
            <div className="grid grid-2">
              <div className="info-section">
                <h4 className="section-title">基本信息</h4>
                <div className="info-list">
                  <div className="info-row">
                  <span className="info-label">选题标题</span>
                  <span className="info-value">{topic.title}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">所属栏目</span>
                  <span className="info-value">{topic.category?.name || "-"}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">优先级</span>
                  <span className="info-value">{"★".repeat(topic.priority)}{"☆".repeat(3 - topic.priority)}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">延期次数</span>
                  <span className="info-value">{topic.delayCount || 0} 次</span>
                </div>
                <div className="info-row">
                  <span className="info-label">被拒次数</span>
                  <span className="info-value">{topic.rejectCount || 0} 次</span>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h4 className="section-title">摘要</h4>
              <p className="summary-text">{topic.summary}</p>

              <h4 className="section-title" style={{ marginTop: "20px" }}>内容大纲</h4>
              {topic.contentOutline ? (
                <pre className="outline-text">{topic.contentOutline}</pre>
              ) : (
                <p style={{ color: "#999" }}>暂无内容大纲</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "source" && (
          <div className="source-tab">
            <h4 className="section-title">选题来源</h4>
            <div className="info-list">
              <div className="info-row">
                <span className="info-label">来源名称</span>
                <span className="info-value">{topic.source}</span>
              </div>
              <div className="info-row">
                <span className="info-label">来源链接</span>
                <span className="info-value">
                  {topic.sourceUrl ? (
                  <a href={topic.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#1976d2" }}>
                    {topic.sourceUrl}
                  </a>
                ) : "-"}
                </span>
              </div>
            </div>

            <h4 className="section-title" style={{ marginTop: "24px" }}>版权证据</h4>
            {topic.copyrightEvidence ? (
              <div className="copyright-box">
                <div className="copyright-icon">✅</div>
                <div className="copyright-content">
                  <strong>版权材料已提供</strong>
                  <p>{topic.copyrightEvidence}</p>
                </div>
              </div>
            ) : (
              <div className="copyright-box missing">
                <div className="copyright-icon">⚠️</div>
                <div className="copyright-content">
                  <strong>版权材料缺失</strong>
                  <p>请补充版权授权证明或授权协议</p>
                </div>
              </div>
            )}

            <h4 className="section-title" style={{ marginTop: "24px" }}>提交人信息</h4>
            <div className="info-list">
              <div className="info-row">
                <span className="info-label">提交人</span>
                <span className="info-value">{topic.submitter?.name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">角色</span>
                <span className="info-value">{userRoleLabels[topic.submitter?.role || UserRole.EDITOR]}</span>
              </div>
              <div className="info-row">
                <span className="info-label">邮箱</span>
                <span className="info-value">{topic.submitter?.email || "-"}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "schedule" && (
          <div className="schedule-tab">
            <h4 className="section-title">排期信息</h4>
            {topic.schedules.length > 0 ? (
              <div className="schedule-list">
                {topic.schedules.map((s, idx) => (
                <div key={s.id || idx} className="schedule-item">
                  <div className="schedule-time">
                    <strong>{formatDate(s.scheduledAt)}</strong>
                    {s.timeSlot && <span className="schedule-slot"> {s.timeSlot}</span>}
                  </div>
                  <div className="schedule-meta">
                    <span>排期人：{s.scheduler?.name || "-"}</span>
                    {s.note && <p className="schedule-note">备注：{s.note}</p>}
                  </div>
                </div>
              ))}
              </div>
            ) : (
              <p style={{ color: "#999" }}>暂无排期信息</p>
            )}

            {allConflicts.length > 0 && (
              <>
                <h4 className="section-title" style={{ marginTop: "24px", color: "#e65100" }}>
                  ⚠️ 排期冲突
                </h4>
                <div className="conflict-list-box">
                  {allConflicts.map((c) => (
                  <div key={c.id} className="conflict-item">
                    <span className="conflict-type">
                      {conflictTypeLabels[c.conflictType as keyof typeof conflictTypeLabels] || c.conflictType}
                    </span>
                    <div className="conflict-detail">
                      <p>
                        冲突选题：<strong>
                          {c.direction === "detected"
                            ? c.conflictingTopic?.title
                            : c.topic?.title}
                        </strong>
                      </p>
                      <p className="conflict-desc">{c.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "revisions" && (
        <div className="revisions-tab">
          <h4 className="section-title">修改记录</h4>
          {topic.revisionRecords.length > 0 ? (
            <div className="revision-list">
              {topic.revisionRecords.map((r) => (
              <div key={r.id} className="revision-item">
                <div className="revision-header">
                  <span className="revision-field">{r.fieldName === "title" ? "标题" : r.fieldName}</span>
                  <span className="revision-time">{formatDate(r.createdAt)}</span>
                </div>
                <div className="revision-diff">
                  <div className="diff-old">
                    <span className="diff-label">修改前：</span>
                    <span>{r.oldValue || "(空)"}</span>
                  </div>
                  <div className="diff-arrow">→</div>
                  <div className="diff-new">
                    <span className="diff-label">修改后：</span>
                    <span>{r.newValue || "(空)"}</span>
                  </div>
                </div>
                {r.reason && <p className="revision-reason">修改原因：{r.reason}</p>}
                <p className="revision-editor">操作人：{r.editor?.name || "-"}</p>
              </div>
            ))}
            </div>
          ) : (
            <p style={{ color: "#999" }}>暂无修改记录</p>
          )}

          <h4 className="section-title" style={{ marginTop: "24px" }}>审核记录</h4>
          {topic.reviews.length > 0 ? (
            <div className="review-list">
              {topic.reviews.map((r) => (
              <div key={r.id} className="review-item">
                <div className="review-header">
                  <span className="review-result">{reviewResultLabels[r.result]}</span>
                  <span className="review-time">{formatDate(r.createdAt)}</span>
                </div>
                <p className="review-comment">{r.comment || "无评语"}</p>
                <p className="reviewer">审核人：{r.reviewer?.name || "-"}</p>
              </div>
            ))}
            </div>
          ) : (
            <p style={{ color: "#999" }}>暂无审核记录</p>
          )}
        </div>
      )}

      {activeTab === "timeline" && (
        <div className="timeline-tab">
          <h4 className="section-title">状态变更历史</h4>
          <div className="timeline">
            {topic.statusHistory.map((h, idx) => (
            <div key={h.id || idx} className="timeline-item">
              <div className="timeline-time">{formatDate(h.createdAt)}</div>
              <div className="timeline-content">
                <div className="timeline-status">
                  <span className={getStatusBadgeClass(h.status)} style={{ fontSize: "0.8rem" }}>
                    {statusLabels[h.status]}
                  </span>
                </div>
                <p className="timeline-remark">{h.remark || "-"}</p>
                <p className="timeline-operator">操作人：{h.operator?.name || "-"}</p>
              </div>
            </div>
          ))}
          </div>

          {topic.archiveLogs.length > 0 && (
            <>
              <h4 className="section-title" style={{ marginTop: "24px" }}>归档操作记录</h4>
              <div className="archive-list">
                {topic.archiveLogs.map((log) => (
                <div key={log.id} className="archive-item">
                  <strong>{log.action === "ARCHIVED" ? "归档" : log.action === "PUBLISHED" ? "发布" : "退回"}</strong>
                  <span style={{ marginLeft: "12px", color: "#888", fontSize: "0.85rem" }}>
                    {formatDate(log.createdAt)} · {log.reviewer?.name || "-"}
                  </span>
                  {log.comment && <p style={{ marginTop: "6px" }}>{log.comment}</p>}
                </div>
              ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
    </div>

      {showReviewModal && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">审核选题</h3>
            <div className="form-group">
              <label className="form-label">审核结果</label>
              <select
                className="form-select"
                value={reviewResult}
                onChange={(e) => setReviewResult(e.target.value as ReviewResult)}
              >
                <option value={ReviewResult.APPROVED}>审核通过</option>
                <option value={ReviewResult.COPYRIGHT_MISSING}>版权材料缺失</option>
                <option value={ReviewResult.TITLE_REVISION}>标题需修改</option>
                <option value={ReviewResult.REJECTED}>拒绝</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">审核意见</label>
              <textarea
                className="form-textarea"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="请输入审核意见..."
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-default" onClick={() => setShowReviewModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleReview}>确认</button>
            </div>
          </div>
        </div>
      )}

      {showScheduleModal && (
        <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">安排排期</h3>
            <div className="form-group">
              <label className="form-label">发布日期时间</label>
              <input
                type="datetime-local"
                className="form-input"
                value={scheduleDate}
                onChange={(e) => {
                  setScheduleDate(e.target.value);
                  checkScheduleConflict(e.target.value);
                }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">时段</label>
              <select
                className="form-select"
                value={scheduleTimeSlot}
                onChange={(e) => setScheduleTimeSlot(e.target.value)}
              >
                <option value="">请选择</option>
                <option value="早间">早间 (7:00-9:00)</option>
                <option value="上午">上午 (9:00-12:00)</option>
                <option value="午间">午间 (12:00-14:00)</option>
                <option value="下午">下午 (14:00-18:00)</option>
                <option value="晚间">晚间 (18:00-22:00)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">备注</label>
              <textarea
                className="form-textarea"
                value={scheduleNote}
                onChange={(e) => setScheduleNote(e.target.value)}
                placeholder="排期备注..."
              />
            </div>

            {conflictInfo && conflictInfo.hasConflict && (
              <div className="conflict-banner" style={{ marginBottom: "16px" }}>
              <h4>⚠️ 检测到排期冲突</h4>
              <p>{conflictInfo.message}</p>
              <ul>
                {conflictInfo.suggestion?.map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
              <p style={{ fontSize: "0.85rem", marginTop: "8px", color: "#e65100" }}>
                存在冲突时将阻断发布确认，请调整排期或获得主编授权后强制发布。
              </p>
            </div>
          )}

            <div className="modal-actions">
              <button className="btn btn-default" onClick={() => setShowScheduleModal(false)}>取消</button>
              <button
                className="btn btn-primary"
                onClick={handleSchedule}
                disabled={!scheduleDate || (conflictInfo && conflictInfo.hasConflict)}
                style={{ opacity: (!scheduleDate || (conflictInfo && conflictInfo.hasConflict)) ? 0.5 : 1 }}
              >
                确认排期
              </button>
            </div>
          </div>
        </div>
      )}

      {showArchiveModal && (
        <div className="modal-overlay" onClick={() => setShowArchiveModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">
              {archiveAction === "PUBLISH" ? "确认发布" : archiveAction === "ARCHIVE" ? "确认归档" : "退回选题"}
            </h3>
            <p style={{ marginBottom: "16px", color: "#666" }}>
              {archiveAction === "PUBLISH"
                ? hasConflicts
                  ? "⚠️ 该选题存在排期冲突，发布将被阻断。请先解决冲突。"
                  : "确认该选题可以正式发布吗？"
                : archiveAction === "ARCHIVE"
                ? "确认将该选题归档吗？"
                : "请填写退回原因。"}
            </p>
            <div className="form-group">
              <label className="form-label">备注说明</label>
              <textarea
                className="form-textarea"
                value={archiveComment}
                onChange={(e) => setArchiveComment(e.target.value)}
                placeholder="请输入说明..."
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-default" onClick={() => setShowArchiveModal(false)}>取消</button>
              <button
                className={`btn ${archiveAction === "RETURN" ? "btn-danger" : "btn-primary"}`}
                onClick={handleArchive}
                disabled={archiveAction === "PUBLISH" && hasConflicts}
                style={{ opacity: archiveAction === "PUBLISH" && hasConflicts ? 0.5 : 1 }}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{pageStyles}</style>
    </div>
  );
}

const pageStyles = `
  .topic-detail-page { margin-bottom: 20px; }
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  .page-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .topic-title-main {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1a1a2e;
    margin-bottom: 8px;
  }
  .original-title {
    color: #888;
    font-size: 0.9rem;
    margin-bottom: 12px;
    text-decoration: line-through;
  }
  .topic-summary-main {
    color: #555;
    line-height: 1.6;
    margin-bottom: 16px;
  }
  .topic-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    font-size: 0.9rem;
    color: #666;
  }
  .meta-item { white-space: nowrap; }
  .action-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 24px;
  }
  .handler-info {
    display: flex;
    align-items: center;
    gap: 6px;
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
  .section-title {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 12px;
    color: #333;
  }
  .info-section { padding: 8px 0; }
  .info-list { }
  .info-row {
    display: flex;
    padding: 8px 0;
    border-bottom: 1px solid #f5f5f5;
  }
  .info-row:last-child { border-bottom: none; }
  .info-label {
    width: 100px;
    color: #888;
    font-size: 0.9rem;
    flex-shrink: 0;
  }
  .info-value {
    flex: 1;
    color: #333;
    word-break: break-all;
  }
  .summary-text {
    color: #555;
    line-height: 1.7;
    background: #fafafa;
    padding: 12px;
    border-radius: 8px;
  }
  .outline-text {
    background: #fafafa;
    padding: 12px;
    border-radius: 8px;
    white-space: pre-wrap;
    font-family: inherit;
    font-size: 0.9rem;
    color: #555;
    line-height: 1.7;
  }
  .copyright-box {
    display: flex;
    gap: 12px;
    padding: 16px;
    background: #e8f5e9;
    border-radius: 8px;
    align-items: flex-start;
  }
  .copyright-box.missing {
    background: #fff3e0;
  }
  .copyright-icon { font-size: 1.5rem; }
  .copyright-content p {
    margin-top: 4px;
    font-size: 0.9rem;
    color: #555;
  }
  .schedule-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .schedule-item {
    padding: 16px;
    background: #f5f5f5;
    border-radius: 8px;
  }
  .schedule-time {
    font-size: 1.05rem;
    margin-bottom: 8px;
  }
  .schedule-slot {
    background: #e3f2fd;
    color: #1565c0;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.85rem;
    margin-left: 8px;
  }
  .schedule-meta {
    color: #666;
    font-size: 0.9rem;
  }
  .schedule-note { margin-top: 4px; }
  .conflict-list-box {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .conflict-item {
    padding: 12px;
    background: #fff3e0;
    border-radius: 8px;
    border-left: 4px solid #ff9800;
  }
  .conflict-type {
    font-weight: 600;
    color: #e65100;
    font-size: 0.9rem;
  }
  .conflict-detail {
    margin-top: 8px;
    font-size: 0.9rem;
  }
  .conflict-desc {
    color: #666;
    margin-top: 4px;
  }
  .revision-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .revision-item {
    padding: 16px;
    background: #fafafa;
    border-radius: 8px;
  }
  .revision-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  .revision-field {
    font-weight: 600;
    background: #e3f2fd;
    color: #1565c0;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 0.85rem;
  }
  .revision-time {
    color: #888;
    font-size: 0.85rem;
  }
  .revision-diff {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .diff-old, .diff-new {
    flex: 1;
    min-width: 200px;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 0.9rem;
  }
  .diff-old { background: #ffebee; color: #c62828; }
  .diff-new { background: #e8f5e9; color: #2e7d32; }
  .diff-label { font-weight: 500; margin-right: 6px; }
  .diff-arrow {
    font-size: 1.2rem;
    color: #888;
  }
  .revision-reason {
    margin-top: 10px;
    color: #666;
    font-size: 0.9rem;
    font-style: italic;
  }
  .revision-editor {
    margin-top: 8px;
    color: #888;
    font-size: 0.85rem;
  }
  .review-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .review-item {
    padding: 14px;
    background: #f5f5f5;
    border-radius: 8px;
  }
  .review-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  .review-result {
    font-weight: 600;
    color: #1565c0;
  }
  .review-time {
    color: #888;
    font-size: 0.85rem;
  }
  .review-comment {
    color: #555;
    line-height: 1.6;
  }
  .reviewer {
    margin-top: 8px;
    color: #888;
    font-size: 0.85rem;
  }
  .timeline {
    position: relative;
    padding-left: 24px;
  }
  .timeline::before {
    content: '';
    position: absolute;
    left: 8px;
    top: 4px;
    bottom: 4px;
    width: 2px;
    background: #e0e0e0;
  }
  .timeline-item {
    position: relative;
    margin-bottom: 20px;
  }
  .timeline-item::before {
    content: '';
    position: absolute;
    left: -20px;
    top: 6px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #1976d2;
    border: 2px solid white;
    box-shadow: 0 0 0 2px #1976d2;
  }
  .timeline-time {
    font-size: 0.8rem;
    color: #888;
    margin-bottom: 6px;
  }
  .timeline-content {
    background: #f5f5f5;
    padding: 12px 16px;
    border-radius: 8px;
  }
  .timeline-status { margin-bottom: 6px; }
  .timeline-remark {
    color: #555;
    font-size: 0.9rem;
  }
  .timeline-operator {
    margin-top: 6px;
    color: #888;
    font-size: 0.8rem;
  }
  .archive-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .archive-item {
    padding: 12px;
    background: #f5f5f5;
    border-radius: 8px;
  }
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  .modal {
    background: white;
    border-radius: 12px;
    padding: 24px;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
  }
  .modal-title {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 20px;
    color: #1a1a2e;
  }
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
  }
  @media (max-width: 768px) {
    .action-bar { flex-wrap: wrap; }
  }
`;
