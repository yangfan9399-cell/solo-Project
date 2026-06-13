import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData, useSubmit } from "@remix-run/react";
import { useRef, useState } from "react";
import { getPlanDetail, processPlan, submitForReview } from "~/lib/workflow";

export async function loader({ params }: { params: { id: string } }) {
  const { plan, nodes } = await getPlanDetail(params.id);
  if (!plan) {
    throw new Response("计划不存在", { status: 404 });
  }
  if (plan.isArchived) {
    throw new Response("已归档的计划不可操作", { status: 403 });
  }
  const returnNode = [...nodes]
    .reverse()
    .find((n) => n.action === "review_return");
  return json({ plan, returnNode });
}

export async function action({
  request,
  params,
}: {
  request: Request;
  params: { id: string };
}) {
  const planId = params.id;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "submit_review") {
    await submitForReview(planId, "applicant_001", "张申请人");
    return redirect(`/plans/${planId}`);
  }

  const businessRecord = formData.get("businessRecord") as string;
  const onsiteDescription = formData.get("onsiteDescription") as string;
  const evidenceConclusion = formData.get("evidenceConclusion") as string;
  const basisReference = formData.get("basisReference") as string;
  const actualStartTime = formData.get("actualStartTime") as string;
  const actualEndTime = formData.get("actualEndTime") as string;
  const affectedUsersStr = formData.get("affectedUsers") as string;
  const attachmentsRaw = formData.get("attachments") as string;

  const data: Parameters<typeof processPlan>[4] = {
    businessRecord,
    onsiteDescription,
    evidenceConclusion,
    basisReference,
    actualStartTime: actualStartTime || undefined,
    actualEndTime: actualEndTime || undefined,
    affectedUsers: affectedUsersStr ? Number(affectedUsersStr) : undefined,
  };

  if (attachmentsRaw) {
    try {
      data.attachments = JSON.parse(attachmentsRaw);
    } catch {}
  }

  await processPlan(planId, "applicant_001", "张申请人", "applicant", data);
  return redirect(`/plans/${planId}`);
}

const statusLabels: Record<string, string> = {
  accepted: "已受理",
  processing: "处理中",
  reviewing: "复核中",
  archived: "已归档",
  returned: "已退回",
  reprocessing: "重新处理",
};

const statusStyles: Record<string, string> = {
  accepted: "bg-blue-100 text-blue-800",
  processing: "bg-yellow-100 text-yellow-800",
  reviewing: "bg-purple-100 text-purple-800",
  archived: "bg-green-100 text-green-800",
  returned: "bg-red-100 text-red-800",
  reprocessing: "bg-orange-100 text-orange-800",
};

function StatusBadge({ status }: { status: string }) {
  const style = statusStyles[status] || "bg-gray-100 text-gray-800";
  const label = statusLabels[status] || status;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {label}
    </span>
  );
}

function toDateTimeLocal(value: Date | string | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface AttachmentEntry {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
}

export default function PlanProcessPage() {
  const { plan, returnNode } = useLoaderData<typeof loader>();
  const [attachments, setAttachments] = useState<AttachmentEntry[]>([]);
  const nextId = useRef(0);
  const submit = useSubmit();

  const addAttachment = () => {
    setAttachments((prev) => [
      ...prev,
      { id: nextId.current++, fileName: "", fileUrl: "", fileType: "photo" },
    ]);
  };

  const removeAttachment = (id: number) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const updateAttachment = (
    id: number,
    field: keyof AttachmentEntry,
    value: string
  ) => {
    setAttachments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const validAttachments = attachments.filter(
      (a) => a.fileName && a.fileUrl
    );
    if (validAttachments.length > 0) {
      formData.set(
        "attachments",
        JSON.stringify(
          validAttachments.map((a) => ({
            fileName: a.fileName,
            fileUrl: a.fileUrl,
            fileType: a.fileType,
          }))
        )
      );
    }
    submit(formData, { method: "post" });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">处理工作台</h1>
          <StatusBadge status={plan.status} />
        </div>
        <a
          href={`/plans/${plan.id}`}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          返回详情
        </a>
      </div>

      <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
        <span className="text-sm font-medium text-blue-800">
          当前角色: 申请人
        </span>
        <span className="ml-4 text-sm text-blue-700">
          计划: {plan.title} ({plan.planCode})
        </span>
      </div>

      {plan.status === "returned" && returnNode && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm font-medium text-red-800">退回原因</p>
          <p className="mt-1 text-sm text-red-700">
            {returnNode.comment || "未填写退回原因"}
          </p>
        </div>
      )}

      <Form method="post" onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div className="rounded-lg bg-white shadow">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">业务信息</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label
                  htmlFor="businessRecord"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  业务记录
                </label>
                <textarea
                  id="businessRecord"
                  name="businessRecord"
                  rows={4}
                  defaultValue={plan.businessRecord || ""}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="onsiteDescription"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  现场说明
                </label>
                <textarea
                  id="onsiteDescription"
                  name="onsiteDescription"
                  rows={4}
                  defaultValue={plan.onsiteDescription || ""}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="evidenceConclusion"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  取证结论
                </label>
                <textarea
                  id="evidenceConclusion"
                  name="evidenceConclusion"
                  rows={3}
                  defaultValue={plan.evidenceConclusion || ""}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="basisReference"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  依据参考
                </label>
                <input
                  id="basisReference"
                  name="basisReference"
                  type="text"
                  defaultValue={plan.basisReference || ""}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white shadow">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">时间与影响</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="actualStartTime"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    实际开始时间
                  </label>
                  <input
                    id="actualStartTime"
                    name="actualStartTime"
                    type="datetime-local"
                    defaultValue={toDateTimeLocal(plan.actualStartTime)}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="actualEndTime"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    实际结束时间
                  </label>
                  <input
                    id="actualEndTime"
                    name="actualEndTime"
                    type="datetime-local"
                    defaultValue={toDateTimeLocal(plan.actualEndTime)}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="affectedUsers"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  影响用户数
                </label>
                <input
                  id="affectedUsers"
                  name="affectedUsers"
                  type="number"
                  min={0}
                  defaultValue={plan.affectedUsers ?? ""}
                  className="block w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white shadow">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">附件</h2>
            </div>
            <div className="px-6 py-4 space-y-3">
              {attachments.length === 0 && (
                <p className="text-sm text-gray-500">暂未添加附件</p>
              )}
              {attachments.map((att) => (
                <div key={att.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="文件名"
                    value={att.fileName}
                    onChange={(e) =>
                      updateAttachment(att.id, "fileName", e.target.value)
                    }
                    className="block rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="文件URL"
                    value={att.fileUrl}
                    onChange={(e) =>
                      updateAttachment(att.id, "fileUrl", e.target.value)
                    }
                    className="block flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <select
                    value={att.fileType}
                    onChange={(e) =>
                      updateAttachment(att.id, "fileType", e.target.value)
                    }
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="photo">照片</option>
                    <option value="document">文档</option>
                    <option value="video">视频</option>
                    <option value="other">其他</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeAttachment(att.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    删除
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addAttachment}
                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-medium text-blue-600 border border-blue-300 hover:bg-blue-50"
              >
                + 添加附件
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <a
              href={`/plans/${plan.id}`}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              取消
            </a>
            <button
              type="submit"
              name="intent"
              value="process"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              保存处理
            </button>
            <button
              type="submit"
              name="intent"
              value="submit_review"
              className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
            >
              提交复核
            </button>
          </div>
        </div>
      </Form>
    </div>
  );
}
