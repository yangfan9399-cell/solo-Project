import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
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
  Phone,
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
