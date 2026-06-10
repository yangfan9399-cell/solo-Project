import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
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

export default function ElevatorDetail() {
  const { elevator } = useLoaderData<typeof loader>();

  const activePlans = elevator.plans.filter(
    (p) => !["已归档", "已解决"].includes(p.status)
  );

  const activeFaults = elevator.faults.filter(
    (f) => !["已解决", "已归档"].includes(f.status)
  );

  const overduePlans = activePlans.filter((p) => p.riskLevel === "危险" || p.riskLevel === "警告");

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
                {activePlans.map((plan) => (
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
                {activeFaults.map((fault) => (
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
