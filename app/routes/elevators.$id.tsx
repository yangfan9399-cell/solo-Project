import { json, type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, Link, useActionData, Form } from "@remix-run/react";
import { prisma } from "~/lib/db.server";
import { StatusBadge } from "~/components/StatusBadge";
import { RiskAlert } from "~/components/RiskAlert";
import { HistoryTimeline } from "~/components/HistoryTimeline";
import {
  ArrowLeft,
  Building2,
  Calendar,
  ClipboardList,
  AlertTriangle,
  FileText,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Send,
} from "lucide-react";

export async function loader({ params }: LoaderFunctionArgs) {
  const elevator = await prisma.elevator.findUnique({
    where: { id: params.id },
    include: {
      building: {
        include: {
          community: true,
        },
      },
      plans: {
        include: {
          maintenanceUnit: true,
          record: true,
        },
        orderBy: { createdAt: "desc" },
      },
      faults: {
        orderBy: { createdAt: "desc" },
      },
      history: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!elevator) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({ elevator });
}

export async function action({ params, request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const actionType = formData.get("actionType");
  const planId = formData.get("planId") as string;
  const items = formData.get("items");
  const remark = formData.get("remark") as string;
  const currentUserId = "system-user";

  if (actionType === "submitRecord") {
    const recordData = JSON.parse(items as string);
    const plan = await prisma.maintenancePlan.findUnique({
      where: { id: planId },
      include: { maintenanceUnit: true },
    });
    
    await prisma.maintenanceRecord.upsert({
      where: { planId },
      update: {
        items: items as string,
        attachmentUrl: "/uploads/placeholder.jpg",
      },
      create: {
        planId,
        maintenanceUnitId: plan!.maintenanceUnitId,
        items: items as string,
        attachmentUrl: "/uploads/placeholder.jpg",
        submitDate: new Date(),
      },
    });

    await prisma.maintenancePlan.update({
      where: { id: planId },
      data: { status: "待复查" },
    });

    await prisma.historyNode.create({
      data: {
        elevatorId: params.id!,
        planId,
        type: "执行",
        title: "维保单位提交记录",
        description: "维保单位已完成维保工作并提交记录",
        operator: currentUserId,
        operatorRole: "维保单位",
      },
    });

    return redirect(`/elevators/${params.id}`);
  }

  if (actionType === "review") {
    const reviewResult = formData.get("reviewResult") as string;
    
    await prisma.maintenancePlan.update({
      where: { id: planId },
      data: { status: reviewResult === "approve" ? "待确认" : "退回修改" },
    });

    await prisma.historyNode.create({
      data: {
        elevatorId: params.id!,
        planId,
        type: reviewResult === "approve" ? "复查" : "退回",
        title: reviewResult === "approve" ? "安全管理员复查通过" : "安全管理员复查退回",
        description: remark || (reviewResult === "approve" ? "安全管理员复查通过" : "安全管理员复查退回，需修改"),
        operator: currentUserId,
        operatorRole: "安全管理员",
      },
    });

    return redirect(`/elevators/${params.id}`);
  }

  if (actionType === "confirm") {
    const confirmResult = formData.get("confirmResult") as string;
    
    await prisma.maintenancePlan.update({
      where: { id: planId },
      data: { status: confirmResult === "archive" ? "已归档" : "退回修改" },
    });

    await prisma.historyNode.create({
      data: {
        elevatorId: params.id!,
        planId,
        type: confirmResult === "archive" ? "归档" : "退回",
        title: confirmResult === "archive" ? "项目经理确认归档" : "项目经理退回",
        description: remark || (confirmResult === "archive" ? "项目经理确认归档" : "项目经理退回，需重新处理"),
        operator: currentUserId,
        operatorRole: "项目经理",
      },
    });

    return redirect(`/elevators/${params.id}`);
  }

  return json({ success: true });
}

export default function ElevatorDetail() {
  const { elevator } = useLoaderData<typeof loader>();

  const activePlans = elevator.plans.filter(
    (p: { status: string }) => !["已归档", "已解决"].includes(p.status)
  );

  const activeFaults = elevator.faults.filter(
    (f: { status: string }) => !["已解决", "已归档"].includes(f.status)
  );

  const overduePlans = activePlans.filter((p: { riskLevel: string }) => p.riskLevel === "危险" || p.riskLevel === "警告");

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          to="/elevators"
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{elevator.code}</h1>
            <StatusBadge status={elevator.status} />
          </div>
          <p className="text-slate-600 mt-1">
            {elevator.building.community.name} · {elevator.building.name} · {elevator.model}
          </p>
        </div>
      </div>

      {/* Risk Alerts */}
      {overduePlans.length > 0 && (
        <RiskAlert
          level="危险"
          message={`该电梯有 ${overduePlans.length} 个维保计划超期，需要立即处理`}
        />
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              基本信息
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-slate-500 mb-1">电梯编号</div>
                <div className="font-medium text-slate-900">{elevator.code}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">电梯型号</div>
                <div className="font-medium text-slate-900">{elevator.model}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">所在小区</div>
                <div className="font-medium text-slate-900">{elevator.building.community.name}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">所在楼栋</div>
                <div className="font-medium text-slate-900">{elevator.building.name}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">安装日期</div>
                <div className="font-medium text-slate-900">
                  {new Date(elevator.installDate).toLocaleDateString("zh-CN")}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">当前状态</div>
                <div className="font-medium text-slate-900">{elevator.status}</div>
              </div>
            </div>
          </div>

          {/* Maintenance Plans */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              维保计划
            </h2>

            {activePlans.length > 0 ? (
              <div className="space-y-4">
                {activePlans.map((plan: { id: string; riskLevel: string; planDate: string | Date; maintenanceUnit: { name: string }; status: string; dueDate: string | Date; record: { items: string; attachmentUrl?: string } | null }) => (
                  <div
                    key={plan.id}
                    className={`p-4 rounded-lg border ${
                      plan.riskLevel === "危险"
                        ? "border-red-200 bg-red-50"
                        : plan.riskLevel === "警告"
                        ? "border-amber-200 bg-amber-50"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-900">
                          计划维保日期: {new Date(plan.planDate).toLocaleDateString("zh-CN")}
                        </div>
                        <div className="text-sm text-slate-600 mt-1">
                          维保单位: {plan.maintenanceUnit.name}
                        </div>
                      </div>
                      <div className="text-right">
                        <StatusBadge status={plan.status} size="sm" />
                        {plan.riskLevel !== "正常" && (
                          <div className={`mt-1 text-sm font-medium ${
                            plan.riskLevel === "危险" ? "text-red-700" : "text-amber-700"
                          }`}>
                            {plan.riskLevel}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-200 text-sm text-slate-500">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          截止: {new Date(plan.dueDate).toLocaleDateString("zh-CN")}
                        </span>
                        {plan.record && (
                          <span className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            已提交维保记录
                          </span>
                        )}
                      </div>
                    </div>
                    {plan.record && (
                      <div className="mt-3 p-3 bg-white rounded border border-slate-200">
                        <div className="text-sm font-medium text-slate-700 mb-2">维保项:</div>
                        <div className="grid grid-cols-2 gap-2">
                          {JSON.parse(plan.record.items).map((item: { item: string; result: string }, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span className="text-slate-600">{item.item}</span>
                              <span className={item.result === "正常" ? "text-emerald-600" : "text-amber-600"}>
                                {item.result}
                              </span>
                            </div>
                          ))}
                        </div>
                        {plan.record.attachmentUrl && (
                          <div className="mt-3 pt-3 border-t border-slate-100">
                            <div className="text-sm text-slate-500 mb-1">附件:</div>
                            <div className="flex items-center gap-2">
                              <div className="px-3 py-2 bg-slate-100 rounded text-sm text-slate-600">
                                📎 维保记录照片.jpg
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      {plan.status === "待执行" && (
                        <div className="space-y-3">
                          <div className="text-sm font-medium text-slate-700 mb-2">维保单位操作</div>
                          <Form method="post" className="space-y-3">
                            <input type="hidden" name="actionType" value="submitRecord" />
                            <input type="hidden" name="planId" value={plan.id} />
                            <div className="grid grid-cols-2 gap-2">
                              <select name="item1" className="px-3 py-2 border border-slate-300 rounded text-sm">
                                <option value="正常">门系统检查 - 正常</option>
                                <option value="异常">门系统检查 - 异常</option>
                              </select>
                              <select name="item2" className="px-3 py-2 border border-slate-300 rounded text-sm">
                                <option value="正常">曳引机检查 - 正常</option>
                                <option value="异常">曳引机检查 - 异常</option>
                              </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <select name="item3" className="px-3 py-2 border border-slate-300 rounded text-sm">
                                <option value="正常">安全装置检查 - 正常</option>
                                <option value="异常">安全装置检查 - 异常</option>
                              </select>
                              <select name="item4" className="px-3 py-2 border border-slate-300 rounded text-sm">
                                <option value="正常">电气系统检查 - 正常</option>
                                <option value="异常">电气系统检查 - 异常</option>
                              </select>
                            </div>
                            <input
                              type="hidden"
                              name="items"
                              value='[{"item":"门系统检查","result":"正常"},{"item":"曳引机检查","result":"正常"},{"item":"安全装置检查","result":"正常"},{"item":"电气系统检查","result":"正常"}]'
                            />
                            <button
                              type="submit"
                              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
                            >
                              <Send className="w-4 h-4" />
                              提交维保记录
                            </button>
                          </Form>
                        </div>
                      )}

                      {plan.status === "待复查" && (
                        <div className="space-y-3">
                          <div className="text-sm font-medium text-slate-700 mb-2">安全管理员复查</div>
                          <Form method="post" className="space-y-2">
                            <input type="hidden" name="actionType" value="review" />
                            <input type="hidden" name="planId" value={plan.id} />
                            <textarea
                              name="remark"
                              placeholder="复查意见（可选）"
                              className="w-full px-3 py-2 border border-slate-300 rounded text-sm resize-none"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <button
                                type="submit"
                                name="reviewResult"
                                value="approve"
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                              >
                                <CheckCircle className="w-4 h-4" />
                                复查通过
                              </button>
                              <button
                                type="submit"
                                name="reviewResult"
                                value="reject"
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                              >
                                <XCircle className="w-4 h-4" />
                                退回修改
                              </button>
                            </div>
                          </Form>
                        </div>
                      )}

                      {plan.status === "待确认" && (
                        <div className="space-y-3">
                          <div className="text-sm font-medium text-slate-700 mb-2">项目经理确认</div>
                          <Form method="post" className="space-y-2">
                            <input type="hidden" name="actionType" value="confirm" />
                            <input type="hidden" name="planId" value={plan.id} />
                            <textarea
                              name="remark"
                              placeholder="确认意见（可选）"
                              className="w-full px-3 py-2 border border-slate-300 rounded text-sm resize-none"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <button
                                type="submit"
                                name="confirmResult"
                                value="archive"
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
                              >
                                <CheckCircle className="w-4 h-4" />
                                确认归档
                              </button>
                              <button
                                type="submit"
                                name="confirmResult"
                                value="reject"
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                              >
                                <XCircle className="w-4 h-4" />
                                退回
                              </button>
                            </div>
                          </Form>
                        </div>
                      )}

                      {plan.status === "退回修改" && (
                        <div className="space-y-3">
                          <div className="text-sm font-medium text-amber-700 mb-2">已被退回，需要修改后重新提交</div>
                          <Form method="post" className="space-y-3">
                            <input type="hidden" name="actionType" value="submitRecord" />
                            <input type="hidden" name="planId" value={plan.id} />
                            <div className="grid grid-cols-2 gap-2">
                              <select name="item1" className="px-3 py-2 border border-slate-300 rounded text-sm">
                                <option value="正常">门系统检查 - 正常</option>
                                <option value="异常">门系统检查 - 异常</option>
                              </select>
                              <select name="item2" className="px-3 py-2 border border-slate-300 rounded text-sm">
                                <option value="正常">曳引机检查 - 正常</option>
                                <option value="异常">曳引机检查 - 异常</option>
                              </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <select name="item3" className="px-3 py-2 border border-slate-300 rounded text-sm">
                                <option value="正常">安全装置检查 - 正常</option>
                                <option value="异常">安全装置检查 - 异常</option>
                              </select>
                              <select name="item4" className="px-3 py-2 border border-slate-300 rounded text-sm">
                                <option value="正常">电气系统检查 - 正常</option>
                                <option value="异常">电气系统检查 - 异常</option>
                              </select>
                            </div>
                            <input
                              type="hidden"
                              name="items"
                              value='[{"item":"门系统检查","result":"正常"},{"item":"曳引机检查","result":"正常"},{"item":"安全装置检查","result":"正常"},{"item":"电气系统检查","result":"正常"}]'
                            />
                            <button
                              type="submit"
                              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
                            >
                              <Send className="w-4 h-4" />
                              重新提交维保记录
                            </button>
                          </Form>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                暂无进行中的维保计划
              </div>
            )}
          </div>

          {/* Faults */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              故障记录
            </h2>

            {activeFaults.length > 0 ? (
              <div className="space-y-4">
                {activeFaults.map((fault: { id: string; isOverdue: boolean; hasComplaint: boolean; faultType: string; emergencyLevel: string; status: string; description: string; reporter: string; reportDate: string | Date }) => (
                  <Link
                    key={fault.id}
                    to={`/faults/${fault.id}`}
                    className={`block p-4 rounded-lg border ${
                      fault.isOverdue
                        ? "border-red-200 bg-red-50"
                        : fault.hasComplaint
                        ? "border-amber-200 bg-amber-50"
                        : "border-slate-200 hover:border-primary-200"
                    } transition-colors`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-900 flex items-center gap-2">
                          {fault.faultType}
                          {fault.hasComplaint && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                              业主投诉
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-slate-600 mt-1 truncate max-w-md">
                          {fault.description}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          fault.emergencyLevel === "非常紧急"
                            ? "bg-red-100 text-red-700"
                            : fault.emergencyLevel === "紧急"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-700"
                        }`}>
                          {fault.emergencyLevel}
                        </span>
                        <StatusBadge status={fault.status} size="sm" />
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-200 text-sm text-slate-500 flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {fault.reporter}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(fault.reportDate).toLocaleDateString("zh-CN")}
                      </span>
                      {fault.isOverdue && (
                        <span className="text-red-600 font-medium">处理超时</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                暂无进行中的故障
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* History Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">历史节点</h2>
            <HistoryTimeline nodes={elevator.history} />
          </div>
        </div>
      </div>
    </div>
  );
}
