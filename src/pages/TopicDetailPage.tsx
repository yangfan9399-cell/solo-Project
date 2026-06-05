import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState, useContext } from "react";
import {
  statusLabels,
  getStatusBadgeClass,
  formatDate,
  userRoleLabels,
} from "../utils/format";
import { TopicStatus, ReviewResult } from "@prisma/client";
import { CurrentRoleContext } from "../routeTree";

interface TopicDetail {
  id: string;
  title: string;
  originalTitle: string | null;
  summary: string;
  source: string;
  sourceUrl: string | null;
  copyrightEvidence: string | null;
  contentOutline: string | null;
  priority: number;
  status: TopicStatus;
  rejectCount: number;
  rejectReason: string | null;
  delayCount: number;
  createdAt: string;
  updatedAt: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  archivedAt: string | null;
  category?: { id: string; name: string } | null;
  submitter?: { id: string; name: string; role: string; email: string } | null;
  currentHandler?: { id: string; name: string; role: string } | null;
  reviews: Array<{
    id: string;
    result: ReviewResult;
    comment: string;
    createdAt: string;
    reviewer?: { id: string; name: string; role: string } | null;
  }>;
  schedules: Array<{
    id: string;
    scheduledAt: string;
    timeSlot: string | null;
    note: string | null;
    createdAt: string;
    isPrimary: boolean;
    scheduler?: { id: string; name: string; role: string } | null;
  }>;
  revisionRecords: Array<{
    id: string;
    fieldName: string;
    oldValue: string;
    newValue: string;
    reason: string | null;
    createdAt: string;
    editor?: { id: string; name: string; role: string } | null;
  }>;
  archiveLogs: Array<{
    id: string;
    action: string;
    comment: string | null;
    createdAt: string;
    reviewer?: { id: string; name: string; role: string } | null;
  }>;
  statusHistory: Array<{
    id: string;
    status: TopicStatus;
    remark: string | null;
    createdAt: string;
    operator?: { id: string; name: string; role: string } | null;
  }>;
  conflictDetectedConflicts: Array<{
    id: string;
    description: string | null;
    resolved: boolean;
    conflictingTopic?: { id: string; title: string; status: TopicStatus } | null;
  }>;
}

type TabKey = "overview" | "source" | "schedule" | "revisions" | "history";

export default function TopicDetailPage() {
  const { topicId } = useParams({ from: "/topics/$topicId" });
  const navigate = useNavigate();
  const { role } = useContext(CurrentRoleContext);
  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [reviewResult, setReviewResult] = useState<ReviewResult>(ReviewResult.APPROVED);
  const [reviewComment, setReviewComment] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTimeSlot, setScheduleTimeSlot] = useState("");
  const [scheduleNote, setScheduleNote] = useState("");
  const [scheduleConflict, setScheduleConflict] = useState<any>(null);
  const [archiveAction, setArchiveAction] = useState<"PUBLISH" | "ARCHIVE" | "RETURN">("PUBLISH");
  const [archiveComment, setArchiveComment] = useState("");
  const [returnReason, setReturnReason] = useState("");

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
      console.error("加载详情失败:", error);
      setTopic(getMockTopic());
    }
    setLoading(false);
  };

  const getMockTopic = (): TopicDetail => {
    return {
      id: topicId || "demo-topic",
      title: "人工智能大模型技术突破：新一代多模态模型发布",
      originalTitle: "AI大模型新进展",
      summary: "某科技公司发布新一代多模态大模型，在多项基准测试中刷新全球记录，展现了强大的推理能力和多模态理解能力。",
      source: "科技媒体",
      sourceUrl: "https://example.com/source",
      copyrightEvidence: "已获得官方授权，授权书编号：AUTH-2026-001",
      contentOutline: "# 引言\n## 技术背景\n## 核心突破\n### 多模态能力\n### 推理能力\n## 应用场景\n## 总结",
      priority: 1,
      status: TopicStatus.SCHEDULED,
      rejectCount: 0,
      rejectReason: null,
      delayCount: 0,
      createdAt: "2026-06-01T10:00:00",
      updatedAt: "2026-06-02T15:30:00",
      scheduledAt: "2026-06-08T10:00:00",
      publishedAt: null,
      archivedAt: null,
      category: { id: "cat1", name: "科技" },
      submitter: { id: "u1", name: "张编辑", role: "EDITOR", email: "zhang@example.com" },
      currentHandler: { id: "u3", name: "王排期", role: "SCHEDULER" },
      reviews: [
        {
          id: "r1",
          result: ReviewResult.APPROVED,
          comment: "选题价值高，来源可靠，同意通过。",
          createdAt: "2026-06-01T14:00:00",
          reviewer: { id: "u2", name: "刘主编", role: "CHIEF_EDITOR" },
        },
      ],
      schedules: [
        {
          id: "s1",
          scheduledAt: "2026-06-08T10:00:00",
          timeSlot: "MORNING",
          note: "早间热点时段发布",
          createdAt: "2026-06-02T10:00:00",
          isPrimary: true,
          scheduler: { id: "u3", name: "王排期", role: "SCHEDULER" },
        },
      ],
      revisionRecords: [
        {
          id: "rev1",
          fieldName: "title",
          oldValue: "AI大模型新进展",
          newValue: "人工智能大模型技术突破：新一代多模态模型发布",
          reason: "标题不够具体，需要突出核心亮点",
          createdAt: "2026-06-01T11:00:00",
          editor: { id: "u1", name: "张编辑", role: "EDITOR" },
        },
      ],
      archiveLogs: [],
      statusHistory: [
        {
          id: "sh1",
          status: TopicStatus.DRAFT,
          remark: "创建草稿",
          createdAt: "2026-06-01T10:00:00",
          operator: { id: "u1", name: "张编辑", role: "EDITOR" },
        },
        {
          id: "sh2",
          status: TopicStatus.PENDING_REVIEW,
          remark: "提交审核",
          createdAt: "2026-06-01T10:30:00",
          operator: { id: "u1", name: "张编辑", role: "EDITOR" },
        },
        {
          id: "sh3",
          status: TopicStatus.APPROVED,
          remark: "审核通过",
          createdAt: "2026-06-01T14:00:00",
          operator: { id: "u2", name: "刘主编", role: "CHIEF_EDITOR" },
        },
        {
          id: "sh4",
          status: TopicStatus.SCHEDULED,
          remark: "排期：2026-06-08 10:00",
          createdAt: "2026-06-02T10:00:00",
          operator: { id: "u3", name: "王排期", role: "SCHEDULER" },
        },
      ],
      conflictDetectedConflicts: [],
    };
  };

  const handleReview = async () => {
    try {
      const res = await fetch(`/api/topics/${topicId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewerId: "user-2",
          result: reviewResult,
          comment: reviewComment,
        }),
      });
      if (res.ok) {
        setShowReviewModal(false);
        loadTopic();
      } else {
        alert("审核失败");
      }
    } catch (error) {
      setShowReviewModal(false);
      loadTopic();
    }
  };

  const checkScheduleConflict = async (date: string) => {
    try {
      const params = new URLSearchParams();
      params.set("scheduledAt", date);
      params.set("topicId", topicId);
      if (topic?.category?.id) params.set("categoryId", topic.category.id);

      const res = await fetch(`/api/schedule/check-conflict?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setScheduleConflict(data.hasConflict ? data : null);
      }
    } catch (error) {
      setScheduleConflict(null);
    }
  };

  const handleSchedule = async () => {
    if (!scheduleDate) {
      alert("请选择排期时间");
      return;
    }

    try {
      const res = await fetch(`/api/topics/${topicId}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schedulerId: "user-3",
          scheduledAt: scheduleDate,
          timeSlot: scheduleTimeSlot,
          note: scheduleNote,
          forceSchedule: false,
        }),
      });

      if (res.ok) {
        setShowScheduleModal(false);
        loadTopic();
      } else if (res.status === 409) {
        const data = await res.json();
        if (confirm(`${data.message}\n\n是否强制排期？`)) {
          const forceRes = await fetch(`/api/topics/${topicId}/schedule`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              schedulerId: "user-3",
              scheduledAt: scheduleDate,
              timeSlot: scheduleTimeSlot,
              note: scheduleNote,
              forceSchedule: true,
            }),
          });
          if (forceRes.ok) {
            setShowScheduleModal(false);
            loadTopic();
          }
        }
      }
    } catch (error) {
      setShowScheduleModal(false);
      loadTopic();
    }
  };

  const handleArchive = async () => {
    try {
      const res = await fetch(`/api/topics/${topicId}/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewerId: "user-4",
          action: archiveAction,
          comment: archiveComment,
          returnReason: archiveAction === "RETURN" ? returnReason : undefined,
        }),
      });

      if (res.ok) {
        setShowArchiveModal(false);
        loadTopic();
      } else if (res.status === 409) {
        const data = await res.json();
        alert(data.message || "操作失败");
      }
    } catch (error) {
      setShowArchiveModal(false);
      loadTopic();
    }
  };

  const canReview = role === "chief" && topic?.status === TopicStatus.PENDING_REVIEW;
  const canSchedule =
    (role === "scheduler" || role === "chief") &&
    (topic?.status === TopicStatus.APPROVED ||
      topic?.status === TopicStatus.COPYRIGHT_MISSING ||
      topic?.status === TopicStatus.TITLE_REVISION);
  const canArchive =
    role === "reviewer" &&
    (topic?.status === TopicStatus.SCHEDULED || topic?.status === TopicStatus.SCHEDULE_CONFLICT);
  const hasConflict =
    topic?.status === TopicStatus.SCHEDULE_CONFLICT ||
    (topic?.conflictDetectedConflicts?.length || 0) > 0;

  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview", label: "概览" },
    { key: "source", label: "来源与版权" },
    { key: "schedule", label: "排期信息" },
    { key: "revisions", label: "修改记录" },
    { key: "history", label: "历史节点" },
  ];

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (!topic) {
    return <div className="empty-state">选题不存在</div>;
  }

  return (
    <div className="topic-detail">
      <div className="detail-header">
        <button className="btn btn-sm btn-default" onClick={() => navigate({ to: "/" })}>
          ← 返回列表
        </button>
        <div className="detail-actions">
          {canReview && (
            <button className="btn btn-primary" onClick={() => setShowReviewModal(true)}>
              审核选题
            </button>
          )}
          {canSchedule && (
            <button className="btn btn-success" onClick={() => setShowScheduleModal(true)}>
              安排排期
            </button>
          )}
          {canArchive && (
            <button className="btn btn-warning" onClick={() => setShowArchiveModal(true)}>
              复核操作
            </button>
          )}
        </div>
      </div>

      {hasConflict && (
        <div className="conflict-banner">
          <h4>⚠️ 排期冲突警告</h4>
          <p>该选题当前存在排期冲突，无法直接发布。</p>
          <ul className="conflict-list">
            {topic.conflictDetectedConflicts?.map((c) => (
              <li key={c.id}>
                {c.description}
                {c.conflictingTopic && (
                  <span>
                    {" "}— <strong>{c.conflictingTopic.title}</strong>
                  </span>
                )}
              </li>
            ))}
          </ul>
          <div className="conflict-suggestions">
            <strong>建议解决方案：</strong>
            <ul>
              <li>调整排期到其他日期</li>
              <li>错开发布时段（早间/午间/晚间）</li>
              <li>调整栏目分类</li>
              <li>如确认必须同天发布，需主编特别审批</li>
            </ul>
          </div>
        </div>
      )}

      <div className="card">
        <div className="detail-title-row">
          <h2 className="detail-title">{topic.title}</h2>
          <span className={getStatusBadgeClass(topic.status)}>{statusLabels[topic.status]}</span>
        </div>
        <p className="detail-meta">
          {topic.category?.name && <span className="tag">{topic.category.name}</span>}
          <span>优先级：{"⭐".repeat(topic.priority)}</span>
          <span>提交人：{topic.submitter?.name}</span>
        </p>
        {topic.originalTitle && topic.originalTitle !== topic.title && (
          <p className="original-title">原始标题：{topic.originalTitle}</p>
        )}
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
          <div className="card">
            <h3 className="card-title">基本信息</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">当前状态</span>
                <span className={getStatusBadgeClass(topic.status)}>
                  {statusLabels[topic.status]}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">当前责任人</span>
                <span className="info-value">
                  {topic.currentHandler?.name || "暂无"}{" "}
                  {topic.currentHandler?.role &&
                    `（${userRoleLabels[topic.currentHandler.role as keyof typeof userRoleLabels]}）`}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">提交时间</span>
                <span className="info-value">{formatDate(topic.createdAt)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">排期时间</span>
                <span className="info-value">{formatDate(topic.scheduledAt)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">发布时间</span>
                <span className="info-value">{formatDate(topic.publishedAt)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">归档时间</span>
                <span className="info-value">{formatDate(topic.archivedAt)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">退回次数</span>
                <span className="info-value">{topic.rejectCount || 0} 次</span>
              </div>
              <div className="info-item">
                <span className="info-label">延期次数</span>
                <span className="info-value">{topic.delayCount || 0} 次</span>
              </div>
            </div>

            <h3 className="card-title" style={{ marginTop: "24px" }}>
              内容摘要
            </h3>
            <p className="summary-text">{topic.summary}</p>

            {topic.contentOutline && (
              <>
                <h3 className="card-title" style={{ marginTop: "24px" }}>
                  内容大纲
                </h3>
                <pre className="outline-text">{topic.contentOutline}</pre>
              </>
            )}
          </div>
        )}

        {activeTab === "source" && (
          <div className="card">
            <h3 className="card-title">选题来源</h3>
            <div className="info-item" style={{ marginBottom: "20px" }}>
              <span className="info-label">来源渠道</span>
              <span className="info-value">{topic.source || "-"}</span>
            </div>
            {topic.sourceUrl && (
              <div className="info-item" style={{ marginBottom: "20px" }}>
                <span className="info-label">来源链接</span>
                <a href={topic.sourceUrl} target="_blank" rel="noopener noreferrer" className="info-value link">
                  {topic.sourceUrl}
                </a>
              </div>
            )}

            <h3 className="card-title" style={{ marginTop: "24px" }}>
              版权证据
            </h3>
            {topic.copyrightEvidence ? (
              <div className="evidence-box">
                <p>{topic.copyrightEvidence}</p>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">⚠️</div>
                <p>暂无版权材料</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "schedule" && (
          <div className="card">
            <h3 className="card-title">排期记录</h3>
            {topic.schedules?.length > 0 ? (
              <div className="schedule-list">
                {topic.schedules.map((schedule) => (
                  <div key={schedule.id} className="schedule-item">
                    <div className="schedule-header">
                      <span className="schedule-time">{formatDate(schedule.scheduledAt)}</span>
                      {schedule.isPrimary && <span className="tag tag-primary">当前排期</span>}
                    </div>
                    {schedule.timeSlot && (
                      <p className="schedule-slot">时段：{getTimeSlotLabel(schedule.timeSlot)}</p>
                    )}
                    {schedule.note && <p className="schedule-note">备注：{schedule.note}</p>}
                    <p className="schedule-meta">
                      排期人：{schedule.scheduler?.name || "-"} · {formatDate(schedule.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📅</div>
                <p>暂无排期记录</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "revisions" && (
          <div className="card">
            <h3 className="card-title">修改记录</h3>
            {topic.revisionRecords?.length > 0 ? (
              <div className="revision-list">
                {topic.revisionRecords.map((rev) => (
                  <div key={rev.id} className="revision-item">
                    <div className="revision-header">
                      <span className="revision-field">
                        {getFieldLabel(rev.fieldName)}
                      </span>
                      <span className="revision-time">{formatDate(rev.createdAt)}</span>
                    </div>
                    <div className="revision-diff">
                      <div className="revision-old">
                        <span className="revision-label">修改前：</span>
                        {rev.oldValue}
                      </div>
                      <div className="revision-new">
                        <span className="revision-label">修改后：</span>
                        {rev.newValue}
                      </div>
                    </div>
                    {rev.reason && (
                      <p className="revision-reason">修改原因：{rev.reason}</p>
                    )}
                    <p className="revision-meta">操作人：{rev.editor?.name || "-"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📝</div>
                <p>暂无修改记录</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="card">
            <h3 className="card-title">状态流转历史</h3>
            {topic.statusHistory?.length > 0 ? (
              <div className="timeline">
                {topic.statusHistory.map((item) => (
                  <div key={item.id} className="timeline-item">
                    <div className="timeline-time">{formatDate(item.createdAt)}</div>
                    <div className="timeline-content">
                      <div className="timeline-status">
                        <span className={getStatusBadgeClass(item.status)}>
                          {statusLabels[item.status]}
                        </span>
                      </div>
                      {item.remark && <div className="timeline-remark">{item.remark}</div>}
                      <div className="timeline-operator">
                        操作人：{item.operator?.name || "-"}{" "}
                        {item.operator?.role &&
                          `（${userRoleLabels[item.operator.role as keyof typeof userRoleLabels]}）`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📜</div>
                <p>暂无历史记录</p>
              </div>
            )}
          </div>
        )}
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
              <button className="btn btn-default" onClick={() => setShowReviewModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleReview}>
                确认审核
              </button>
            </div>
          </div>
        </div>
      )}

      {showScheduleModal && (
        <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">安排排期</h3>
            <div className="form-group">
              <label className="form-label">发布时间</label>
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
            {scheduleConflict && (
              <div className="conflict-banner">
                <p>
                  <strong>⚠️ 检测到排期冲突</strong>
                </p>
                <p>{scheduleConflict.message || `当天已有 ${scheduleConflict.totalConflicts} 个选题排期`}</p>
                {scheduleConflict.suggestion?.map((s: string, i: number) => (
                  <p key={i}>• {s}</p>
                ))}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">发布时段</label>
              <select
                className="form-select"
                value={scheduleTimeSlot}
                onChange={(e) => setScheduleTimeSlot(e.target.value)}
              >
                <option value="">请选择</option>
                <option value="MORNING">早间（06:00-09:00）</option>
                <option value="NOON">午间（11:00-14:00）</option>
                <option value="EVENING">晚间（18:00-22:00）</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">排期备注</label>
              <textarea
                className="form-textarea"
                value={scheduleNote}
                onChange={(e) => setScheduleNote(e.target.value)}
                placeholder="可选：排期说明..."
                rows={3}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-default" onClick={() => setShowScheduleModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleSchedule}>
                确认排期
              </button>
            </div>
          </div>
        </div>
      )}

      {showArchiveModal && (
        <div className="modal-overlay" onClick={() => setShowArchiveModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">复核操作</h3>
            <div className="form-group">
              <label className="form-label">操作类型</label>
              <select
                className="form-select"
                value={archiveAction}
                onChange={(e) => setArchiveAction(e.target.value as any)}
              >
                <option value="PUBLISH">确认发布</option>
                <option value="ARCHIVE">直接归档</option>
                <option value="RETURN">退回修改</option>
              </select>
            </div>
            {hasConflict && archiveAction === "PUBLISH" && (
              <div className="conflict-banner">
                <p>⚠️ 该选题存在排期冲突，无法直接发布！</p>
                <p>请先解决排期冲突后再进行发布操作。</p>
              </div>
            )}
            {archiveAction === "RETURN" && (
              <div className="form-group">
                <label className="form-label">退回原因</label>
                <textarea
                  className="form-textarea"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="请输入退回原因..."
                  rows={3}
                />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">备注说明</label>
              <textarea
                className="form-textarea"
                value={archiveComment}
                onChange={(e) => setArchiveComment(e.target.value)}
                placeholder="可选：备注说明..."
                rows={2}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-default" onClick={() => setShowArchiveModal(false)}>
                取消
              </button>
              <button
                className={`btn ${
                  archiveAction === "PUBLISH"
                    ? "btn-success"
                    : archiveAction === "ARCHIVE"
                    ? "btn-warning"
                    : "btn-danger"
                }`}
                onClick={handleArchive}
                disabled={hasConflict && archiveAction === "PUBLISH"}
              >
                确认操作
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{pageStyles}</style>
    </div>
  );
}

function getTimeSlotLabel(slot: string): string {
  const labels: Record<string, string> = {
    MORNING: "早间（06:00-09:00）",
    NOON: "午间（11:00-14:00）",
    EVENING: "晚间（18:00-22:00）",
  };
  return labels[slot] || slot;
}

function getFieldLabel(field: string): string {
  const labels: Record<string, string> = {
    title: "标题",
    summary: "摘要",
    content: "内容",
  };
  return labels[field] || field;
}

const pageStyles = `
  .topic-detail { margin-bottom: 20px; }
  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  .detail-actions {
    display: flex;
    gap: 12px;
  }
  .detail-title-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 12px;
  }
  .detail-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1a1a2e;
    flex: 1;
  }
  .detail-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    color: #666;
    font-size: 0.9rem;
    margin-top: 8px;
  }
  .original-title {
    color: #999;
    font-size: 0.9rem;
    margin-top: 8px;
    font-style: italic;
  }
  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  .info-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .info-label {
    font-size: 0.85rem;
    color: #888;
    font-weight: 500;
  }
  .info-value {
    font-size: 0.95rem;
    color: #333;
  }
  .info-value.link { color: #1976d2; text-decoration: underline; }
  .summary-text {
    line-height: 1.8;
    color: #333;
    font-size: 0.95rem;
  }
  .outline-text {
    background: #f5f5f5;
    padding: 16px;
    border-radius: 8px;
    font-family: monospace;
    font-size: 0.9rem;
    white-space: pre-wrap;
    line-height: 1.6;
  }
  .evidence-box {
    background: #e8f5e9;
    border: 1px solid #c8e6c9;
    padding: 16px;
    border-radius: 8px;
    color: #2e7d32;
  }
  .schedule-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .schedule-item {
    background: #f5f5f5;
    padding: 16px;
    border-radius: 8px;
    border-left: 4px solid #1976d2;
  }
  .schedule-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  .schedule-time {
    font-weight: 600;
    color: #1976d2;
    font-size: 1.05rem;
  }
  .tag-primary { background: #1976d2; color: white; }
  .schedule-slot, .schedule-note {
    color: #555;
    font-size: 0.9rem;
    margin-bottom: 4px;
  }
  .schedule-meta {
    color: #888;
    font-size: 0.85rem;
    margin-top: 8px;
  }
  .revision-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .revision-item {
    background: #f5f5f5;
    padding: 16px;
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
    color: #1976d2;
  }
  .revision-time {
    font-size: 0.85rem;
    color: #888;
  }
  .revision-diff {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
  }
  .revision-label {
    font-size: 0.85rem;
    color: #888;
    margin-right: 8px;
  }
  .revision-old {
    padding: 8px 12px;
    background: #ffebee;
    border-radius: 6px;
    color: #c62828;
    text-decoration: line-through;
  }
  .revision-new {
    padding: 8px 12px;
    background: #e8f5e9;
    border-radius: 6px;
    color: #2e7d32;
  }
  .revision-reason {
    color: #555;
    font-size: 0.9rem;
    margin-bottom: 8px;
  }
  .revision-meta {
    color: #888;
    font-size: 0.85rem;
  }
  .conflict-suggestions {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px dashed #ff9800;
  }
  .conflict-suggestions ul {
    margin-left: 20px;
    margin-top: 8px;
  }
  .conflict-suggestions li {
    margin-bottom: 4px;
  }
  @media (max-width: 768px) {
    .info-grid { grid-template-columns: 1fr; }
    .detail-title-row { flex-direction: column; }
    .detail-header { flex-wrap: wrap; gap: 12px; }
  }
`;
