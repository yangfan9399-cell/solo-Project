import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { prisma } from "~/lib/db.server";
import { StatusBadge } from "~/components/StatusBadge";
import { AlertTriangle, Plus, Clock, User, Building2 } from "lucide-react";

export async function loader() {
  const faults = await prisma.fault.findMany({
    include: {
      elevator: {
        include: {
          building: {
            include: { community: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return json({ faults });
}

export default function FaultsIndex() {
  const { faults } = useLoaderData<typeof loader>();

  const activeFaults = faults.filter(
    (f: { status: string }) => !["已解决", "已归档"].includes(f.status)
  );
  const resolvedFaults = faults.filter(
    (f: { status: string }) => ["已解决", "已归档"].includes(f.status)
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">故障管理</h1>
          <p className="text-slate-600 mt-1">管理所有电梯故障记录</p>
        </div>
      </div>

      {/* Active Faults */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">进行中的故障</h2>
        <div className="space-y-4">
          {activeFaults.map((fault: { id: string; isOverdue: boolean; hasComplaint: boolean; emergencyLevel: string; faultType: string; status: string; description: string; elevator: { building: { community: { name: string } }; code: string }; reporter: string; reportDate: string | Date }) => (
            <Link
              key={fault.id}
              to={`/faults/${fault.id}`}
              className={`block bg-white rounded-xl border p-6 card-hover ${
                fault.isOverdue
                  ? "border-red-200 bg-red-50"
                  : fault.hasComplaint
                  ? "border-amber-200 bg-amber-50"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    fault.isOverdue
                      ? "bg-red-100"
                      : fault.emergencyLevel === "非常紧急"
                      ? "bg-red-100"
                      : fault.emergencyLevel === "紧急"
                      ? "bg-amber-100"
                      : "bg-slate-100"
                  }`}>
                    <AlertTriangle className={`w-6 h-6 ${
                      fault.isOverdue || fault.emergencyLevel === "非常紧急"
                        ? "text-red-600"
                        : fault.emergencyLevel === "紧急"
                        ? "text-amber-600"
                        : "text-slate-600"
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{fault.faultType}</h3>
                      {fault.hasComplaint && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                          业主投诉
                        </span>
                      )}
                      {fault.isOverdue && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full animate-pulse-alert">
                          处理超时
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{fault.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {fault.elevator.building.community.name} · {fault.elevator.code}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {fault.reporter}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(fault.reportDate).toLocaleDateString("zh-CN")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded text-sm font-medium ${
                    fault.emergencyLevel === "非常紧急"
                      ? "bg-red-100 text-red-700"
                      : fault.emergencyLevel === "紧急"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-700"
                  }`}>
                    {fault.emergencyLevel}
                  </span>
                  <div className="mt-2">
                    <StatusBadge status={fault.status} size="sm" />
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {activeFaults.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
              暂无进行中的故障
            </div>
          )}
        </div>
      </div>

      {/* Resolved Faults */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">已解决的故障</h2>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">电梯</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">故障类型</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">紧急程度</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">上报人</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">上报时间</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">解决时间</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {resolvedFaults.map((fault: { id: string; elevator: { code: string; building: { community: { name: string } } }; faultType: string; emergencyLevel: string; reporter: string; reportDate: string | Date; resolvedDate: string | Date | null; status: string }) => (
                <tr key={fault.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <Link
                      to={`/faults/${fault.id}`}
                      className="font-medium text-slate-900 hover:text-primary"
                    >
                      {fault.elevator.code}
                    </Link>
                    <div className="text-sm text-slate-500">
                      {fault.elevator.building.community.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{fault.faultType}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      fault.emergencyLevel === "非常紧急"
                        ? "bg-red-100 text-red-700"
                        : fault.emergencyLevel === "紧急"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-700"
                    }`}>
                      {fault.emergencyLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{fault.reporter}</td>
                  <td className="px-6 py-4 text-slate-600">
                    {new Date(fault.reportDate).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {fault.resolvedDate
                      ? new Date(fault.resolvedDate).toLocaleDateString("zh-CN")
                      : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={fault.status} size="sm" />
                  </td>
                </tr>
              ))}
              {resolvedFaults.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    暂无已解决的故障
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
