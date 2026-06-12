import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link, useSearchParams } from "@remix-run/react";
import { db } from "~/lib/db.server";
import { applications } from "~/lib/schema";
import { desc, eq, and, or, like, sql } from "drizzle-orm";
import { STATUS_LABELS, SAMPLE_TYPE_LABELS, RISK_LEVEL_LABELS } from "~/lib/types";
import type { AppStatus, SampleType } from "~/lib/types";
import StatusBadge from "~/components/StatusBadge";

export const meta: MetaFunction = () => {
  return [{ title: "申请列表 - 影视拍摄安全验收系统" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status") as AppStatus | null;
  const sampleTypeFilter = url.searchParams.get("sampleType") as SampleType | null;
  const search = url.searchParams.get("search");

  const conditions = [];
  if (statusFilter) conditions.push(eq(applications.status, statusFilter));
  if (sampleTypeFilter) conditions.push(eq(applications.sampleType, sampleTypeFilter));
  if (search) conditions.push(or(
    like(applications.title, `%${search}%`),
    like(applications.projectName, `%${search}%`),
    like(applications.applicantName, `%${search}%`)
  )!);

  const list = conditions.length > 0
    ? await db.select().from(applications).where(and(...conditions)).orderBy(desc(applications.updatedAt))
    : await db.select().from(applications).orderBy(desc(applications.updatedAt));

  return json({ applications: list, statusFilter, sampleTypeFilter, search });
}

export default function ApplicationList() {
  const { applications: apps, statusFilter, sampleTypeFilter, search } = useLoaderData<typeof loader>();
  const [, setSearchParams] = useSearchParams();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">申请列表</h1>
        <div className="flex gap-2 items-center">
          <form method="get" className="flex gap-2">
            {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
            {sampleTypeFilter && <input type="hidden" name="sampleType" value={sampleTypeFilter} />}
            <input
              type="text"
              name="search"
              defaultValue={search || ""}
              placeholder="搜索项目名称、申请人..."
              className="input w-64"
            />
            <button type="submit" className="btn-primary">搜索</button>
          </form>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <Link
          to="/"
          className={`btn-secondary text-xs ${!statusFilter ? "ring-2 ring-blue-400" : ""}`}
        >
          全部
        </Link>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <Link
            key={key}
            to={`/?status=${key}`}
            className={`btn-secondary text-xs ${statusFilter === key ? "ring-2 ring-blue-400" : ""}`}
          >
            {label}
          </Link>
        ))}
      </div>

      {sampleTypeFilter && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-gray-500">样本类型筛选:</span>
          <span className="badge bg-indigo-100 text-indigo-800">
            {SAMPLE_TYPE_LABELS[sampleTypeFilter as SampleType] || sampleTypeFilter}
          </span>
          <Link to={`/?${statusFilter ? `status=${statusFilter}&` : ""}search=${search || ""}`} className="text-xs text-gray-400 hover:text-gray-600">
            ✕ 清除
          </Link>
        </div>
      )}

      <div className="card overflow-hidden p-0">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">编号</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">项目名称</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">场景</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">申请人</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">风险等级</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">样本类型</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">当前责任人</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">结论摘要</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">更新时间</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {apps.map((app) => (
              <tr key={app.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{app.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {app.projectName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {app.sceneName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {app.applicantName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`badge ${
                    app.riskLevel === "high" ? "bg-red-100 text-red-800" :
                    app.riskLevel === "medium" ? "bg-yellow-100 text-yellow-800" :
                    "bg-green-100 text-green-800"
                  }`}>
                    {RISK_LEVEL_LABELS[app.riskLevel || "medium"]}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {app.sampleType ? (
                    <Link
                      to={`/?sampleType=${app.sampleType}`}
                      className="hover:underline text-indigo-600"
                    >
                      {SAMPLE_TYPE_LABELS[app.sampleType as SampleType] || app.sampleType}
                    </Link>
                  ) : "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <StatusBadge status={app.status as AppStatus} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {app.currentResponsible || "-"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                  {app.conclusion || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(app.updatedAt).toLocaleString("zh-CN")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Link
                    to={`/applications/${app.id}`}
                    className="text-blue-600 hover:text-blue-900 mr-2"
                  >
                    详情
                  </Link>
                  {app.status !== "archived" && (
                    <Link
                      to={`/applications/${app.id}/process`}
                      className="text-green-600 hover:text-green-900 mr-2"
                    >
                      处理
                    </Link>
                  )}
                  {(app.status === "review" || app.status === "archived") && (
                    <Link
                      to={`/applications/${app.id}/review`}
                      className="text-purple-600 hover:text-purple-900"
                    >
                      复核
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {apps.length === 0 && (
              <tr>
                <td colSpan={11} className="px-6 py-12 text-center text-gray-400">
                  暂无申请记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
