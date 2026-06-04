import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, Form, Link } from "@remix-run/react";
import { db } from "~/db/index.server";
import { eq, desc } from "drizzle-orm";
import { serviceRecords, elders, staff, reviewNodes, changeLogs, users } from "~/db/schema.server";
import type { InferSelectModel } from "drizzle-orm";
import { useState } from "react";

type ServiceRecordDetail = InferSelectModel<typeof serviceRecords> & {
  elder: InferSelectModel<typeof elders>;
  staff: InferSelectModel<typeof staff>;
  operator: InferSelectModel<typeof users>;
  reviewNodes: (InferSelectModel<typeof reviewNodes> & {
    reviewer: InferSelectModel<typeof users> | null;
    operatorNode: InferSelectModel<typeof users> | null;
  })[];
  changeLogs: (InferSelectModel<typeof changeLogs> & {
    user: InferSelectModel<typeof users>;
  })[];
};

type ActionData = {
  success?: boolean;
  error?: string;
};

export async function loader({ params }: LoaderFunctionArgs) {
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

  const reviewNodesResult = await db
    .select({
      reviewNode: reviewNodes,
      reviewer: users,
    })
    .from(reviewNodes)
    .leftJoin(users, eq(reviewNodes.reviewerId, users.id))
    .where(eq(reviewNodes.serviceRecordId, id))
    .orderBy(reviewNodes.nodeOrder);

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
    reviewNodes: reviewNodesResult.map((r) => ({
      ...r.reviewNode,
      reviewer: r.reviewer || null,
      operatorNode: null,
    })),
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

  try {
    if (actionType === "supplement") {
      const supplementNotes = formData.get("supplementNotes") as string;
      if (!supplementNotes) {
        return json<ActionData>({ error: "请输入补充说明" });
      }

      await db
        .update(reviewNodes)
        .set({
          supplementNotes,
        })
        .where(eq(reviewNodes.id, reviewNodeId));

      return json<ActionData>({ success: true });
    }

    if (actionType === "approve") {
      const reviewConclusion = formData.get("reviewConclusion") as string;
      const reviewNotes = formData.get("reviewNotes") as string;

      await db
        .update(reviewNodes)
        .set({
          reviewStatus: "approved",
          reviewConclusion,
          reviewNotes,
          isArchived: true,
          reviewedAt: new Date(),
        })
        .where(eq(reviewNodes.id, reviewNodeId));

      await db
        .update(serviceRecords)
        .set({ status: "archived" })
        .where(eq(serviceRecords.id, id));

      return json<ActionData>({ success: true });
    }

    if (actionType === "reject") {
      const reviewNotes = formData.get("reviewNotes") as string;

      await db
        .update(reviewNodes)
        .set({
          reviewStatus: "rejected",
          reviewNotes,
          reviewedAt: new Date(),
        })
        .where(eq(reviewNodes.id, reviewNodeId));

      return json<ActionData>({ success: true });
    }

    if (actionType === "rework") {
      const reviewNotes = formData.get("reviewNotes") as string;

      const currentNode = await db
        .select()
        .from(reviewNodes)
        .where(eq(reviewNodes.id, reviewNodeId))
        .limit(1);

      if (currentNode.length === 0) {
        return json<ActionData>({ error: "回访节点不存在" });
      }

      await db
        .update(reviewNodes)
        .set({
          reviewStatus: "rework",
          reviewNotes,
          reviewedAt: new Date(),
        })
        .where(eq(reviewNodes.id, reviewNodeId));

      await db.insert(reviewNodes).values({
        serviceRecordId: id,
        parentId: reviewNodeId,
        operatorId: currentNode[0].operatorId,
        reviewStatus: "pending",
        nodeOrder: currentNode[0].nodeOrder + 1,
      });

      return json<ActionData>({ success: true });
    }

    return json<ActionData>({ success: true });
  } catch (error) {
    return json<ActionData>({ error: "操作失败" });
  }
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    scheduled: { label: "待上门", className: "bg-blue-100 text-blue-800" },
    in_progress: { label: "进行中", className: "bg-yellow-100 text-yellow-800" },
    completed: { label: "已完成", className: "bg-green-100 text-green-800" },
    no_answer: { label: "未接听", className: "bg-orange-100 text-orange-800" },
    time_conflict: { label: "时长冲突", className: "bg-purple-100 text-purple-800" },
    complaint: { label: "家属投诉", className: "bg-red-100 text-red-800" },
    archived: { label: "已归档", className: "bg-gray-100 text-gray-800" },
  };

  const config = statusConfig[status] || {
    label: status,
    className: "bg-gray-100 text-gray-800",
  };

  return (
    <span className={`px-3 py-1 text-sm font-medium rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}

function ReviewStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    pending: { label: "待复核", className: "bg-yellow-100 text-yellow-800" },
    approved: { label: "已通过", className: "bg-green-100 text-green-800" },
    rejected: { label: "已驳回", className: "bg-red-100 text-red-800" },
    rework: { label: "需返工", className: "bg-orange-100 text-orange-800" },
  };

  const config = statusConfig[status] || {
    label: status,
    className: "bg-gray-100 text-gray-800",
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}

function ChangeLogDiff({
  changeLog,
}: {
  changeLog: ServiceRecordDetail["changeLogs"][0];
}) {
  const fieldLabels: Record<string, string> = {
    scheduledTime: "预约时间",
    staffId: "服务人员",
    reviewStatus: "回访状态",
    reviewConclusion: "回访结论",
  };

  const formatValue = (field: string, value: any) => {
    if (!value) return "-";
    if (field === "scheduledTime") {
      return new Date(value).toLocaleString("zh-CN");
    }
    return String(value);
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm font-medium text-gray-900">
          {fieldLabels[changeLog.fieldName] || changeLog.fieldName}
        </span>
        <span className="text-xs text-gray-500">
          {changeLog.user.name} ·{" "}
          {new Date(changeLog.createdAt).toLocaleString("zh-CN")}
        </span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <div className="flex-1 p-2 bg-red-50 rounded border border-red-200">
          <span className="text-red-600 font-medium">-</span>{" "}
          <span className="text-red-800">
            {formatValue(changeLog.fieldName, changeLog.oldValue)}
          </span>
        </div>
        <svg
          className="w-4 h-4 text-gray-400 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14 5l7 7m0 0l-7 7m7-7H3"
          />
        </svg>
        <div className="flex-1 p-2 bg-green-50 rounded border border-green-200">
          <span className="text-green-600 font-medium">+</span>{" "}
          <span className="text-green-800">
            {formatValue(changeLog.fieldName, changeLog.newValue)}
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

function ReviewNodeCard({
  node,
  isLatest,
  isArchived,
}: {
  node: ServiceRecordDetail["reviewNodes"][0];
  isLatest: boolean;
  isArchived: boolean;
}) {
  const actionData = useActionData<ActionData>();
  const [showSupplement, setShowSupplement] = useState(false);
  const [showReview, setShowReview] = useState(false);

  return (
    <div
      className={`p-4 rounded-lg border-2 ${
        node.reviewStatus === "approved"
          ? "border-green-200 bg-green-50"
          : node.reviewStatus === "rejected"
          ? "border-red-200 bg-red-50"
          : node.reviewStatus === "rework"
          ? "border-orange-200 bg-orange-50"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500">
            第 {node.nodeOrder} 次回访
          </span>
          <ReviewStatusBadge status={node.reviewStatus} />
        </div>
        {node.reviewer && (
          <span className="text-xs text-gray-500">
            复核人：{node.reviewer.name}
          </span>
        )}
      </div>

      {node.reviewConclusion && (
        <div className="mb-3">
          <div className="text-sm font-medium text-gray-700 mb-1">回访结论：</div>
          <div className="text-sm text-gray-900 p-2 bg-white rounded border">
            {node.reviewConclusion}
          </div>
        </div>
      )}

      {node.reviewNotes && (
        <div className="mb-3">
          <div className="text-sm font-medium text-gray-700 mb-1">复核意见：</div>
          <div className="text-sm text-gray-600 p-2 bg-white rounded border">
            {node.reviewNotes}
          </div>
        </div>
      )}

      {node.supplementNotes && (
        <div className="mb-3">
          <div className="text-sm font-medium text-gray-700 mb-1">补充说明：</div>
          <div className="text-sm text-gray-600 p-2 bg-white rounded border">
            {node.supplementNotes}
          </div>
        </div>
      )}

      {isLatest && !isArchived && (
        <div className="mt-4 space-y-3">
          {node.reviewStatus === "pending" && (
            <>
              {!showSupplement && !showReview && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowSupplement(true)}
                    className="btn btn-secondary text-sm"
                  >
                    补充服务记录
                  </button>
                  <button
                    onClick={() => setShowReview(true)}
                    className="btn btn-primary text-sm"
                  >
                    复核操作
                  </button>
                </div>
              )}

              {showSupplement && (
                <Form method="post" className="space-y-3">
                  <input type="hidden" name="actionType" value="supplement" />
                  <input type="hidden" name="reviewNodeId" value={node.id} />
                  <div>
                    <label className="label">补充说明</label>
                    <textarea
                      name="supplementNotes"
                      className="input"
                      rows={3}
                      placeholder="请输入补充说明..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn btn-primary text-sm">
                      提交
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSupplement(false)}
                      className="btn btn-secondary text-sm"
                    >
                      取消
                    </button>
                  </div>
                  {actionData?.error && (
                    <p className="text-red-600 text-sm">{actionData.error}</p>
                  )}
                </Form>
              )}

              {showReview && (
                <Form method="post" className="space-y-3">
                  <input type="hidden" name="reviewNodeId" value={node.id} />
                  <div>
                    <label className="label">回访结论</label>
                    <input
                      type="text"
                      name="reviewConclusion"
                      className="input"
                      placeholder="请输入回访结论..."
                    />
                  </div>
                  <div>
                    <label className="label">复核意见</label>
                    <textarea
                      name="reviewNotes"
                      className="input"
                      rows={3}
                      placeholder="请输入复核意见..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      name="actionType"
                      value="approve"
                      className="btn btn-success text-sm"
                    >
                      通过并归档
                    </button>
                    <button
                      type="submit"
                      name="actionType"
                      value="reject"
                      className="btn btn-danger text-sm"
                    >
                      驳回
                    </button>
                    <button
                      type="submit"
                      name="actionType"
                      value="rework"
                      className="btn btn-warning text-sm"
                    >
                      退回补证
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReview(false)}
                      className="btn btn-secondary text-sm"
                    >
                      取消
                    </button>
                  </div>
                </Form>
              )}
            </>
          )}

          {node.reviewStatus === "rework" && (
            <div className="text-sm text-orange-700">
              已退回补证，请等待经办人补充后处理
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RecordDetail() {
  const { record } = useLoaderData<typeof loader>();

  const formatDateTime = (date: Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("zh-CN");
  };

  const isArchived = record.status === "archived";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-gray-600 hover:text-gray-900">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">服务记录详情</h1>
              <p className="text-sm text-gray-500">
                记录编号：{record.id.slice(0, 8)}...
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-gray-900">基本信息</h2>
                  <StatusBadge status={record.status} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">老人信息</div>
                  <div className="font-medium text-gray-900">{record.elder.name}</div>
                  <div className="text-sm text-gray-600">
                    {record.elder.age}岁 · {record.elder.gender}
                  </div>
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
                  <div className="font-medium text-gray-900">
                    {formatDateTime(record.scheduledTime)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">实际开始</div>
                  <div className="font-medium text-gray-900">
                    {formatDateTime(record.actualStartTime)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">实际结束</div>
                  <div className="font-medium text-gray-900">
                    {formatDateTime(record.actualEndTime)}
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
              <div className="space-y-4">
                {record.reviewNodes.map((node, index) => (
                  <ReviewNodeCard
                    key={node.id}
                    node={node}
                    isLatest={index === record.reviewNodes.length - 1}
                    isArchived={isArchived}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">修改历史</h2>
              {record.changeLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg
                    className="w-12 h-12 mx-auto mb-2 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  暂无修改记录
                </div>
              ) : (
                <div className="space-y-3">
                  {record.changeLogs.map((log) => (
                    <ChangeLogDiff key={log.id} changeLog={log} />
                  ))}
                </div>
              )}
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">健康信息</h2>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500 mb-1">健康备注</div>
                  <div className="text-sm text-gray-700">
                    {record.elder.healthNotes || "无"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">紧急联系人</div>
                  <div className="text-sm text-gray-700">
                    {record.elder.emergencyContact || "无"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">紧急联系电话</div>
                  <div className="text-sm text-gray-700">
                    {record.elder.emergencyPhone || "无"}
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">经办人信息</h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900">{record.operator.name}</div>
                  <div className="text-sm text-gray-500">
                    {record.operator.role === "operator" ? "经办人" : "管理员"}
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
