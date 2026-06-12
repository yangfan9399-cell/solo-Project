import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { getDashboardStats } from "~/lib/queries.server";
import { db } from "~/lib/db.server";
import { applications } from "~/lib/schema";
import { desc, eq, sql, count } from "drizzle-orm";
import {
  STATUS_LABELS,
  SAMPLE_TYPE_LABELS,
  RISK_LEVEL_LABELS,
} from "~/lib/types";
import type { AppStatus, SampleType } from "~/lib/types";
import StatusBadge from "~/components/StatusBadge";

export const meta: MetaFunction = () => {
  return [{ title: "看板统计 - 影视拍摄安全验收系统" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const stats = await getDashboardStats();

  const statusMap: Record<string, number> = {};
  stats.statusCounts.forEach((s) => {
    statusMap[s.status] = Number(s.count);
  });

  const sampleTypeMap: Record<string, number> = {};
  stats.sampleTypeCounts.forEach((s) => {
    sampleTypeMap[s.sampleType || "unknown"] = Number(s.count);
  });

  const riskMap: Record<string, number> = {};
  stats.riskCounts.forEach((s) => {
    riskMap[s.riskLevel || "unknown"] = Number(s.count);
  });

  const recentArchived = await db
    .select()
    .from(applications)
    .where(eq(applications.status, "archived"))
    .orderBy(desc(applications.updatedAt))
    .limit(5);

  const recentBlocked = await db
    .select()
    .from(applications)
    .where(eq(applications.status, "returned"))
    .orderBy(desc(applications.updatedAt))
    .limit(5);

  return json({
    statusMap,
    sampleTypeMap,
    riskMap,
    totalBudget: stats.totalBudget,
    recentArchived,
    recentBlocked,
  });
}

export default function Dashboard() {
  const {
    statusMap,
    sampleTypeMap,
    riskMap,
    totalBudget,
    recentArchived,
    recentBlocked,
  } = useLoaderData<typeof loader>();

  const total = Object.values(statusMap).reduce((a, b) => a + b, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">看板统计</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <Link
            key={key}
            to={`/?status=${key}`}
            className="card hover:shadow-md transition-shadow cursor-pointer"
          >
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-3xl font-bold mt-1">
              <span className={
                key === "received" ? "text-blue-600" :
                key === "processing" ? "text-yellow-600" :
                key === "review" ? "text-purple-600" :
                key === "archived" ? "text-green-600" :
                key === "returned" ? "text-red-600" :
                "text-orange-600"
              }>
                {statusMap[key] || 0}
              </span>
            </p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">样本类型分布</h2>
          <div className="space-y-3">
            {Object.entries(SAMPLE_TYPE_LABELS).map(([key, label]) => {
              const count = sampleTypeMap[key] || 0;
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <Link key={key} to={`/?sampleType=${key}`} className="block hover:bg-gray-50 rounded p-2 -m-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{label}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        key === "normal" ? "bg-green-500" :
                        key === "missing_records" ? "bg-red-500" :
                        key === "inconsistent_attachments" ? "bg-orange-500" :
                        "bg-blue-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">风险等级分布</h2>
          <div className="space-y-3">
            {Object.entries(RISK_LEVEL_LABELS).map(([key, label]) => {
              const count = riskMap[key] || 0;
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{label}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        key === "high" ? "bg-red-500" :
                        key === "medium" ? "bg-yellow-500" :
                        "bg-green-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">汇总数据</h2>
          <div className="space-y-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600">申请总数</p>
              <p className="text-4xl font-bold text-blue-700">{total}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600">预算总额</p>
              <p className="text-2xl font-bold text-green-700">
                ¥{Number(totalBudget).toLocaleString()}
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-600">归档率</p>
              <p className="text-2xl font-bold text-purple-700">
                {total > 0 ? ((statusMap["archived"] || 0) / total * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">最近归档（可钻取）</h2>
          {recentArchived.length > 0 ? (
            <div className="space-y-2">
              {recentArchived.map((app) => (
                <Link
                  key={app.id}
                  to={`/applications/${app.id}`}
                  className="flex items-center justify-between border rounded-lg p-3 hover:bg-gray-50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{app.projectName} - {app.sceneName}</p>
                    <p className="text-xs text-gray-400">{app.applicantName} · {new Date(app.updatedAt).toLocaleString("zh-CN")}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status="archived" />
                    {app.conclusion && (
                      <p className="text-xs text-gray-500 mt-1 max-w-[200px] truncate">{app.conclusion}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">暂无归档记录</p>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">退回补证记录（可钻取）</h2>
          {recentBlocked.length > 0 ? (
            <div className="space-y-2">
              {recentBlocked.map((app) => (
                <Link
                  key={app.id}
                  to={`/applications/${app.id}`}
                  className="flex items-center justify-between border rounded-lg p-3 hover:bg-gray-50 border-red-100"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{app.projectName} - {app.sceneName}</p>
                    <p className="text-xs text-gray-400">{app.applicantName} · {new Date(app.updatedAt).toLocaleString("zh-CN")}</p>
                    {app.sampleType && (
                      <span className="text-xs text-red-500">
                        {SAMPLE_TYPE_LABELS[app.sampleType as SampleType]}
                      </span>
                    )}
                  </div>
                  <StatusBadge status="returned" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">暂无退回记录</p>
          )}
        </div>
      </div>
    </div>
  );
}
