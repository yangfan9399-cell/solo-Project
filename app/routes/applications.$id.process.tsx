import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, Link, Form, useNavigation } from "@remix-run/react";
import { getApplicationDetail, advanceWorkflow, addBusinessRecord, addAttachment } from "~/lib/queries.server";
import { STATUS_LABELS, SAMPLE_TYPE_LABELS, ROLE_LABELS, CHANGE_TYPE_LABELS } from "~/lib/types";
import type { AppStatus } from "~/lib/types";
import StatusBadge from "~/components/StatusBadge";

export const meta: MetaFunction = () => {
  return [{ title: "处理台 - 影视拍摄安全验收系统" }];
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

  const formData = await request.formData();
  const actionType = formData.get("actionType") as string;
  const operatorName = formData.get("operatorName") as string || "系统";
  const operatorRole = formData.get("operatorRole") as string || "processor";

  if (actionType === "start_processing") {
    await advanceWorkflow(id, "processing", operatorName, operatorRole, {
      actionTaken: "开始处理申请",
      actionResult: "处理中",
      newStatus: "processing" as AppStatus,
      newResponsible: operatorName,
      newResponsibleRole: operatorRole,
    });
    return redirect(`/applications/${id}`);
  }

  if (actionType === "block_missing_records") {
    const blockingReason = formData.get("blockingReason") as string;
    const remedyPath = formData.get("remedyPath") as string;
    const basisReference = formData.get("basisReference") as string;
    const notes = formData.get("notes") as string;

    await advanceWorkflow(id, "returned", operatorName, operatorRole, {
      actionTaken: "处理发现业务记录不完整，退回补证",
      actionResult: "退回补证",
      blockingReason,
      remedyPath,
      basisReference,
      notes,
      newStatus: "returned" as AppStatus,
      newResponsible: formData.get("applicantName") as string,
      newResponsibleRole: "applicant",
      diffFields: {
        missing_records: {
          field: "business_records",
          label: "业务记录",
          oldValue: "不完整",
          newValue: "待补充",
        },
      },
    });
    return redirect(`/applications/${id}`);
  }

  if (actionType === "block_inconsistent_attachments") {
    const blockingReason = formData.get("blockingReason") as string;
    const remedyPath = formData.get("remedyPath") as string;
    const basisReference = formData.get("basisReference") as string;
    const diffDesc = formData.get("diffDesc") as string;
    const notes = formData.get("notes") as string;

    await advanceWorkflow(id, "returned", operatorName, operatorRole, {
      actionTaken: "处理发现附件版本不一致，退回补证",
      actionResult: "退回补证",
      blockingReason,
      remedyPath,
      basisReference,
      notes,
      newStatus: "returned" as AppStatus,
      newResponsible: formData.get("applicantName") as string,
      newResponsibleRole: "applicant",
      diffFields: {
        inconsistent_attachments: {
          field: "attachments",
          label: "附件版本",
          oldValue: diffDesc,
          newValue: "待统一版本",
        },
      },
    });
    return redirect(`/applications/${id}`);
  }

  if (actionType === "approve_to_review") {
    const basisReference = formData.get("basisReference") as string;
    const conclusion = formData.get("conclusion") as string;
    const notes = formData.get("notes") as string;

    const fieldChangesData: Array<any> = [];
    const budgetChange = formData.get("budgetChange") as string;
    if (budgetChange === "true") {
      const oldBudget = formData.get("oldBudget") as string;
      const newBudget = formData.get("newBudget") as string;
      fieldChangesData.push({
        fieldName: "budgetAmount",
        fieldLabel: "预算金额",
        oldValue: oldBudget,
        newValue: newBudget,
        changedBy: operatorName,
        changeType: "amount",
      });
    }
    const dateChange = formData.get("dateChange") as string;
    if (dateChange === "true") {
      const oldDate = formData.get("oldDate") as string;
      const newDate = formData.get("newDate") as string;
      fieldChangesData.push({
        fieldName: "shootingStartDate",
        fieldLabel: "拍摄起止时间",
        oldValue: oldDate,
        newValue: newDate,
        changedBy: operatorName,
        changeType: "time",
      });
    }

    await advanceWorkflow(id, "review", operatorName, operatorRole, {
      actionTaken: "处理完成，提交复核",
      actionResult: "提交复核",
      basisReference,
      notes,
      conclusion,
      newStatus: "review" as AppStatus,
      newResponsible: "复核员",
      newResponsibleRole: "reviewer",
      fieldChangesData,
    });
    return redirect(`/applications/${id}`);
  }

  if (actionType === "add_business_record") {
    const recordType = formData.get("recordType") as string;
    const content = formData.get("content") as string;
    const createdBy = formData.get("createdBy") as string;

    await addBusinessRecord(id, recordType, content, createdBy);
    return redirect(`/applications/${id}/process`);
  }

  if (actionType === "add_attachment") {
    const fileName = formData.get("fileName") as string;
    const fileType = formData.get("fileType") as string;
    const fileVersion = formData.get("fileVersion") as string;
    const uploadedBy = formData.get("uploadedBy") as string;
    const isEvidence = formData.get("isEvidence") === "true";

    await addAttachment(id, fileName, fileType, fileVersion, uploadedBy, isEvidence);
    return redirect(`/applications/${id}/process`);
  }

  if (actionType === "reprocess") {
    const reason = formData.get("reason") as string;
    const basisReference = formData.get("basisReference") as string;

    await advanceWorkflow(id, "reprocessing", operatorName, operatorRole, {
      actionTaken: `重新处理: ${reason}`,
      actionResult: "重新处理中",
      basisReference,
      notes: reason,
      newStatus: "reprocessing" as AppStatus,
      newResponsible: operatorName,
      newResponsibleRole: operatorRole,
    });
    return redirect(`/applications/${id}`);
  }

  return redirect(`/applications/${id}`);
}

export default function ProcessDesk() {
  const { application: app, nodes, attachments, businessRecords } =
    useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const isArchived = app.status === "archived";
  const isReturned = app.status === "returned";
  const isReceived = app.status === "received";
  const isProcessing = app.status === "processing";
  const isReprocessing = app.status === "reprocessing";

  const blockingNode = nodes.find((n) => n.blockingReason);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to={`/applications/${app.id}`} className="text-gray-400 hover:text-gray-600 text-sm">
            ← 返回详情
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            处理台 #{app.id}
          </h1>
          <StatusBadge status={app.status as AppStatus} />
        </div>
      </div>

      {isArchived && (
        <div className="card mb-6 bg-gray-50 border-gray-300">
          <div className="flex items-center gap-2 text-gray-500">
            <span className="text-lg">🔒</span>
            <span className="font-medium">已归档，不可修改</span>
          </div>
        </div>
      )}

      {blockingNode && (
        <div className="card mb-6 border-red-300 bg-red-50">
          <h3 className="font-semibold text-red-800 mb-2">⚠️ 阻断信息</h3>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-red-600 font-medium">阻断原因：</span>
              <span className="text-sm text-red-800">{blockingNode.blockingReason}</span>
            </div>
            {blockingNode.diffFields && (
              <div>
                <span className="text-sm text-red-600 font-medium">差异字段：</span>
                <div className="mt-1 space-y-1">
                  {Object.entries(blockingNode.diffFields as Record<string, any>).map(([key, diff]: [string, any]) => (
                    <div key={key} className="text-sm bg-white rounded p-2 border border-red-200">
                      <span className="font-medium">{diff.label}:</span>{" "}
                      <span className="line-through text-red-500">{diff.oldValue}</span>{" → "}
                      <span className="text-green-600">{diff.newValue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {blockingNode.remedyPath && (
              <div>
                <span className="text-sm text-orange-600 font-medium">补救路径：</span>
                <span className="text-sm text-orange-800">{blockingNode.remedyPath}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {!isArchived && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">流程操作</h2>

              {(isReceived || isReprocessing) && (
                <Form method="post" className="space-y-4">
                  <input type="hidden" name="actionType" value="start_processing" />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">操作人姓名</label>
                      <input type="text" name="operatorName" defaultValue="张处理" className="input" />
                    </div>
                    <div>
                      <label className="label">操作人角色</label>
                      <select name="operatorRole" className="input">
                        <option value="processor">处理员</option>
                        <option value="reviewer">归档复核人</option>
                        <option value="applicant">申请人</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? "提交中..." : "开始处理"}
                  </button>
                </Form>
              )}

              {isProcessing && (
                <div className="space-y-6">
                  <Form method="post" className="space-y-4 border rounded-lg p-4">
                    <h3 className="font-medium text-gray-700">处理完成 - 提交复核</h3>
                    <input type="hidden" name="actionType" value="approve_to_review" />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">操作人姓名</label>
                        <input type="text" name="operatorName" defaultValue="张处理" className="input" />
                      </div>
                      <div>
                        <label className="label">操作人角色</label>
                        <select name="operatorRole" className="input">
                          <option value="processor">处理员</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="label">采用依据</label>
                      <textarea name="basisReference" rows={2} className="input" placeholder="如：《影视拍摄安全管理规范》第3条" />
                    </div>
                    <div>
                      <label className="label">处理结论</label>
                      <textarea name="conclusion" rows={3} className="input" placeholder="安全验收结论" />
                    </div>
                    <div>
                      <label className="label">备注</label>
                      <textarea name="notes" rows={2} className="input" />
                    </div>
                    <details className="border rounded-lg p-3">
                      <summary className="text-sm font-medium text-gray-600 cursor-pointer">
                        关键字段变更（如有时填写）
                      </summary>
                      <div className="mt-3 space-y-3">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" name="budgetChange" value="true" />
                          <span className="text-sm">预算金额变更</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" name="oldBudget" placeholder="原金额" className="input" />
                          <input type="text" name="newBudget" placeholder="新金额" className="input" />
                        </div>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" name="dateChange" value="true" />
                          <span className="text-sm">拍摄时间变更</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" name="oldDate" placeholder="原时间" className="input" />
                          <input type="text" name="newDate" placeholder="新时间" className="input" />
                        </div>
                      </div>
                    </details>
                    <button type="submit" className="btn-success" disabled={isSubmitting}>
                      {isSubmitting ? "提交中..." : "提交复核"}
                    </button>
                  </Form>

                  <Form method="post" className="space-y-4 border border-red-200 rounded-lg p-4 bg-red-50">
                    <h3 className="font-medium text-red-700">🚫 阻断 - 记录漏填</h3>
                    <input type="hidden" name="actionType" value="block_missing_records" />
                    <input type="hidden" name="applicantName" value={app.applicantName} />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">操作人姓名</label>
                        <input type="text" name="operatorName" defaultValue="张处理" className="input" />
                      </div>
                      <div>
                        <label className="label">操作人角色</label>
                        <select name="operatorRole" className="input">
                          <option value="processor">处理员</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="label">阻断原因</label>
                      <textarea
                        name="blockingReason"
                        rows={2}
                        className="input"
                        defaultValue="业务记录不完整，缺少现场安全检查记录和应急预案确认记录"
                      />
                    </div>
                    <div>
                      <label className="label">补救路径</label>
                      <textarea
                        name="remedyPath"
                        rows={2}
                        className="input"
                        defaultValue="申请人需补充：1.现场安全检查记录 2.应急预案确认记录 3.安全负责人签字确认"
                      />
                    </div>
                    <div>
                      <label className="label">采用依据</label>
                      <textarea name="basisReference" rows={2} className="input" defaultValue="《影视拍摄安全管理规范》第12条：场景拍摄需完整记录安全检查情况" />
                    </div>
                    <div>
                      <label className="label">备注</label>
                      <textarea name="notes" rows={2} className="input" />
                    </div>
                    <button type="submit" className="btn-danger" disabled={isSubmitting}>
                      {isSubmitting ? "提交中..." : "退回补证"}
                    </button>
                  </Form>

                  <Form method="post" className="space-y-4 border border-orange-200 rounded-lg p-4 bg-orange-50">
                    <h3 className="font-medium text-orange-700">🚫 阻断 - 附件版本不一致</h3>
                    <input type="hidden" name="actionType" value="block_inconsistent_attachments" />
                    <input type="hidden" name="applicantName" value={app.applicantName} />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">操作人姓名</label>
                        <input type="text" name="operatorName" defaultValue="张处理" className="input" />
                      </div>
                      <div>
                        <label className="label">操作人角色</label>
                        <select name="operatorRole" className="input">
                          <option value="processor">处理员</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="label">阻断原因</label>
                      <textarea
                        name="blockingReason"
                        rows={2}
                        className="input"
                        defaultValue="证据附件版本不一致，安全预案文件v1.2与现场确认文件v2.0存在差异"
                      />
                    </div>
                    <div>
                      <label className="label">差异描述</label>
                      <textarea
                        name="diffDesc"
                        rows={2}
                        className="input"
                        defaultValue="安全预案v1.2 vs 现场确认v2.0"
                      />
                    </div>
                    <div>
                      <label className="label">补救路径</label>
                      <textarea
                        name="remedyPath"
                        rows={2}
                        className="input"
                        defaultValue="申请人需重新上传统一版本的安全预案和现场确认文件（版本号需一致）"
                      />
                    </div>
                    <div>
                      <label className="label">采用依据</label>
                      <textarea name="basisReference" rows={2} className="input" defaultValue="《影视拍摄安全管理规范》第8条：证据附件版本须保持一致" />
                    </div>
                    <div>
                      <label className="label">备注</label>
                      <textarea name="notes" rows={2} className="input" />
                    </div>
                    <button type="submit" className="btn-warning" disabled={isSubmitting}>
                      {isSubmitting ? "提交中..." : "退回补证"}
                    </button>
                  </Form>
                </div>
              )}

              {isReturned && (
                <div className="space-y-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      当前申请已退回补证，申请人可补充业务记录、现场说明和证据附件。
                    </p>
                  </div>

                  <Form method="post" className="space-y-4 border rounded-lg p-4">
                    <h3 className="font-medium text-gray-700">补充业务记录 / 现场说明</h3>
                    <input type="hidden" name="actionType" value="add_business_record" />
                    <div>
                      <label className="label">记录类型</label>
                      <select name="recordType" className="input">
                        <option value="business_record">业务记录</option>
                        <option value="site_description">现场说明</option>
                        <option value="evidence_attachment">证据附件</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">内容</label>
                      <textarea name="content" rows={4} className="input" placeholder="请填写补充内容" />
                    </div>
                    <div>
                      <label className="label">填写人</label>
                      <input type="text" name="createdBy" defaultValue={app.applicantName} className="input" />
                    </div>
                    <button type="submit" className="btn-primary" disabled={isSubmitting}>
                      {isSubmitting ? "提交中..." : "补充记录"}
                    </button>
                  </Form>

                  <Form method="post" className="space-y-4 border rounded-lg p-4">
                    <h3 className="font-medium text-gray-700">上传证据附件</h3>
                    <input type="hidden" name="actionType" value="add_attachment" />
                    <div>
                      <label className="label">文件名称</label>
                      <input type="text" name="fileName" className="input" placeholder="如：安全预案确认书.pdf" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">文件类型</label>
                        <select name="fileType" className="input">
                          <option value="pdf">PDF</option>
                          <option value="image">图片</option>
                          <option value="doc">文档</option>
                        </select>
                      </div>
                      <div>
                        <label className="label">文件版本</label>
                        <input type="text" name="fileVersion" className="input" placeholder="如：v2.0" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">上传人</label>
                        <input type="text" name="uploadedBy" defaultValue={app.applicantName} className="input" />
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" name="isEvidence" value="true" defaultChecked />
                          <span className="text-sm">标记为证据</span>
                        </label>
                      </div>
                    </div>
                    <button type="submit" className="btn-primary" disabled={isSubmitting}>
                      {isSubmitting ? "提交中..." : "上传附件"}
                    </button>
                  </Form>

                  <Form method="post" className="space-y-4 border rounded-lg p-4">
                    <h3 className="font-medium text-gray-700">补充完毕 - 重新提交处理</h3>
                    <input type="hidden" name="actionType" value="start_processing" />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">操作人姓名</label>
                        <input type="text" name="operatorName" defaultValue={app.applicantName} className="input" />
                      </div>
                      <div>
                        <label className="label">操作人角色</label>
                        <select name="operatorRole" className="input">
                          <option value="applicant">申请人</option>
                        </select>
                      </div>
                    </div>
                    <button type="submit" className="btn-success" disabled={isSubmitting}>
                      {isSubmitting ? "提交中..." : "重新提交处理"}
                    </button>
                  </Form>
                </div>
              )}

              {app.status === "review" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    当前申请已提交复核，请前往
                    <Link to={`/applications/${app.id}/review`} className="underline font-medium ml-1">
                      复核归档页面
                    </Link>
                    进行操作。
                  </p>
                </div>
              )}
            </div>
          )}

          {isArchived && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">重新处理</h2>
              <p className="text-sm text-gray-500 mb-4">
                归档后如需修改，必须重新处理并生成新的节点记录。
              </p>
              <Form method="post" className="space-y-4">
                <input type="hidden" name="actionType" value="reprocess" />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">操作人姓名</label>
                    <input type="text" name="operatorName" defaultValue="李复核" className="input" />
                  </div>
                  <div>
                    <label className="label">操作人角色</label>
                    <select name="operatorRole" className="input">
                      <option value="reviewer">归档复核人</option>
                      <option value="processor">处理员</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">重新处理原因</label>
                  <textarea name="reason" rows={3} className="input" placeholder="请说明重新处理的原因" />
                </div>
                <div>
                  <label className="label">采用依据</label>
                  <textarea name="basisReference" rows={2} className="input" />
                </div>
                <button type="submit" className="btn-warning" disabled={isSubmitting}>
                  {isSubmitting ? "提交中..." : "发起重新处理"}
                </button>
              </Form>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-3 text-gray-800">申请摘要</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">项目</dt>
                <dd className="font-medium">{app.projectName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">场景</dt>
                <dd className="font-medium">{app.sceneName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">申请人</dt>
                <dd className="font-medium">{app.applicantName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">预算</dt>
                <dd className="font-medium">
                  {app.budgetAmount ? `¥${Number(app.budgetAmount).toLocaleString()}` : "-"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">结论</dt>
                <dd className="font-medium">{app.conclusion || "暂无"}</dd>
              </div>
            </dl>
          </div>

          {businessRecords.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-3 text-gray-800">已补充记录</h2>
              <div className="space-y-2">
                {businessRecords.map((r) => (
                  <div key={r.id} className="text-sm border-l-2 border-blue-300 pl-3">
                    <span className="text-xs text-gray-400">
                      {r.recordType === "business_record" ? "业务记录" :
                       r.recordType === "site_description" ? "现场说明" : "证据附件"}
                      {" · "}{r.createdBy}
                    </span>
                    <p className="text-gray-700">{r.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {attachments.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-3 text-gray-800">附件列表</h2>
              <div className="space-y-2">
                {attachments.map((a) => (
                  <div key={a.id} className="text-sm flex items-center justify-between border rounded p-2">
                    <span className="truncate">{a.fileName}</span>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-2">v{a.fileVersion}</span>
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
