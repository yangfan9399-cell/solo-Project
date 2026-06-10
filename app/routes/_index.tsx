import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { prisma } from "~/lib/db.server";
import { StatusBadge } from "~/components/StatusBadge";
import { RiskAlert } from "~/components/RiskAlert";
import {
  Elevator,
  ClipboardList,
  AlertTriangle,
  Clock,
  CheckCircle,
  TrendingUp,
  Building2,
} from "lucide-react";

export async function loader() {
  const [
    totalElevators,
    activePlans,
    overduePlans,
    activeFaults,
    overdueFaults,
    recentPlans,
    recentFaults,
  ] = await Promise.all([
    prisma.elevator.count(),
    prisma.maintenancePlan.count({
      where: { status: { in: ["待执行", "执行中", "待复查"] } },
    }),
    prisma.maintenancePlan.count({
      where: { riskLevel: { in: ["警告", "危险"] } },
    }),
    prisma.fault.count({
      where: { status: { in: ["待处理", "处理中"] } },
    }),
    prisma.fault.count({
      where: { isOverdue: true },
    }),
    prisma.maintenancePlan.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        elevator: {
          include: { building: { include: { community: true } } },
        },
        maintenanceUnit: true,
      },
    }),
    prisma.fault.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        elevator: {
          include: { building: { include: { community: true } } },
        },
      },
    }),
  ]);

  return json({
    stats: {
      totalElevators,
      activePlans,
      overduePlans,
      activeFaults,
      overdueFaults,
    },
    recentPlans,
    recentFaults,
  });
}

export default function Index() {
  const { stats, recentPlans, recentFaults } = useLoaderData<typeof loader>();

  const statCards = [
    {
      label: "电梯总数",
      value: stats.totalElevators,
      icon: Elevator,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      label: "进行中计划",
      value: stats.activePlans,
      icon: ClipboardList,
      color: "bg-amber-500",
      bgColor: "bg-amber-50",
    },
    {
      label: "超期计划",
      value: stats.overduePlans,
      icon: Clock,
      color: stats.overduePlans > 0 ? "bg-red-500 animate-pulse-alert" : "bg-slate-500",
      bgColor: stats.overduePlans > 0 ? "bg-red-50" : "bg-slate-50",
    },
    {
      label: "活跃故障",
      value: stats.activeFaults,
      icon: AlertTriangle,
      color: "bg-orange-500",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">仪表盘</h1>
        <p className="text-slate-600 mt-1">物业电梯维保管理系统概览</p>
      </div>

      {/* Risk Alerts */}
      {stats.overduePlans > 0 && (
        <RiskAlert
          level="危险"
          message={`有 ${stats.overduePlans} 个维保计划已超期，需要立即处理`}
        />
      )}
      {stats.overdueFaults > 0 && (
        <RiskAlert
          level="警告"
          message={`有 ${stats.overdueFaults} 个故障处理超时，需要关注`}
        />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-slate-200 p-6 card-hover"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                  <div className="text-sm text-slate-500">{stat.label}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-2 gap-6">
        {/* Recent Maintenance Plans */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">最近维保计划</h2>
            <Link
              to="/plans"
              className="text-sm text-primary hover:text-primary-600"
            >
              查看全部
            </Link>
          </div>

          <div className="space-y-4">
            {recentPlans.map((plan) => (
              <Link
                key={plan.id}
                to={`/elevators/${plan.elevatorId}`}
                className="block p-4 rounded-lg border border-slate-200 hover:border-primary-200 hover:bg-primary-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-900">
                      {plan.elevator.code}
                    </div>
                    <div className="text-sm text-slate-500">
                      {plan.elevator.building.community.name} · {plan.elevator.building.name}
                    </div>
                  </div>
                  <StatusBadge status={plan.status} size="sm" />
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                  <span>{plan.maintenanceUnit.name}</span>
                  <span>截止: {new Date(plan.dueDate).toLocaleDateString("zh-CN")}</span>
                </div>
              </Link>
            ))}

            {recentPlans.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                暂无维保计划
              </div>
            )}
          </div>
        </div>

        {/* Recent Faults */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">最近故障</h2>
            <Link
              to="/faults"
              className="text-sm text-primary hover:text-primary-600"
            >
              查看全部
            </Link>
          </div>

          <div className="space-y-4">
            {recentFaults.map((fault) => (
              <Link
                key={fault.id}
                to={`/faults/${fault.id}`}
                className={`block p-4 rounded-lg border transition-colors ${
                  fault.isOverdue
                    ? "border-red-200 bg-red-50 hover:bg-red-100"
                    : fault.hasComplaint
                    ? "border-amber-200 bg-amber-50 hover:bg-amber-100"
                    : "border-slate-200 hover:border-primary-200 hover:bg-primary-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-900">
                      {fault.elevator.code}
                      {fault.hasComplaint && (
                        <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                          业主投诉
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-500">
                      {fault.faultType} · {fault.elevator.building.community.name}
                    </div>
                  </div>
                  <StatusBadge status={fault.status} size="sm" />
                </div>
                <div className="mt-2 text-xs text-slate-500 truncate">
                  {fault.description}
                </div>
              </Link>
            ))}

            {recentFaults.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                暂无故障记录
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
