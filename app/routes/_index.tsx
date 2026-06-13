import { json } from "@remix-run/node";
import { Form, Link, useLoaderData, useSearchParams } from "@remix-run/react";
import { listPlans } from "~/lib/workflow";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") || undefined;
  const keyword = url.searchParams.get("keyword") || undefined;
  const abnormalType = url.searchParams.get("abnormalType") || undefined;

  const result = await listPlans({ status, keyword, abnormalType });

  return json({ plans: result.plans, total: result.total });
}

const statusLabels: Record<string, string> = {
  accepted: "已受理",
  processing: "处理中",
  reviewing: "复核中",
  archived: "已归档",
  returned: "已退回",
  reprocessing: "重新处理",
};

const statusStyles: Record<string, string> = {
  accepted: "bg-blue-100 text-blue-800",
  processing: "bg-yellow-100 text-yellow-800",
  reviewing: "bg-purple-100 text-purple-800",
  archived: "bg-green-100 text-green-800",
  returned: "bg-red-100 text-red-800",
  reprocessing: "bg-orange-100 text-orange-800",
};

const abnormalTypeLabels: Record<string, string> = {
  none: "正常",
  missing_record: "记录缺失",
  attachment_version_mismatch: "附件版本不一致",
  reprocessing_needed: "需重新处理",
};

const abnormalTypeStyles: Record<string, string> = {
  none: "bg-gray-100 text-gray-800",
  missing_record: "bg-red-100 text-red-800",
  attachment_version_mismatch: "bg-orange-100 text-orange-800",
  reprocessing_needed: "bg-yellow-100 text-yellow-800",
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

export default function PlanListPage() {
  const { plans, total } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  const currentStatus = searchParams.get("status") || "";
  const currentKeyword = searchParams.get("keyword") || "";
  const currentAbnormalType = searchParams.get("abnormalType") || "";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">停电计划列表</h1>
        <span className="text-sm text-gray-500">共 {total} 条记录</span>
      </div>

      <Form method="get" className="mb-6 flex flex-wrap items-end gap-4 rounded-lg bg-white p-4 shadow">
        <div className="flex flex-col">
          <label htmlFor="status" className="mb-1 text-sm font-medium text-gray-700">状态</label>
          <select
            id="status"
            name="status"
            defaultValue={currentStatus}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">全部</option>
            <option value="accepted">已受理</option>
            <option value="processing">处理中</option>
            <option value="reviewing">复核中</option>
            <option value="archived">已归档</option>
            <option value="returned">已退回</option>
            <option value="reprocessing">重新处理</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label htmlFor="keyword" className="mb-1 text-sm font-medium text-gray-700">关键词</label>
          <input
            id="keyword"
            name="keyword"
            type="text"
            defaultValue={currentKeyword}
            placeholder="编号/标题/线路/负责人..."
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="abnormalType" className="mb-1 text-sm font-medium text-gray-700">异常类型</label>
          <select
            id="abnormalType"
            name="abnormalType"
            defaultValue={currentAbnormalType}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">全部</option>
            <option value="none">正常</option>
            <option value="missing_record">记录缺失</option>
            <option value="attachment_version_mismatch">附件版本不一致</option>
            <option value="reprocessing_needed">需重新处理</option>
          </select>
        </div>

        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          筛选
        </button>
      </Form>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">计划编号</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">标题</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">区域</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">线路</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">状态</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">异常类型</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">负责人</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">结论摘要</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">更新时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {plans.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-500">
                  暂无数据
                </td>
              </tr>
            ) : (
              plans.map((plan) => (
                <tr key={plan.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <Link to={`/plans/${plan.id}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                      {plan.planCode}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                    <Link to={`/plans/${plan.id}`} className="hover:underline">{plan.title}</Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{plan.region}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{plan.lineName}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm"><StatusBadge status={plan.status} /></td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm"><AbnormalTypeBadge type={plan.abnormalType} /></td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{plan.responsiblePerson}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-sm text-gray-600" title={plan.conclusionSummary ?? undefined}>
                    {plan.conclusionSummary ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {plan.updatedAt ? new Date(plan.updatedAt).toLocaleString("zh-CN") : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
