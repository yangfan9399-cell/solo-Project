import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, Link, Form, useNavigation } from "@remix-run/react";
import {
  getApplicationDetail,
  advanceWorkflow,
  assertNotArchived,
  assertReviewerOnly,
} from "~/lib/queries.server";
import type { AppStatus } from "~/lib/types";
import StatusBadge from "~/components/StatusBadge";
import Timeline from "~/components/Timeline";
import DiffViewer from "~/components/DiffViewer";

export const meta: MetaFunction = () => {
  return [{ title: "复核归档 - 影视拍摄安全验收系统" }];
};

export async function loader({ params }: LoaderFunctionArgs) {
  const id = Number(params.id);
  if (isNaN(id)) throw new Response("Not Found", { status: 404 });

  const detail = await getApplicationDetail(id);
  if (!detail) throw new Response("Not Found", { status: 404 });

  return json(detail);
}

export async function action({ request, params }: ActionFunctionArgs) {
  const id = Number(params.id);
  if (isNaN(id)) throw new Response("Not Found", { status: 404 });

  const detail = await getApplicationDetail(id);
  if (!detail) throw new Response("Not Found", { status: 404 });

  const formData = await request.formData();
  const actionType = formData.get("actionType") as string;
  const operatorName = formData.get("operatorName") as string || "李复核";
  const operatorRole = formData.get("operatorRole") as string || "reviewer";

  await assertReviewerOnly(actionType, operatorRole);
  await assertNotArchived(detail.application.status, actionType);

  if (actionType === "confirm_archive") {
    const conclusion = formData.get("conclusion") as string;
    const basisReference = formData.get("basisReference") as string;
    const notes = formData.get("notes") as string;

    const fieldChangesData: Array<any> = [];
    if (conclusion && conclusion !== detail.application.conclusion) {
      fieldChangesData.push({
        fieldName: "conclusion",
        fieldLabel: "验收结论",
        oldValue: detail.application.conclusion || "",
        newValue: conclusion,
        changedBy: operatorName,
        changeType: "evidence_conclusion",
      });
    }

    await advanceWorkflow(id, "archived", operatorName, operatorRole, {
      actionTaken: "确认结论，归档完成",
      actionResult: "已归档",
      basisReference,
      notes,
      conclusion,
      newStatus: "archived" as AppStatus,
      newResponsible: operatorName,
      newResponsibleRole: operatorRole,
      fieldChangesData,
    });
    return redirect(`/applications/${id}`);
  }

  if (actionType === "return_for_evidence") {
    const reason = formData.get("reason") as string;
    const remedyPath = formData.get("remedyPath") as string;
    const basisReference = formData.get("basisReference") as string;

    const fieldChangesData: Array<any> = [];
    fieldChangesData.push({
      fieldName: "conclusion",
      fieldLabel: "验收结论",
      oldValue: detail.application.conclusion || "待确认",
      newValue: "退回补证：" + reason,
      changedBy: operatorName,
      changeType: "evidence_conclusion",
    });

    await advanceWorkflow(id, "returned", operatorName, operatorRole, {
      actionTaken: `退回补证: ${reason}`,
      actionResult: "退回补证",
      blockingReason: reason,
      remedyPath,
      basisReference,
      conclusion: "退回补证：" + reason,
      newStatus: "returned" as AppStatus,
      newResponsible: formData.get("applicantName") as string,
      newResponsibleRole: "applicant",
      fieldChangesData,
    });
    return redirect(`/applications/${id}`);
  }

  return redirect(`/applications/${id}`);
}

export default function ReviewPage() {
  const { application: app, nodes, attachments, fieldChanges, businessRecords } =
    useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const isArchived = app.status === "archived";
  const isReview = app.status === "review";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to={`/applications/${app.id}`} className="text-gray-400 hover:text-gray-600 text-sm">
            ← 返回详情
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            复核归档 #{app.id}
          </h1>
          <StatusBadge status={app.status as AppStatus} />
        </div>
      </div>

      {isArchived && (
        <div className="card mb-6 bg-gray-50 border-gray-300">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <p className="font-medium text-gray-700">已归档 - 只读模式</p>
              <p className="text-sm text-gray-500">
                归档记录不可修改。如需调整，请在
                <Link to={`/applications/${app.id}/process`} className="text-blue-600 underline mx-1">
                  处理台
                </Link>
                由归档复核人发起重新处理，将生成新的节点记录。
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">申请信息（只读）</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-gray-500">项目名称</dt>
                <dd className="font-medium">{app.projectName}</dd>
              </div>
              <div>
                <dt className="text-gray-500">场景</dt>
                <dd className="font-medium">{app.sceneName}</dd>
              </div>
              <div>
                <dt className="text-gray-500">拍摄地点</dt>
                <dd className="font-medium">{app.location}</dd>
              </div>
              <div>
                <dt className="text-gray-500">申请人</dt>
                <dd className="font-medium">{app.applicantName}</dd>
              </div>
              <div>
                <dt className="text-gray-500">拍摄时间</dt>
                <dd className="font-medium">
                  {app.shootingStartDate
                    ? `${new Date(app.shootingStartDate).toLocaleDateString("zh-CN")} ~ ${new Date(app.shootingEndDate!).toLocaleDateString("zh-CN")}`
                    : "-"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">剧组人数</dt>
                <dd className="font-medium">{app.crewCount || "-"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">预算金额</dt>
                <dd className="font-medium text-blue-700">
                  {app.budgetAmount ? `¥${Number(app.budgetAmount).toLocaleString()}` : "-"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">风险等级</dt>
                <dd className="font-medium">
                  {app.riskLevel === "high" ? "高风险" : app.riskLevel === "medium" ? "中风险" : "低风险"}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-gray-500">安全预案摘要</dt>
                <dd className="font-medium">{app.safetyPlanSummary || "-"}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-gray-500">当前责任人</dt>
                <dd className="font-medium text-purple-700">
                  {app.currentResponsible || "-"}
                  {app.currentResponsibleRole ? ` (${app.currentResponsibleRole === "reviewer" ? "归档复核人" : app.currentResponsibleRole === "processor" ? "处理员" : "申请人"})` : ""}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-gray-500">当前结论</dt>
                <dd className="font-medium text-green-700 border rounded p-3 bg-gray-50">
                  {app.conclusion || "暂无"}
                </dd>
              </div>
            </dl>
          </div>

          {fieldChanges.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">关键字段变更记录（同步来源）</h2>
              <p className="text-xs text-gray-500 mb-3">
                💡 列表摘要、详情结论、看板统计均由此表 + applications 主表共同驱动，数据完全一致
              </p>
              <DiffViewer changes={fieldChanges.map((fc) => ({
                fieldName: fc.fieldName,
                fieldLabel: fc.fieldLabel,
                oldValue: fc.oldValue,
                newValue: fc.newValue,
                changeType: fc.changeType,
                changedBy: fc.changedBy,
                changedAt: new Date(fc.changedAt).toLocaleString("zh-CN"),
              }))} />
            </div>
          )}

          {businessRecords.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">补充记录（只读）</h2>
              <div className="space-y-2">
                {businessRecords.map((r) => (
                  <div key={r.id} className="border rounded-lg p-3 text-sm">
                    <span className="text-xs text-gray-400">
                      {r.recordType === "business_record" ? "业务记录" :
                       r.recordType === "site_description" ? "现场说明" : "证据附件"}
                      {" · "}{r.createdBy} · {new Date(r.createdAt).toLocaleString("zh-CN")}
                    </span>
                    <p className="text-gray-700 mt-1">{r.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {attachments.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">附件（只读）</h2>
              <div className="space-y-2">
                {attachments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between border rounded p-3 text-sm">
                    <div>
                      <span className="font-medium">{a.fileName}</span>
                      <span className="text-gray-400 ml-2">版本 {a.fileVersion}</span>
                    </div>
                    <div className="flex gap-2">
                      {a.isEvidence && <span className="badge bg-amber-100 text-amber-800">证据</span>}
                      <span className="text-gray-400">{a.uploadedBy}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isReview && (
            <div className="space-y-6">
              <Form method="post" className="card border-green-200 bg-green-50">
                <h2 className="text-lg font-semibold mb-4 text-green-800">✅ 确认结论 - 归档</h2>
                <input type="hidden" name="actionType" value="confirm_archive" />
                <input type="hidden" name="applicantName" value={app.applicantName} />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">复核人姓名</label>
                    <input type="text" name="operatorName" defaultValue="李复核" className="input" />
                  </div>
                  <div>
                    <label className="label">角色</label>
                    <select name="operatorRole" className="input">
                      <option value="reviewer">归档复核人（唯一有权限）</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">
                    最终结论
                    <span className="text-xs text-gray-400 ml-2">（修改后将同步到列表、详情、看板）</span>
                  </label>
                  <textarea
                    name="conclusion"
                    rows={3}
                    className="input"
                    defaultValue={app.conclusion || ""}
                    placeholder="确认或修改最终结论"
                  />
                </div>
                <div>
                  <label className="label">采用依据</label>
                  <textarea name="basisReference" rows={2} className="input" placeholder="归档依据" />
                </div>
                <div>
                  <label className="label">备注</label>
                  <textarea name="notes" rows={2} className="input" />
                </div>
                <button type="submit" className="btn-success mt-4" disabled={isSubmitting}>
                  {isSubmitting ? "提交中..." : "确认归档（仅归档复核人可执行）"}
                </button>
              </Form>

              <Form method="post" className="card border-red-200 bg-red-50">
                <h2 className="text-lg font-semibold mb-4 text-red-800">↩️ 退回补证</h2>
                <input type="hidden" name="actionType" value="return_for_evidence" />
                <input type="hidden" name="applicantName" value={app.applicantName} />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">复核人姓名</label>
                    <input type="text" name="operatorName" defaultValue="李复核" className="input" />
                  </div>
                  <div>
                    <label className="label">角色</label>
                    <select name="operatorRole" className="input">
                      <option value="reviewer">归档复核人（唯一有权限）</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">退回原因</label>
                  <textarea
                    name="reason"
                    rows={3}
                    className="input"
                    placeholder="说明退回补证的原因"
                  />
                </div>
                <div>
                  <label className="label">补救路径</label>
                  <textarea
                    name="remedyPath"
                    rows={2}
                    className="input"
                    placeholder="指出需要补充的证据或修正的内容"
                  />
                </div>
                <div>
                  <label className="label">采用依据</label>
                  <textarea name="basisReference" rows={2} className="input" />
                </div>
                <button type="submit" className="btn-danger mt-4" disabled={isSubmitting}>
                  {isSubmitting ? "提交中..." : "退回补证（仅归档复核人可执行）"}
                </button>
              </Form>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">流转时间线</h2>
            <Timeline
              nodes={nodes.map((n) => ({
                nodeType: n.nodeType,
                operatorName: n.operatorName,
                operatorRole: n.operatorRole,
                actionTaken: n.actionTaken,
                blockingReason: n.blockingReason,
                remedyPath: n.remedyPath,
                createdAt: new Date(n.createdAt).toLocaleString("zh-CN"),
                notes: n.notes,
              }))}
            />
          </div>

          {nodes.some((n) => n.basisReference) && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">采用依据汇总</h2>
              <div className="space-y-3">
                {nodes.filter((n) => n.basisReference).map((n) => (
                  <div key={n.id} className="border-l-2 border-blue-300 pl-3 text-sm">
                    <p className="text-gray-700">{n.basisReference}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {n.operatorName} · {n.nodeType === "received" ? "受理" :
                       n.nodeType === "processing" ? "处理" :
                       n.nodeType === "review" ? "复核" :
                       n.nodeType === "archived" ? "归档" :
                       n.nodeType === "reprocessing" ? "重新处理" : "退回补证"}节点
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
