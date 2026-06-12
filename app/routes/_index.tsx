import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, useSearchParams } from "@remix-run/react";
import { db } from "~/db";
import { complaints, users } from "~/db/schema";
import { eq, desc, ilike, and } from "drizzle-orm";
import { STATUS_MAP, EXCEPTION_TYPE_MAP, formatDate, formatCurrency } from "~/lib/utils";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const hasException = url.searchParams.get("hasException");
  const source = url.searchParams.get("source");
  const keyword = url.searchParams.get("keyword");

  let whereConditions: any[] = [];
  
  if (status) {
    whereConditions.push(eq(complaints.currentStatus, status));
  }
  if (hasException === "true") {
    whereConditions.push(eq(complaints.hasException, true));
  }
  if (source) {
    whereConditions.push(eq(complaints.source, source));
  }
  if (keyword) {
    whereConditions.push(ilike(complaints.title, `%${keyword}%`));
  }

  const allComplaints = await db.query.complaints.findMany({
    where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
    with: {
      applicant: true,
      currentHandler: true,
      nodes: {
        orderBy: (nodes, { desc }) => [desc(nodes.sortOrder)],
      },
      attachments: true,
    },
    orderBy: [desc(complaints.createdAt)],
  });

  const allComplaintsForStats = await db.query.complaints.findMany();
  
  const stats = {
    total: allComplaintsForStats.length,
    pending: allComplaintsForStats.filter(c => c.currentStatus === "pending").length,
    processing: allComplaintsForStats.filter(c => c.currentStatus === "processing").length,
    review: allComplaintsForStats.filter(c => c.currentStatus === "review").length,
    archived: allComplaintsForStats.filter(c => c.currentStatus === "archived").length,
    rejected: allComplaintsForStats.filter(c => c.currentStatus === "rejected").length,
    exceptions: allComplaintsForStats.filter(c => c.hasException).length,
  };

  return json({ complaints: allComplaints, stats });
}

export default function Index() {
  const { complaints, stats } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="案件总数" value={stats.total} color="slate" icon="📋" />
        <StatCard label="待受理" value={stats.pending} color="gray" icon="⏳" />
        <StatCard label="处理中" value={stats.processing} color="blue" icon="🔧" />
        <StatCard label="待复核" value={stats.review} color="amber" icon="✅" />
        <StatCard label="已归档" value={stats.archived} color="green" icon="📦" />
        <StatCard label="异常案件" value={stats.exceptions} color="red" icon="⚠️" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-3">
              <select
                value={searchParams.get("status") || ""}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">全部状态</option>
                <option value="pending">待受理</option>
                <option value="processing">处理中</option>
                <option value="review">待复核</option>
                <option value="rejected">退回补证</option>
                <option value="archived">已归档</option>
              </select>

              <select
                value={searchParams.get("source") || ""}
                onChange={(e) => handleFilterChange("source", e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">全部来源</option>
                <option value="12345热线">12345热线</option>
                <option value="现场巡查">现场巡查</option>
                <option value="信访">信访</option>
                <option value="其他">其他</option>
              </select>

              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={searchParams.get("hasException") === "true"}
                  onChange={(e) => handleFilterChange("hasException", e.target.checked ? "true" : "")}
                  className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                />
                仅显示异常案件
              </label>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="搜索案件标题..."
                value={searchParams.get("keyword") || ""}
                onChange={(e) => handleFilterChange("keyword", e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-left text-sm text-slate-600 border-b border-slate-200">
                <th className="px-4 py-3 font-medium">案件编号</th>
                <th className="px-4 py-3 font-medium">标题</th>
                <th className="px-4 py-3 font-medium">来源</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">当前处理人</th>
                <th className="px-4 py-3 font-medium">责任单位</th>
                <th className="px-4 py-3 font-medium">罚款金额</th>
                <th className="px-4 py-3 font-medium">更新时间</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {complaints.map((c) => {
                const statusInfo = STATUS_MAP[c.currentStatus] || { label: c.currentStatus, color: "text-gray-700", bgColor: "bg-gray-100" };
                const exceptionInfo = c.exceptionType ? EXCEPTION_TYPE_MAP[c.exceptionType] : null;

                return (
                  <tr
                    key={c.id}
                    className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                    onClick={() => window.location.href = `/complaints/${c.id}`}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-slate-700 font-medium">{c.caseNo}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{c.title}</div>
                      <div className="text-xs text-slate-500 mt-1 truncate max-w-xs">{c.location}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-600">{c.source}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                        {c.hasException && exceptionInfo && (
                          <span className={`text-xs font-medium ${exceptionInfo.color}`}>
                            ⚠ {exceptionInfo.label}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-600">{c.currentHandler?.name || "-"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-600">{c.responsibleParty || "-"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-slate-700">{formatCurrency(c.fineAmount)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-500">{formatDate(c.updatedAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          to={`/complaints/${c.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          查看
                        </Link>
                        {!c.isArchived && (
                          <Link
                            to={`/complaints/${c.id}/process`}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            处理
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {complaints.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-slate-500">暂无符合条件的投诉记录</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  const colorMap: Record<string, string> = {
    slate: "from-slate-500 to-slate-600",
    gray: "from-gray-500 to-gray-600",
    blue: "from-blue-500 to-blue-600",
    amber: "from-amber-500 to-amber-600",
    green: "from-green-500 to-green-600",
    red: "from-red-500 to-red-600",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center text-white text-xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
