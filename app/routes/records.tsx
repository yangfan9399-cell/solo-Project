import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData, useSearchParams } from "@remix-run/react";
import { AppLayout } from "~/components/AppLayout";
import { getRecords, getStats, getCurrentUserInfo } from "~/services/dataService";
import { STATUS_MAP, EXCEPTION_TYPE_MAP, formatDateTime, cn, formatDate } from "~/utils/constants";
import type { RecordSummary, DashboardStats } from "~/types";
import { STATUS, EXCEPTION_TYPES } from "~/db/schema";

export const meta: MetaFunction = () => {
  return [
    { title: "核验记录 - 铅封核验系统" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") || undefined;
  const exceptionType = url.searchParams.get("exceptionType") || undefined;
  const search = url.searchParams.get("search") || undefined;

  const [{ records }, { stats }, user] = await Promise.all([
    getRecords({ status, exceptionType, search }),
    getStats(),
    getCurrentUserInfo(),
  ]);

  return json({ records, stats, user });
}

function StatusBadge({ status }: { status: string }) {
  const info = STATUS_MAP[status] || { label: status, color: "text-slate-600", bgColor: "bg-slate-100" };
  return (
    <span className={cn("badge", info.bgColor, info.color)}>
      {info.label}
    </span>
  );
}

function ExceptionBadge({ type }: { type: string }) {
  const info = EXCEPTION_TYPE_MAP[type] || { label: type, color: "text-slate-600", bgColor: "bg-slate-100" };
  return (
    <span className={cn("badge", info.bgColor, info.color)}>
      {info.label}
    </span>
  );
}

export default function Records() {
  const { records, stats, user } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const typedRecords = records as RecordSummary[];
  const typedStats = stats as DashboardStats;

  const currentStatus = searchParams.get("status") || "";
  const currentExceptionType = searchParams.get("exceptionType") || "";
  const currentSearch = searchParams.get("search") || "";

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next);
  };

  const statusFilters = [
    { value: "", label: "全部" },
    { value: STATUS.PENDING_ACCEPT, label: "待受理" },
    { value: STATUS.PROCESSING, label: "处理中" },
    { value: STATUS.PENDING_REVIEW, label: "待复核" },
    { value: STATUS.RETURNED, label: "已退回" },
    { value: STATUS.ARCHIVED, label: "已归档" },
  ];

  const typeFilters = [
    { value: "", label: "全部类型" },
    { value: EXCEPTION_TYPES.NORMAL, label: "正常核销" },
    { value: EXCEPTION_TYPES.MISSING_RECORD, label: "记录漏填" },
    { value: EXCEPTION_TYPES.ATTACHMENT_VERSION_MISMATCH, label: "附件版本不一致" },
    { value: EXCEPTION_TYPES.RE_PROCESS, label: "重新处理" },
  ];

  return (
    <AppLayout
      title="核验记录"
      subtitle={`共 ${typedRecords.length} 条记录`}
      user={user}
      actions={
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="搜索记录编号、箱号、铅封号..."
              className="input pl-10 w-72"
              defaultValue={currentSearch}
              onChange={(e) => {
                const val = e.target.value;
                if (val.length === 0 || val.length > 2) {
                  setFilter("search", val);
                }
              }}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          </div>
          <button className="btn-primary">
            <span className="mr-2">＋</span>新建核验
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="card p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">状态：</span>
              <div className="flex gap-1">
                {statusFilters.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilter("status", f.value)}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-lg transition-colors",
                      currentStatus === f.value
                        ? "bg-ocean-100 text-ocean-700 font-medium"
                        : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    {f.label}
                    {f.value && (
                      <span className="ml-1 text-xs opacity-70">
                        ({typedStats.byStatus[f.value] || 0})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-6 w-px bg-slate-200" />

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">类型：</span>
              <select
                className="input w-40 py-1.5 text-sm"
                value={currentExceptionType}
                onChange={(e) => setFilter("exceptionType", e.target.value)}
              >
                {typeFilters.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    记录编号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    集装箱 / 铅封
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    船舶 / 航次
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    类型
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    当前责任人
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    摘要
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    更新时间
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {typedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                      <div className="text-4xl mb-2">📭</div>
                      <p>暂无符合条件的记录</p>
                    </td>
                  </tr>
                ) : (
                  typedRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/records/${record.id}`}
                          className="font-medium text-ocean-600 hover:text-ocean-800"
                        >
                          {record.recordNo}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900 font-medium">
                          {record.containerNo}
                        </div>
                        <div className="text-sm text-slate-500">{record.sealNo}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">{record.vesselName}</div>
                        <div className="text-sm text-slate-500">{record.voyageNo}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ExceptionBadge type={record.exceptionType} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={record.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-ocean-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                            {record.currentHandler?.charAt(0) || "?"}
                          </div>
                          <span className="text-sm text-slate-700">
                            {record.currentHandler || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600 max-w-xs truncate">
                          {record.summary || "-"}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {formatDateTime(record.updatedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <Link
                          to={`/records/${record.id}`}
                          className="text-ocean-600 hover:text-ocean-800 font-medium"
                        >
                          查看
                        </Link>
                        {!record.isArchived && (
                          <>
                            <span className="mx-2 text-slate-300">|</span>
                            <Link
                              to={`/processing/${record.id}`}
                              className="text-emerald-600 hover:text-emerald-800 font-medium"
                            >
                              处理
                            </Link>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            显示 1 - {typedRecords.length} 条，共 {typedRecords.length} 条
          </p>
          <div className="flex gap-1">
            <button className="btn-secondary px-3 py-1.5 text-sm" disabled>
              上一页
            </button>
            <button className="btn-primary px-3 py-1.5 text-sm">1</button>
            <button className="btn-secondary px-3 py-1.5 text-sm" disabled>
              下一页
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
