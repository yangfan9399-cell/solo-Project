import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { getDashboardStats } from "~/lib/workflow";

export async function loader() {
  const stats = await getDashboardStats();
  return json(stats);
}

const statusStyles: Record<string, string> = {
  accepted: "bg-blue-100 text-blue-800",
  processing: "bg-yellow-100 text-yellow-800",
  reviewing: "bg-purple-100 text-purple-800",
  archived: "bg-green-100 text-green-800",
  returned: "bg-red-100 text-red-800",
  reprocessing: "bg-orange-100 text-orange-800",
};

const statusLabels: Record<string, string> = {
  accepted: "已受理",
  processing: "处理中",
  reviewing: "复核中",
  archived: "已归档",
  returned: "已退回",
  reprocessing: "重新处理",
};

const statusCardBorders: Record<string, string> = {
  accepted: "border-blue-400",
  processing: "border-yellow-400",
  reviewing: "border-purple-400",
  archived: "border-green-400",
  returned: "border-red-400",
  reprocessing: "border-orange-400",
};

const abnormalTypeStyles: Record<string, string> = {
  none: "bg-gray-100 text-gray-800",
  missing_record: "bg-red-100 text-red-800",
  attachment_version_mismatch: "bg-orange-100 text-orange-800",
  reprocessing_needed: "bg-yellow-100 text-yellow-800",
};

const abnormalTypeLabels: Record<string, string> = {
  none: "正常",
  missing_record: "记录缺失",
  attachment_version_mismatch: "附件版本不一致",
  reprocessing_needed: "需重新处理",
};

function StatusBadge({ status }: { status: string }) {
  const style = statusStyles[status] || "bg-gray-100 text-gray-800";
  const label = statusLabels[status] || status;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}

function AbnormalTypeBadge({ type }: { type: string }) {
  const style = abnormalTypeStyles[type] || "bg-gray-100 text-gray-800";
  const label = abnormalTypeLabels[type] || type;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DashboardPage() {
  const { statusCounts, abnormalCounts, recentAbnormals, regionCounts, totalPlans } =
    useLoaderData<typeof loader>();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">看板统计</h1>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div className="rounded-lg border-2 border-gray-300 bg-white p-5 shadow">
          <p className="text-sm font-medium text-gray-500">计划总数</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{totalPlans}</p>
        </div>
        {statusCounts.map((sc) => (
          <Link
            key={sc.status}
            to={`/?status=${sc.status}`}
            className={`rounded-lg border-2 ${statusCardBorders[sc.status] || "border-gray-300"} bg-white p-5 shadow transition hover:shadow-md`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">{statusLabels[sc.status] || sc.status}</p>
              <StatusBadge status={sc.status} />
            </div>
            <p className="mt-1 text-3xl font-bold text-gray-900">{sc.count}</p>
          </Link>
        ))}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">异常分布</h2>
          </div>
          <div className="px-6 py-4">
            {abnormalCounts.length === 0 ? (
              <p className="text-sm text-gray-500">暂无异常记录</p>
            ) : (
              <div className="space-y-3">
                {abnormalCounts.map((ac) => (
                  <Link
                    key={ac.abnormalType}
                    to={`/?abnormalType=${ac.abnormalType}`}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition hover:bg-gray-50 hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <AbnormalTypeBadge type={ac.abnormalType} />
                      <span className="text-sm text-gray-700">{abnormalTypeLabels[ac.abnormalType] || ac.abnormalType}</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900">{ac.count}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">区域分布</h2>
          </div>
          <div className="px-6 py-4">
            {regionCounts.length === 0 ? (
              <p className="text-sm text-gray-500">暂无区域数据</p>
            ) : (
              <div className="space-y-3">
                {regionCounts.map((rc) => (
                  <Link
                    key={rc.region}
                    to={`/?keyword=${encodeURIComponent(rc.region)}`}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition hover:bg-gray-50 hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                        区域
                      </span>
                      <span className="text-sm font-medium text-gray-700">{rc.region}</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900">{rc.count}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">近期异常记录</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  计划编号
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  标题
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  异常类型
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  阻断原因
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  状态
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  更新时间
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {recentAbnormals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                    暂无异常记录
                  </td>
                </tr>
              ) : (
                recentAbnormals.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <Link
                        to={`/plans/${plan.id}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {plan.planCode}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                      <Link to={`/plans/${plan.id}`} className="hover:underline">
                        {plan.title}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <AbnormalTypeBadge type={plan.abnormalType} />
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-sm text-gray-600" title={plan.blockingReason ?? undefined}>
                      {plan.blockingReason ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <StatusBadge status={plan.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {formatDateTime(plan.updatedAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
