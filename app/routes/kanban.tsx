import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { prisma } from "~/lib/db.server";
import { StatusBadge } from "~/components/StatusBadge";
import { Building2, Users, AlertTriangle, Clock } from "lucide-react";

export async function loader() {
  const [plans, faults, communities, maintenanceUnits] = await Promise.all([
    prisma.maintenancePlan.findMany({
      where: { status: { not: "已归档" } },
      include: {
        elevator: {
          include: {
            building: { include: { community: true } },
          },
        },
        maintenanceUnit: true,
      },
    }),
    prisma.fault.findMany({
      where: { status: { not: "已解决" } },
      include: {
        elevator: {
          include: {
            building: { include: { community: true } },
          },
        },
      },
    }),
    prisma.community.findMany({
      include: {
        buildings: {
          include: {
            elevators: true,
          },
        },
      },
    }),
    prisma.maintenanceUnit.findMany({
      include: {
        plans: {
          where: { status: { not: "已归档" } },
        },
      },
    }),
  ]);

  const faultTypes = ["电梯困人", "门故障", "通讯故障", "其他"];
  const faultsByType = faultTypes.map((type) => ({
    type,
    faults: faults.filter((f: { faultType: string }) => f.faultType === type),
  }));

  const now = new Date();
  const overdueGroups = [
    { label: "0-3天", min: 0, max: 3, plans: [] as typeof plans },
    { label: "4-7天", min: 4, max: 7, plans: [] as typeof plans },
    { label: "8-15天", min: 8, max: 15, plans: [] as typeof plans },
    { label: "15天以上", min: 16, max: Infinity, plans: [] as typeof plans },
  ];

  plans.forEach((plan: { dueDate: string | Date }) => {
    const daysOverdue = Math.floor((now.getTime() - new Date(plan.dueDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysOverdue > 0) {
      const group = overdueGroups.find((g) => daysOverdue >= g.min && daysOverdue <= g.max);
      if (group) {
        group.plans.push(plan);
      }
    }
  });

  return json({
    plans,
    faults,
    communities,
    maintenanceUnits,
    faultsByType,
    overdueGroups,
  });
}

export default function Kanban() {
  const { communities, maintenanceUnits, faultsByType, overdueGroups, plans } = useLoaderData<typeof loader>();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">统计看板</h1>
        <p className="text-slate-600 mt-1">多维度聚合视图</p>
      </div>

      {/* By Community */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          按小区聚合
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {communities.map((community: { id: string; name: string; buildings: Array<{ elevators: Array<{ length: number }> }> }) => {
            const communityPlans = plans.filter(
              (p: { elevator: { building: { community: { id: string } } } }) => p.elevator.building.community.id === community.id
            );
            const overdueCount = communityPlans.filter(
              (p: { riskLevel: string }) => p.riskLevel === "危险" || p.riskLevel === "警告"
            ).length;

            return (
              <div
                key={community.id}
                className="bg-white rounded-xl border border-slate-200 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-900">{community.name}</h3>
                  <span className="text-sm text-slate-500">
                    {community.buildings.reduce((acc: number, b: { elevators: { length: number }[] }) => acc + b.elevators.length, 0)} 台电梯
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">进行中计划</span>
                    <span className="font-medium">{communityPlans.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">超期计划</span>
                    <span className={`font-medium ${overdueCount > 0 ? "text-red-600" : "text-slate-900"}`}>
                      {overdueCount}
                    </span>
                  </div>
                </div>
                {overdueCount > 0 && (
                  <div className="mt-3 p-2 bg-red-50 rounded-lg text-xs text-red-700">
                    ⚠️ 存在超期计划需要处理
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* By Maintenance Unit */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          按维保单位聚合
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {maintenanceUnits.map((unit: { id: string; name: string }) => {
            const unitPlans = plans.filter((p: { maintenanceUnitId: string }) => p.maintenanceUnitId === unit.id);
            const overdueCount = unitPlans.filter(
              (p: { riskLevel: string }) => p.riskLevel === "危险" || p.riskLevel === "警告"
            ).length;

            return (
              <div
                key={unit.id}
                className="bg-white rounded-xl border border-slate-200 p-4"
              >
                <h3 className="font-semibold text-slate-900 mb-2">{unit.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">负责计划</span>
                    <span className="font-medium">{unitPlans.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">超期数</span>
                    <span className={`font-medium ${overdueCount > 0 ? "text-red-600" : "text-emerald-600"}`}>
                      {overdueCount}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* By Fault Type */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-primary" />
          按故障类型聚合
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {faultsByType.map(({ type, faults }) => {
            const overdueCount = faults.filter((f: { isOverdue: boolean }) => f.isOverdue).length;
            const complaintCount = faults.filter((f: { hasComplaint: boolean }) => f.hasComplaint).length;

            return (
              <Link
                key={type}
                to="/faults"
                className="bg-white rounded-xl border border-slate-200 p-4 card-hover"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-900">{type}</h3>
                  <span className="text-2xl font-bold text-primary">{faults.length}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">进行中</span>
                    <span className="font-medium">{faults.length}</span>
                  </div>
                  {overdueCount > 0 && (
                    <div className="flex items-center justify-between text-red-600">
                      <span>处理超时</span>
                      <span className="font-medium animate-pulse-alert">{overdueCount}</span>
                    </div>
                  )}
                  {complaintCount > 0 && (
                    <div className="flex items-center justify-between text-amber-600">
                      <span>业主投诉</span>
                      <span className="font-medium">{complaintCount}</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* By Overdue Days */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          按超期天数聚合
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {overdueGroups.map((group) => {
            const isUrgent = group.label === "15天以上" || group.label === "8-15天";

            return (
              <div
                key={group.label}
                className={`rounded-xl border p-4 ${
                  isUrgent
                    ? "bg-red-50 border-red-200"
                    : group.label === "4-7天"
                    ? "bg-amber-50 border-amber-200"
                    : "bg-white border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`font-semibold ${
                    isUrgent ? "text-red-900" : group.label === "4-7天" ? "text-amber-900" : "text-slate-900"
                  }`}>
                    {group.label}
                  </h3>
                  <span className={`text-2xl font-bold ${
                    isUrgent ? "text-red-600" : group.label === "4-7天" ? "text-amber-600" : "text-primary"
                  }`}>
                    {group.plans.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {group.plans.slice(0, 3).map((plan: { id: string; elevatorId: string; elevator: { code: string; building: { community: { name: string } } } }) => (
                    <Link
                      key={plan.id}
                      to={`/elevators/${plan.elevatorId}`}
                      className="block text-sm p-2 bg-white rounded border border-slate-200 hover:border-primary transition-colors"
                    >
                      <div className="font-medium text-slate-900">{plan.elevator.code}</div>
                      <div className="text-slate-500 text-xs">
                        {plan.elevator.building.community.name}
                      </div>
                    </Link>
                  ))}
                  {group.plans.length > 3 && (
                    <div className="text-sm text-slate-500 text-center">
                      +{group.plans.length - 3} 更多
                    </div>
                  )}
                  {group.plans.length === 0 && (
                    <div className="text-sm text-slate-400 text-center py-2">
                      无超期计划
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
