import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { prisma } from "~/lib/db.server";
import { StatusBadge } from "~/components/StatusBadge";
import { ClipboardList, Plus, Clock, Building2 } from "lucide-react";

export async function loader() {
  const plans = await prisma.maintenancePlan.findMany({
    include: {
      elevator: {
        include: {
          building: {
            include: { community: true },
          },
        },
      },
      maintenanceUnit: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return json({ plans });
}

export default function PlansIndex() {
  const { plans } = useLoaderData<typeof loader>();

  const activePlans = plans.filter(
    (p: { status: string }) => !["已归档", "已解决"].includes(p.status)
  );
  const archivedPlans = plans.filter(
    (p: { status: string }) => ["已归档", "已解决"].includes(p.status)
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">维保计划</h1>
          <p className="text-slate-600 mt-1">管理所有电梯维保计划</p>
        </div>
        <Link
          to="/plans/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建计划
        </Link>
      </div>

      {/* Active Plans */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">进行中的计划</h2>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">电梯</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">维保单位</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">计划日期</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">截止日期</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">状态</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">风险</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {activePlans.map((plan: { id: string; elevatorId: string; elevator: { code: string; building: { community: { name: string } } }; maintenanceUnit: { name: string }; planDate: string | Date; dueDate: string | Date; status: string; riskLevel: string }) => (
                <tr key={plan.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <Link
                      to={`/elevators/${plan.elevatorId}`}
                      className="font-medium text-slate-900 hover:text-primary"
                    >
                      {plan.elevator.code}
                    </Link>
                    <div className="text-sm text-slate-500">
                      {plan.elevator.building.community.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {plan.maintenanceUnit.name}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {new Date(plan.planDate).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {new Date(plan.dueDate).toLocaleDateString("zh-CN")}
                      {plan.riskLevel !== "正常" && (
                        <Clock className={`w-4 h-4 ${
                          plan.riskLevel === "危险" ? "text-red-500 animate-pulse" : "text-amber-500"
                        }`} />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={plan.status} size="sm" />
                  </td>
                  <td className="px-6 py-4">
                    {plan.riskLevel !== "正常" && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        plan.riskLevel === "危险"
                          ? "bg-red-100 text-red-700 animate-pulse-alert"
                          : plan.riskLevel === "警告"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {plan.riskLevel}
                      </span>
                    )}
                    {plan.riskLevel === "正常" && (
                      <span className="text-emerald-600 text-sm">正常</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/elevators/${plan.elevatorId}`}
                      className="text-primary hover:text-primary-600 text-sm"
                    >
                      查看详情
                    </Link>
                  </td>
                </tr>
              ))}
              {activePlans.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    暂无进行中的维保计划
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Archived Plans */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">已归档的计划</h2>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">电梯</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">维保单位</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">计划日期</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">截止日期</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">状态</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {archivedPlans.map((plan: { id: string; elevatorId: string; elevator: { code: string; building: { community: { name: string } } }; maintenanceUnit: { name: string }; planDate: string | Date; dueDate: string | Date; status: string }) => (
                <tr key={plan.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <Link
                      to={`/elevators/${plan.elevatorId}`}
                      className="font-medium text-slate-900 hover:text-primary"
                    >
                      {plan.elevator.code}
                    </Link>
                    <div className="text-sm text-slate-500">
                      {plan.elevator.building.community.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {plan.maintenanceUnit.name}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {new Date(plan.planDate).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {new Date(plan.dueDate).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={plan.status} size="sm" />
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/elevators/${plan.elevatorId}`}
                      className="text-primary hover:text-primary-600 text-sm"
                    >
                      查看详情
                    </Link>
                  </td>
                </tr>
              ))}
              {archivedPlans.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    暂无已归档的维保计划
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
