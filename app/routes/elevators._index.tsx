import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { prisma } from "~/lib/db.server";
import { StatusBadge } from "~/components/StatusBadge";
import { Square, Plus, Building2 } from "lucide-react";

export async function loader() {
  const elevators = await prisma.elevator.findMany({
    include: {
      building: {
        include: {
          community: true,
        },
      },
      plans: {
        where: {
          status: { in: ["待执行", "执行中", "待复查"] },
        },
        orderBy: { dueDate: "asc" },
        take: 1,
      },
      faults: {
        where: {
          status: { in: ["待处理", "处理中"] },
        },
        take: 1,
      },
    },
    orderBy: { code: "asc" },
  });

  return json({ elevators });
}

export default function ElevatorsIndex() {
  const { elevators } = useLoaderData<typeof loader>();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">电梯管理</h1>
          <p className="text-slate-600 mt-1">管理所有电梯设备信息</p>
        </div>
        <Link
          to="/plans/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建维保计划
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {elevators.map((elevator: { id: string; code: string; model: string; status: string; building: { community: { name: string }; name: string }; installDate: string | Date; plans: { status: string; dueDate: string | Date }[]; faults: { emergencyLevel: string; faultType: string }[] }) => {
          const activePlan = elevator.plans[0];
          const activeFault = elevator.faults[0];

          return (
            <Link
              key={elevator.id}
              to={`/elevators/${elevator.id}`}
              className="bg-white rounded-xl border border-slate-200 p-6 card-hover"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary-50 rounded-lg">
                    <Square className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{elevator.code}</h3>
                    <p className="text-sm text-slate-500">{elevator.model}</p>
                  </div>
                </div>
                <StatusBadge status={elevator.status} size="sm" />
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span>
                    {elevator.building.community.name} · {elevator.building.name}
                  </span>
                </div>
                <div className="text-slate-500">
                  安装日期: {new Date(elevator.installDate).toLocaleDateString("zh-CN")}
                </div>
              </div>

              {activePlan && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">进行中计划</span>
                    <StatusBadge status={activePlan.status} size="sm" />
                  </div>
                  <div className="mt-1 text-sm text-slate-700">
                    截止: {new Date(activePlan.dueDate).toLocaleDateString("zh-CN")}
                  </div>
                </div>
              )}

              {activeFault && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-red-600">活跃故障</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      activeFault.emergencyLevel === "非常紧急"
                        ? "bg-red-100 text-red-700 animate-pulse-alert"
                        : activeFault.emergencyLevel === "紧急"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-700"
                    }`}>
                      {activeFault.emergencyLevel}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-slate-700 truncate">
                    {activeFault.faultType}
                  </div>
                </div>
              )}

              {!activePlan && !activeFault && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="text-sm text-emerald-600">设备状态正常</div>
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {elevators.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <Square className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">暂无电梯</h3>
          <p className="text-slate-500 mb-6">请先添加电梯设备</p>
          <Link
            to="/plans/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            新建维保计划
          </Link>
        </div>
      )}
    </div>
  );
}
