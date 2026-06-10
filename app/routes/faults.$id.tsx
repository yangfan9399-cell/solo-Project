import { json, type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, Link, Form } from "@remix-run/react";
import { prisma } from "~/lib/db.server";
import { StatusBadge } from "~/components/StatusBadge";
import { RiskAlert } from "~/components/RiskAlert";
import { HistoryTimeline } from "~/components/HistoryTimeline";
import {
  ArrowLeft,
  AlertTriangle,
  Clock,
  User,
  Building2,
  Calendar,
  CheckCircle,
  XCircle,
  Send,
  Wrench,
} from "lucide-react";

export async function loader({ params }: LoaderFunctionArgs) {
  const fault = await prisma.fault.findUnique({
    where: { id: params.id },
    include: {
      elevator: {
        include: {
          building: {
            include: { community: true },
          },
        },
      },
    },
  });

  if (!fault) {
    throw new Response("Not Found", { status: 404 });
  }

  const history = await prisma.historyNode.findMany({
    where: { elevatorId: fault.elevatorId, faultId: fault.id },
    orderBy: { createdAt: "desc" },
  });

  return json({ fault, history });
}

export async function action({ params, request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const actionType = formData.get("actionType");
  const remark = formData.get("remark") as string;
  const currentUserId = "system-user";

  const fault = await prisma.fault.findUnique({
    where: { id: params.id! },
    select: { elevatorId: true },
  });

  if (!fault) {
    throw new Response("Not Found", { status: 404 });
  }

  const elevatorId = fault.elevatorId;

  if (actionType === "startProcess") {
    await prisma.fault.update({
      where: { id: params.id! },
      data: { status: "处理中" },
    });

    await prisma.historyNode.create({
      data: {
        elevatorId,
        faultId: params.id!,
        type: "故障处理",
        title: "开始处理故障",
        description: remark || "维保单位开始处理故障",
        operator: currentUserId,
        operatorRole: "维保单位",
      },
    });

    return redirect(`/faults/${params.id}`);
  }

  if (actionType === "submitResult") {
    const processResult = formData.get("processResult") as string;
    
    await prisma.fault.update({
      where: { id: params.id! },
      data: { 
        status: "待复查",
        resolvedDate: processResult === "resolved" ? new Date() : null,
      },
    });

    await prisma.historyNode.create({
      data: {
        elevatorId,
        faultId: params.id!,
        type: "故障处理",
        title: processResult === "resolved" ? "故障已修复" : "故障处理中",
        description: remark || (processResult === "resolved" ? "维保单位报告故障已修复" : "维保单位报告故障处理中"),
        operator: currentUserId,
        operatorRole: "维保单位",
      },
    });

    return redirect(`/faults/${params.id}`);
  }

  if (actionType === "review") {
    const reviewResult = formData.get("reviewResult") as string;
    
    await prisma.fault.update({
      where: { id: params.id! },
      data: { status: reviewResult === "approve" ? "待确认" : "退回修改" },
    });

    await prisma.historyNode.create({
      data: {
        elevatorId,
        faultId: params.id!,
        type: reviewResult === "approve" ? "复查" : "退回",
        title: reviewResult === "approve" ? "安全管理员复查通过" : "安全管理员复查退回",
        description: remark || (reviewResult === "approve" ? "安全管理员复查通过" : "安全管理员复查退回，需重新处理"),
        operator: currentUserId,
        operatorRole: "安全管理员",
      },
    });

    return redirect(`/faults/${params.id}`);
  }

  if (actionType === "confirm") {
    const confirmResult = formData.get("confirmResult") as string;
    
    await prisma.fault.update({
      where: { id: params.id! },
      data: { status: confirmResult === "archive" ? "已解决" : "退回修改" },
    });

    await prisma.historyNode.create({
      data: {
        elevatorId,
        faultId: params.id!,
        type: confirmResult === "archive" ? "归档" : "退回",
        title: confirmResult === "archive" ? "项目经理确认归档" : "项目经理退回",
        description: remark || (confirmResult === "archive" ? "项目经理确认故障已解决并归档" : "项目经理退回，需重新处理"),
        operator: currentUserId,
        operatorRole: "项目经理",
      },
    });

    return redirect(`/faults/${params.id}`);
  }

  return json({ success: true });
}

export default function FaultDetail() {
  const { fault, history } = useLoaderData<typeof loader>();

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          to="/faults"
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{fault.faultType}</h1>
            <StatusBadge status={fault.status} />
          </div>
          <p className="text-slate-600 mt-1">
            {fault.elevator.building.community.name} · {fault.elevator.code}
          </p>
        </div>
      </div>

      {/* Risk Alert */}
      {fault.isOverdue && (
        <RiskAlert
          level="危险"
          message="该故障已超过24小时未处理，属于超时故障，需要立即处理"
        />
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          {/* Fault Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              故障详情
            </h2>

            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${
                fault.emergencyLevel === "非常紧急"
                  ? "bg-red-50 border border-red-200"
                  : fault.emergencyLevel === "紧急"
                  ? "bg-amber-50 border border-amber-200"
                  : "bg-slate-50 border border-slate-200"
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">紧急程度</span>
                  <span className={`px-3 py-1 rounded font-medium ${
                    fault.emergencyLevel === "非常紧急"
                      ? "bg-red-100 text-red-700"
                      : fault.emergencyLevel === "紧急"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-700"
                  }`}>
                    {fault.emergencyLevel}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-sm text-slate-500 mb-1">故障描述</div>
                <div className="text-slate-900">{fault.description}</div>
              </div>

              {fault.hasComplaint && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-800">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">业主投诉</span>
                  </div>
                  <p className="text-sm text-amber-700 mt-1">
                    该故障关联业主投诉，需要重点关注处理进度
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              {fault.status === "待处理" && (
                <div className="space-y-3">
                  <div className="text-sm font-medium text-slate-700 mb-2">维保单位操作</div>
                  <Form method="post" className="space-y-3">
                    <input type="hidden" name="actionType" value="startProcess" />
                    <textarea
                      name="remark"
                      placeholder="处理说明（可选）"
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm resize-none"
                      rows={2}
                    />
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      <Wrench className="w-4 h-4" />
                      开始处理
                    </button>
                  </Form>
                </div>
              )}

              {fault.status === "处理中" && (
                <div className="space-y-3">
                  <div className="text-sm font-medium text-slate-700 mb-2">维保单位操作</div>
                  <Form method="post" className="space-y-3">
                    <input type="hidden" name="actionType" value="submitResult" />
                    <div className="space-y-3">
                      <label className="flex items-center gap-2">
                        <input type="radio" name="processResult" value="resolved" defaultChecked className="text-primary" />
                        <span className="text-sm text-slate-700">故障已修复</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="radio" name="processResult" value="processing" className="text-primary" />
                        <span className="text-sm text-slate-700">正在处理中</span>
                      </label>
                    </div>
                    <textarea
                      name="remark"
                      placeholder="处理结果说明（可选）"
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm resize-none"
                      rows={2}
                    />
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      提交处理结果
                    </button>
                  </Form>
                </div>
              )}

              {fault.status === "待复查" && (
                <div className="space-y-3">
                  <div className="text-sm font-medium text-slate-700 mb-2">安全管理员复查</div>
                  <Form method="post" className="space-y-2">
                    <input type="hidden" name="actionType" value="review" />
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

              {fault.status === "待确认" && (
                <div className="space-y-3">
                  <div className="text-sm font-medium text-slate-700 mb-2">项目经理确认</div>
                  <Form method="post" className="space-y-2">
                    <input type="hidden" name="actionType" value="confirm" />
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

              {fault.status === "退回修改" && (
                <div className="space-y-3">
                  <div className="text-sm font-medium text-amber-700 mb-2">已被退回，需要重新处理</div>
                  <Form method="post" className="space-y-3">
                    <input type="hidden" name="actionType" value="startProcess" />
                    <textarea
                      name="remark"
                      placeholder="重新处理说明（可选）"
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm resize-none"
                      rows={2}
                    />
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      <Wrench className="w-4 h-4" />
                      重新处理
                    </button>
                  </Form>
                </div>
              )}
            </div>
          </div>

          {/* Elevator Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              电梯信息
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-500 mb-1">电梯编号</div>
                <div className="font-medium text-slate-900">
                  <Link
                    to={`/elevators/${fault.elevatorId}`}
                    className="text-primary hover:text-primary-600"
                  >
                    {fault.elevator.code}
                  </Link>
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">电梯型号</div>
                <div className="font-medium text-slate-900">{fault.elevator.model}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">所在小区</div>
                <div className="font-medium text-slate-900">
                  {fault.elevator.building.community.name}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">所在楼栋</div>
                <div className="font-medium text-slate-900">
                  {fault.elevator.building.name}
                </div>
              </div>
            </div>
          </div>

          {/* Attachment Placeholder */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">附件</h2>
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center">
              <div className="text-slate-400 mb-2">暂无附件</div>
              <p className="text-sm text-slate-500">
                故障现场照片、维修凭证等文件将显示在这里
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Meta Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">故障信息</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="text-sm text-slate-500">上报人</div>
                  <div className="font-medium text-slate-900">{fault.reporter}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="text-sm text-slate-500">上报时间</div>
                  <div className="font-medium text-slate-900">
                    {new Date(fault.reportDate).toLocaleString("zh-CN")}
                  </div>
                </div>
              </div>
              {fault.resolvedDate && (
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-500">解决时间</div>
                    <div className="font-medium text-slate-900">
                      {new Date(fault.resolvedDate).toLocaleString("zh-CN")}
                    </div>
                  </div>
                </div>
              )}
              {fault.isOverdue && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700">
                    <Clock className="w-5 h-5" />
                    <span className="font-medium">处理超时</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* History Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">历史节点</h2>
            <HistoryTimeline nodes={history} />
          </div>
        </div>
      </div>
    </div>
  );
}
