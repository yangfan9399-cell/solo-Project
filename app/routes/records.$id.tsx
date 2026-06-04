import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, useNavigation, Form, Link, useSearchParams } from "@remix-run/react";
import { db } from "~/db/index.server";
import { eq, desc } from "drizzle-orm";
import { serviceRecords, elders, staff, reviewNodes, changeLogs, users } from "~/db/schema.server";
import type { InferSelectModel } from "drizzle-orm";
import { useState } from "react";

type ServiceRecordDetail = InferSelectModel<typeof serviceRecords> & {
  elder: InferSelectModel<typeof elders>;
  staff: InferSelectModel<typeof staff>;
  operator: InferSelectModel<typeof users>;
  allStaff: InferSelectModel<typeof staff>[];
  allUsers: InferSelectModel<typeof users>[];
  reviewNodes: (InferSelectModel<typeof reviewNodes> & {
    reviewer: InferSelectModel<typeof users> | null;
    operatorUser: InferSelectModel<typeof users> | null;
  })[];
  changeLogs: (InferSelectModel<typeof changeLogs> & {
    user: InferSelectModel<typeof users>;
  })[];
};

type ActionData = {
  success?: boolean;
  error?: string;
};

type OperatorExpandedState = false | "supplement" | "editTime" | "editStaff";
type ReviewerExpandedState = false | "approve" | "rework" | "reject";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const id = params.id;
  if (!id) throw new Error("Record ID is required");

  const recordResult = await db
    .select({
      serviceRecord: serviceRecords,
      elder: elders,
      staff: staff,
      operator: users,
    })
    .from(serviceRecords)
    .leftJoin(elders, eq(serviceRecords.elderId, elders.id))
    .leftJoin(staff, eq(serviceRecords.staffId, staff.id))
    .leftJoin(users, eq(serviceRecords.operatorId, users.id))
    .where(eq(serviceRecords.id, id))
    .limit(1);

  if (recordResult.length === 0) throw new Error("Record not found");

  const reviewNodesRaw = await db
    .select()
    .from(reviewNodes)
    .where(eq(reviewNodes.serviceRecordId, id))
    .orderBy(reviewNodes.nodeOrder);

  const reviewNodesEnriched = await Promise.all(
    reviewNodesRaw.map(async (rn) => {
      const reviewerRows = rn.reviewerId
        ? await db.select().from(users).where(eq(users.id, rn.reviewerId)).limit(1)
        : [];
      const operatorRows = rn.operatorId
        ? await db.select().from(users).where(eq(users.id, rn.operatorId)).limit(1)
        : [];
      return {
        ...rn,
        reviewer: reviewerRows[0] || null,
        operatorUser: operatorRows[0] || null,
      };
    })
  );

  const allStaff = await db.select().from(staff);

  const allUsers = await db.select().from(users);

  const changeLogsResult = await db
    .select({
      changeLog: changeLogs,
      user: users,
    })
    .from(changeLogs)
    .leftJoin(users, eq(changeLogs.userId, users.id))
    .where(eq(changeLogs.serviceRecordId, id))
    .orderBy(desc(changeLogs.createdAt));

  const detail: ServiceRecordDetail = {
    ...recordResult[0].serviceRecord,
    elder: recordResult[0].elder!,
    staff: recordResult[0].staff!,
    operator: recordResult[0].operator!,
    allStaff,
    allUsers,
    reviewNodes: reviewNodesEnriched,
    changeLogs: changeLogsResult.map((c) => ({
      ...c.changeLog,
      user: c.user!,
    })),
  };

  return json({ record: detail });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const id = params.id;
  if (!id) throw new Error("Record ID is required");

  const formData = await request.formData();
  const actionType = formData.get("actionType");
  const reviewNodeId = formData.get("reviewNodeId") as string;
  const currentUserId = formData.get("currentUserId") as string;

  try {
    if (actionType === "supplement") {
      const supplementNotes = formData.get("supplementNotes") as string;
      const supplementReason = formData.get("supplementReason") as string;
      if (!supplementNotes) return json<ActionData>({ error: "请输入补充说明" });
      if (!supplementReason) return json<ActionData>({ error: "请填写采用依据" });

      const existing = await db
        .select()
        .from(reviewNodes)
        .where(eq(reviewNodes.id, reviewNodeId))
        .limit(1);
      if (existing.length === 0) return json<ActionData>({ error: "回访节点不存在" });

      const oldSupplement = existing[0].supplementNotes || "";

      await db
        .update(reviewNodes)
        .set({ supplementNotes })
        .where(eq(reviewNodes.id, reviewNodeId));

      await db.insert(changeLogs).values({
        serviceRecordId: id,
        reviewNodeId,
        userId: currentUserId,
        fieldName: "supplementNotes",
        oldValue: oldSupplement,
        newValue: supplementNotes,
        reason: supplementReason,
      });

      return json<ActionData>({ success: true });
    }

    if (actionType === "approve") {
      const reviewConclusion = formData.get("reviewConclusion") as string;
      const reviewNotes = formData.get("reviewNotes") as string;
      const approveReason = formData.get("approveReason") as string;
      if (!approveReason) return json<ActionData>({ error: "请填写采用依据" });

      const existing = await db
        .select()
        .from(reviewNodes)
        .where(eq(reviewNodes.id, reviewNodeId))
        .limit(1);
      if (existing.length === 0) return json<ActionData>({ error: "回访节点不存在" });

      const oldStatus = existing[0].reviewStatus;

      await db
        .update(reviewNodes)
        .set({
          reviewStatus: "approved",
          reviewConclusion: reviewConclusion || existing[0].reviewConclusion,
          reviewNotes: reviewNotes || existing[0].reviewNotes,
          reviewerId: currentUserId,
          isArchived: true,
          reviewedAt: new Date(),
        })
        .where(eq(reviewNodes.id, reviewNodeId));

      await db
        .update(serviceRecords)
        .set({ status: "archived" })
        .where(eq(serviceRecords.id, id));

      await db.insert(changeLogs).values({
        serviceRecordId: id,
        reviewNodeId,
        userId: currentUserId,
        fieldName: "reviewStatus",
        oldValue: oldStatus,
        newValue: "approved",
        reason: approveReason,
      });

      return json<ActionData>({ success: true });
    }

    if (actionType === "reject") {
      const reviewNotes = formData.get("reviewNotes") as string;
      const rejectReason = formData.get("rejectReason") as string;
      if (!rejectReason) return json<ActionData>({ error: "请填写采用依据" });

      const existing = await db
        .select()
        .from(reviewNodes)
        .where(eq(reviewNodes.id, reviewNodeId))
        .limit(1);
      if (existing.length === 0) return json<ActionData>({ error: "回访节点不存在" });

      const oldStatus = existing[0].reviewStatus;

      await db
        .update(reviewNodes)
        .set({
          reviewStatus: "rejected",
          reviewNotes: reviewNotes || existing[0].reviewNotes,
          reviewerId: currentUserId,
          reviewedAt: new Date(),
        })
        .where(eq(reviewNodes.id, reviewNodeId));

      await db.insert(changeLogs).values({
        serviceRecordId: id,
        reviewNodeId,
        userId: currentUserId,
        fieldName: "reviewStatus",
        oldValue: oldStatus,
        newValue: "rejected",
        reason: rejectReason,
      });

      return json<ActionData>({ success: true });
    }

    if (actionType === "rework") {
      const reviewNotes = formData.get("reviewNotes") as string;
      const reworkReason = formData.get("reworkReason") as string;
      if (!reworkReason) return json<ActionData>({ error: "请填写采用依据" });

      const existing = await db
        .select()
        .from(reviewNodes)
        .where(eq(reviewNodes.id, reviewNodeId))
        .limit(1);
      if (existing.length === 0) return json<ActionData>({ error: "回访节点不存在" });

      const oldStatus = existing[0].reviewStatus;

      await db
        .update(reviewNodes)
        .set({
          reviewStatus: "rework",
          reviewNotes: reviewNotes || existing[0].reviewNotes,
          reviewerId: currentUserId,
          reviewedAt: new Date(),
        })
        .where(eq(reviewNodes.id, reviewNodeId));

      await db.insert(reviewNodes).values({
        serviceRecordId: id,
        parentId: reviewNodeId,
        operatorId: existing[0].operatorId,
        reviewStatus: "pending",
        nodeOrder: existing[0].nodeOrder + 1,
      });

      await db.insert(changeLogs).values({
        serviceRecordId: id,
        reviewNodeId,
        userId: currentUserId,
        fieldName: "reviewStatus",
        oldValue: oldStatus,
        newValue: "rework",
        reason: reworkReason,
      });

      return json<ActionData>({ success: true });
    }

    if (actionType === "editScheduledTime") {
      const newTime = formData.get("newScheduledTime") as string;
      const editReason = formData.get("editReason") as string;
      if (!newTime) return json<ActionData>({ error: "请选择新预约时间" });
      if (!editReason) return json<ActionData>({ error: "请填写修改依据" });

      const existing = await db
        .select()
        .from(serviceRecords)
        .where(eq(serviceRecords.id, id))
        .limit(1);
      if (existing.length === 0) return json<ActionData>({ error: "服务记录不存在" });

      const oldTime = existing[0].scheduledTime;

      await db
        .update(serviceRecords)
        .set({ scheduledTime: new Date(newTime), updatedAt: new Date() })
        .where(eq(serviceRecords.id, id));

      await db.insert(changeLogs).values({
        serviceRecordId: id,
        reviewNodeId: reviewNodeId || null,
        userId: currentUserId,
        fieldName: "scheduledTime",
        oldValue: oldTime.toISOString(),
        newValue: new Date(newTime).toISOString(),
        reason: editReason,
      });

      return json<ActionData>({ success: true });
    }

    if (actionType === "editStaff") {
      const newStaffId = formData.get("newStaffId") as string;
      const editReason = formData.get("editReason") as string;
      if (!newStaffId) return json<ActionData>({ error: "请选择服务人员" });
      if (!editReason) return json<ActionData>({ error: "请填写修改依据" });

      const existing = await db
        .select()
        .from(serviceRecords)
        .where(eq(serviceRecords.id, id))
        .limit(1);
      if (existing.length === 0) return json<ActionData>({ error: "服务记录不存在" });

      const oldStaffId = existing[0].staffId;

      await db
        .update(serviceRecords)
        .set({ staffId: newStaffId, updatedAt: new Date() })
        .where(eq(serviceRecords.id, id));

      await db.insert(changeLogs).values({
        serviceRecordId: id,
        reviewNodeId: reviewNodeId || null,
        userId: currentUserId,
        fieldName: "staffId",
        oldValue: oldStaffId,
        newValue: newStaffId,
        reason: editReason,
      });

      return json<ActionData>({ success: true });
    }

    return json<ActionData>({ success: true });
  } catch (error) {
    console.error("Action error:", error);
    return json<ActionData>({ error: "操作失败" });
  }
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  scheduled: { label: "待上门", className: "bg-blue-100 text-blue-800" },
  in_progress: { label: "进行中", className: "bg-yellow-100 text-yellow-800" },
  completed: { label: "已完成", className: "bg-green-100 text-green-800" },
  no_answer: { label: "未接听", className: "bg-orange-100 text-orange-800" },
  time_conflict: { label: "时长冲突", className: "bg-purple-100 text-purple-800" },
  complaint: { label: "家属投诉", className: "bg-red-100 text-red-800" },
  archived: { label: "已归档", className: "bg-gray-100 text-gray-800" },
};

const REVIEW_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "待复核", className: "bg-yellow-100 text-yellow-800" },
  approved: { label: "已通过", className: "bg-green-100 text-green-800" },
  rejected: { label: "已驳回", className: "bg-red-100 text-red-800" },
  rework: { label: "需返工", className: "bg-orange-100 text-orange-800" },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || { label: status, className: "bg-gray-100 text-gray-800" };
  return (
    <span className={`px-3 py-1 text-sm font-medium rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}

function ReviewStatusBadge({ status }: { status: string }) {
  const config = REVIEW_STATUS_CONFIG[status] || { label: status, className: "bg-gray-100 text-gray-800" };
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}

const FIELD_LABELS: Record<string, string> = {
  scheduledTime: "预约时间",
  staffId: "服务人员",
  reviewStatus: "回访状态",
  reviewConclusion: "回访结论",
  supplementNotes: "补充说明",
};

function formatChangeValue(field: string, value: any, allStaff?: InferSelectModel<typeof staff>[]) {
  if (!value) return "-";
  if (field === "scheduledTime") return new Date(value as string).toLocaleString("zh-CN");
  if (field === "staffId" && allStaff) {
    const s = allStaff.find((st) => st.id === value);
    return s ? s.name : String(value);
  }
  if (field === "reviewStatus") return REVIEW_STATUS_CONFIG[value as string]?.label || String(value);
  return String(value);
}

function ChangeLogDiff({
  changeLog,
  allStaff,
}: {
  changeLog: ServiceRecordDetail["changeLogs"][0];
  allStaff: InferSelectModel<typeof staff>[];
}) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm font-medium text-gray-900">
          {FIELD_LABELS[changeLog.fieldName] || changeLog.fieldName}
        </span>
        <div className="text-xs text-gray-500 text-right">
          <span className="font-medium text-blue-700">{changeLog.user.name}</span>
          <span className="mx-1">·</span>
          <span>{new Date(changeLog.createdAt).toLocaleString("zh-CN")}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <div className="flex-1 p-2 bg-red-50 rounded border border-red-200">
          <span className="text-red-600 font-medium mr-1">-</span>
          <span className="text-red-800">
            {formatChangeValue(changeLog.fieldName, changeLog.oldValue, allStaff)}
          </span>
        </div>
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
        <div className="flex-1 p-2 bg-green-50 rounded border border-green-200">
          <span className="text-green-600 font-medium mr-1">+</span>
          <span className="text-green-800">
            {formatChangeValue(changeLog.fieldName, changeLog.newValue, allStaff)}
          </span>
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-600 bg-white p-2 rounded border border-gray-200">
        <span className="font-medium">采用依据：</span>
        {changeLog.reason}
      </div>
    </div>
  );
}

function ReviewNodeTimeline({
  node,
  isLatest,
  isArchived,
  currentRole,
  currentUserId,
  allStaff,
}: {
  node: ServiceRecordDetail["reviewNodes"][0];
  isLatest: boolean;
  isArchived: boolean;
  currentRole: string;
  currentUserId: string;
  allStaff: InferSelectModel<typeof staff>[];
}) {
  const actionData = useActionData<ActionData>();
  const [operatorExpanded, setOperatorExpanded] = useState<OperatorExpandedState>(false);
  const [reviewerExpanded, setReviewerExpanded] = useState<ReviewerExpandedState>(false);

  const borderColor =
    node.reviewStatus === "approved"
      ? "border-green-300 bg-green-50"
      : node.reviewStatus === "rejected"
      ? "border-red-300 bg-red-50"
      : node.reviewStatus === "rework"
      ? "border-orange-300 bg-orange-50"
      : "border-gray-200 bg-white";

  const canOperatorAct = isLatest && !isArchived && currentRole === "operator" && node.reviewStatus === "pending";
  const canReviewerAct = isLatest && !isArchived && currentRole === "reviewer" && node.reviewStatus === "pending";

  return (
    <div className={`p-5 rounded-lg border-2 ${borderColor} relative`}>
      <div className="absolute -left-3 top-5 w-6 h-6 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center">
        <span className="text-xs font-bold text-gray-500">{node.nodeOrder}</span>
      </div>

      <div className="flex items-start justify-between mb-3 ml-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">第 {node.nodeOrder} 次回访</span>
          <ReviewStatusBadge status={node.reviewStatus} />
        </div>
        <div className="text-xs text-gray-500">
          {node.reviewer && <span>复核人：{node.reviewer.name}</span>}
          {node.operatorUser && (
            <span className="ml-2">经办人：{node.operatorUser.name}</span>
          )}
        </div>
      </div>

      {node.reviewConclusion && (
        <div className="mb-3 ml-2">
          <div className="text-sm font-medium text-gray-700 mb-1">回访结论：</div>
          <div className="text-sm text-gray-900 p-2 bg-white rounded border">{node.reviewConclusion}</div>
        </div>
      )}

      {node.reviewNotes && (
        <div className="mb-3 ml-2">
          <div className="text-sm font-medium text-gray-700 mb-1">复核意见：</div>
          <div className="text-sm text-gray-600 p-2 bg-white rounded border">{node.reviewNotes}</div>
        </div>
      )}

      {node.supplementNotes && (
        <div className="mb-3 ml-2">
          <div className="text-sm font-medium text-gray-700 mb-1">补充说明：</div>
          <div className="text-sm text-gray-600 p-2 bg-white rounded border">{node.supplementNotes}</div>
        </div>
      )}

      {isArchived && (
        <div className="mt-3 ml-2 p-3 bg-gray-100 rounded-lg text-sm text-gray-500 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          已归档，此记录只读
        </div>
      )}

      {node.reviewStatus === "rework" && !isArchived && currentRole === "operator" && !isLatest && (
        <div className="mt-3 ml-2 p-3 bg-orange-50 rounded-lg text-sm text-orange-700 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          已退回补证，请在最新回访节点补充材料
        </div>
      )}

      {canOperatorAct && (
        <div className="mt-4 ml-2">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-blue-800">经办人操作区</span>
            </div>

            {!operatorExpanded && (
              <div className="flex gap-2">
                <button onClick={() => setOperatorExpanded("supplement")} className="btn btn-primary text-sm">
                  补充服务记录
                </button>
                <button onClick={() => setOperatorExpanded("editTime")} className="btn btn-secondary text-sm">
                  修改预约时间
                </button>
                <button onClick={() => setOperatorExpanded("editStaff")} className="btn btn-secondary text-sm">
                  变更服务人员
                </button>
              </div>
            )}

            {operatorExpanded === "supplement" && (
              <Form method="post" className="space-y-3">
                <input type="hidden" name="actionType" value="supplement" />
                <input type="hidden" name="reviewNodeId" value={node.id} />
                <input type="hidden" name="currentUserId" value={currentUserId} />
                <div>
                  <label className="label">补充说明</label>
                  <textarea name="supplementNotes" className="input" rows={3} placeholder="请输入补充说明..." required />
                </div>
                <div>
                  <label className="label">采用依据</label>
                  <input name="supplementReason" className="input" placeholder="请填写补充依据（必填）" required />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary text-sm">提交</button>
                  <button type="button" onClick={() => setOperatorExpanded(false)} className="btn btn-secondary text-sm">取消</button>
                </div>
                {actionData?.error && <p className="text-red-600 text-sm">{actionData.error}</p>}
              </Form>
            )}

            {operatorExpanded === "editTime" && (
              <Form method="post" className="space-y-3">
                <input type="hidden" name="actionType" value="editScheduledTime" />
                <input type="hidden" name="reviewNodeId" value={node.id} />
                <input type="hidden" name="currentUserId" value={currentUserId} />
                <div>
                  <label className="label">新预约时间</label>
                  <input type="datetime-local" name="newScheduledTime" className="input" required />
                </div>
                <div>
                  <label className="label">修改依据</label>
                  <input name="editReason" className="input" placeholder="请填写修改依据（必填）" required />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary text-sm">确认修改</button>
                  <button type="button" onClick={() => setOperatorExpanded(false)} className="btn btn-secondary text-sm">取消</button>
                </div>
              </Form>
            )}

            {operatorExpanded === "editStaff" && (
              <Form method="post" className="space-y-3">
                <input type="hidden" name="actionType" value="editStaff" />
                <input type="hidden" name="reviewNodeId" value={node.id} />
                <input type="hidden" name="currentUserId" value={currentUserId} />
                <div>
                  <label className="label">新服务人员</label>
                  <select name="newStaffId" className="input" required>
                    <option value="">请选择服务人员</option>
                    {allStaff.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">修改依据</label>
                  <input name="editReason" className="input" placeholder="请填写变更依据（必填）" required />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary text-sm">确认变更</button>
                  <button type="button" onClick={() => setOperatorExpanded(false)} className="btn btn-secondary text-sm">取消</button>
                </div>
              </Form>
            )}
          </div>
        </div>
      )}

      {canReviewerAct && (
        <div className="mt-4 ml-2">
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-amber-600 rounded flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-amber-800">复核人操作区</span>
            </div>

            {!reviewerExpanded && (
              <div className="flex gap-2">
                <button onClick={() => setReviewerExpanded("approve")} className="btn btn-success text-sm">
                  确认通过
                </button>
                <button onClick={() => setReviewerExpanded("rework")} className="btn btn-warning text-sm">
                  退回补证
                </button>
                <button onClick={() => setReviewerExpanded("reject")} className="btn btn-danger text-sm">
                  驳回
                </button>
              </div>
            )}

            {reviewerExpanded === "approve" && (
              <Form method="post" className="space-y-3">
                <input type="hidden" name="actionType" value="approve" />
                <input type="hidden" name="reviewNodeId" value={node.id} />
                <input type="hidden" name="currentUserId" value={currentUserId} />
                <div>
                  <label className="label">回访结论</label>
                  <input name="reviewConclusion" className="input" placeholder="请输入回访结论..." />
                </div>
                <div>
                  <label className="label">复核意见</label>
                  <textarea name="reviewNotes" className="input" rows={2} placeholder="请输入复核意见..." />
                </div>
                <div>
                  <label className="label">采用依据</label>
                  <input name="approveReason" className="input" placeholder="请填写通过依据（必填）" required />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-success text-sm">确认通过并归档</button>
                  <button type="button" onClick={() => setReviewerExpanded(false)} className="btn btn-secondary text-sm">取消</button>
                </div>
              </Form>
            )}

            {reviewerExpanded === "rework" && (
              <Form method="post" className="space-y-3">
                <input type="hidden" name="actionType" value="rework" />
                <input type="hidden" name="reviewNodeId" value={node.id} />
                <input type="hidden" name="currentUserId" value={currentUserId} />
                <div>
                  <label className="label">复核意见</label>
                  <textarea name="reviewNotes" className="input" rows={2} placeholder="请说明退回原因..." />
                </div>
                <div>
                  <label className="label">采用依据</label>
                  <input name="reworkReason" className="input" placeholder="请填写退回依据（必填）" required />
                </div>
                <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
                  退回补证将自动生成新的回访节点，经办人需在新节点中补充材料
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-warning text-sm">确认退回</button>
                  <button type="button" onClick={() => setReviewerExpanded(false)} className="btn btn-secondary text-sm">取消</button>
                </div>
              </Form>
            )}

            {reviewerExpanded === "reject" && (
              <Form method="post" className="space-y-3">
                <input type="hidden" name="actionType" value="reject" />
                <input type="hidden" name="reviewNodeId" value={node.id} />
                <input type="hidden" name="currentUserId" value={currentUserId} />
                <div>
                  <label className="label">驳回意见</label>
                  <textarea name="reviewNotes" className="input" rows={2} placeholder="请说明驳回原因..." />
                </div>
                <div>
                  <label className="label">采用依据</label>
                  <input name="rejectReason" className="input" placeholder="请填写驳回依据（必填）" required />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-danger text-sm">确认驳回</button>
                  <button type="button" onClick={() => setReviewerExpanded(false)} className="btn btn-secondary text-sm">取消</button>
                </div>
              </Form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RecordDetail() {
  const { record } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const [searchParams, setSearchParams] = useSearchParams();

  const reviewerUser = record.allUsers.find((u) => u.role === "reviewer");
  const currentRole = searchParams.get("role") || "operator";
  const currentUserId =
    searchParams.get("userId") ||
    (currentRole === "reviewer" && reviewerUser ? reviewerUser.id : record.operator.id);

  const formatDateTime = (date: Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("zh-CN");
  };

  const isArchived = record.status === "archived";
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-gray-600 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">服务记录详情</h1>
                <p className="text-sm text-gray-500">记录编号：{record.id.slice(0, 8)}...</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => {
                    setSearchParams({ role: "operator", userId: record.operator.id });
                  }}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    currentRole === "operator"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  经办人视角
                </button>
                <button
                  onClick={() => {
                    setSearchParams({ role: "reviewer", userId: reviewerUser?.id || "" });
                  }}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    currentRole === "reviewer"
                      ? "bg-amber-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  复核人视角
                </button>
              </div>
              <StatusBadge status={record.status} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {actionData?.success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            操作成功
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">照护记录</h2>
                {isArchived && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">只读</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">老人信息</div>
                  <div className="font-medium text-gray-900">{record.elder.name}</div>
                  <div className="text-sm text-gray-600">{record.elder.age}岁 · {record.elder.gender}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">联系电话</div>
                  <div className="font-medium text-gray-900">{record.elder.phone}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-sm text-gray-500 mb-1">居住地址</div>
                  <div className="font-medium text-gray-900">{record.elder.address}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">服务类型</div>
                  <div className="font-medium text-gray-900">{record.serviceType}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">服务人员</div>
                  <div className="font-medium text-gray-900">{record.staff.name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">预约时间</div>
                  <div className="font-medium text-gray-900">{formatDateTime(record.scheduledTime)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">实际开始</div>
                  <div className="font-medium text-gray-900">{formatDateTime(record.actualStartTime)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">实际结束</div>
                  <div className="font-medium text-gray-900">{formatDateTime(record.actualEndTime)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">服务时长</div>
                  <div className="font-medium text-gray-900">
                    {record.actualStartTime && record.actualEndTime
                      ? `${Math.round((new Date(record.actualEndTime).getTime() - new Date(record.actualStartTime).getTime()) / 60000)} 分钟`
                      : "-"}
                  </div>
                </div>
              </div>

              {record.serviceNotes && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-500 mb-1">服务备注</div>
                  <div className="text-gray-700">{record.serviceNotes}</div>
                </div>
              )}
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">回访节点</h2>
              <div className="relative ml-3">
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-200" />
                <div className="space-y-6">
                  {record.reviewNodes.map((node, index) => (
                    <ReviewNodeTimeline
                      key={node.id}
                      node={node}
                      isLatest={index === record.reviewNodes.length - 1}
                      isArchived={isArchived}
                      currentRole={currentRole}
                      currentUserId={currentUserId}
                      allStaff={record.allStaff}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">修改历史</h2>
              {record.changeLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  暂无修改记录
                </div>
              ) : (
                <div className="space-y-3">
                  {record.changeLogs.map((log) => (
                    <ChangeLogDiff key={log.id} changeLog={log} allStaff={record.allStaff} />
                  ))}
                </div>
              )}
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">健康信息</h2>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500 mb-1">健康备注</div>
                  <div className="text-sm text-gray-700">{record.elder.healthNotes || "无"}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">紧急联系人</div>
                  <div className="text-sm text-gray-700">{record.elder.emergencyContact || "无"}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">紧急联系电话</div>
                  <div className="text-sm text-gray-700">{record.elder.emergencyPhone || "无"}</div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">经办人信息</h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900">{record.operator.name}</div>
                  <div className="text-sm text-gray-500">
                    {record.operator.role === "operator" ? "经办人" : record.operator.role === "reviewer" ? "复核人" : "管理员"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
