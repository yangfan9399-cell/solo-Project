import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { AppLayout } from "~/components/AppLayout";
import { getStats, getCurrentUserInfo } from "~/services/dataService";
import { STATUS_MAP, EXCEPTION_TYPE_MAP, formatDateTime, cn } from "~/utils/constants";
import type { DashboardStats } from "~/types";
import { STATUS, EXCEPTION_TYPES } from "~/db/schema";

export const meta: MetaFunction = () => {
  return [
    { title: "工作台 - 铅封核验系统" },
    { name: "description", content: "港口集装箱铅封异常核验与放箱审批系统" },
  ];
};

export async function loader(_args: LoaderFunctionArgs) {
  const [{ stats, dbMode }, user] = await Promise.all([getStats(), getCurrentUserInfo()]);
  return json({ stats, dbMode, user });
}

function StatCard({
  title,
  value,
  icon,
  color,
  trend,
  linkTo,
}: {
  title: string;
  value: number | string;
  icon: string;
  color: string;
  trend?: string;
  linkTo?: string;
}) {
  const content = (
    <div className="card p-5 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
          {trend && <p className="text-xs text-emerald-600 mt-2">{trend}</p>}
        </div>
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
            color
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );

  if (linkTo) {
    return <Link to={linkTo}>{content}</Link>;
  }
  return content;
}

export default function Index() {
  const { stats, dbMode, user } = useLoaderData<typeof loader>();
  const typedStats = stats as DashboardStats;

  return (
    <AppLayout
      title="工作台"
      subtitle={`欢迎回来，${user.displayName} · 今日待处理 ${typedStats.pending} 项`}
      user={user}
      actions={
        <div className="flex items-center gap-3">
          {!dbMode && (
            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
              ⚠️ 演示模式（Mock 数据）
            </span>
          )}
          <button className="btn-primary">
            <span className="mr-2">＋</span>新建核验
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="待处理"
            value={typedStats.pending}
            icon="⏳"
            color="bg-amber-100 text-amber-600"
            trend="较昨日 +1"
            linkTo="/records?status=pending"
          />
          <StatCard
            title="处理中"
            value={typedStats.processing}
            icon="🔄"
            color="bg-blue-100 text-blue-600"
            linkTo="/records?status=processing"
          />
          <StatCard
            title="已归档"
            value={typedStats.archived}
            icon="📁"
            color="bg-slate-100 text-slate-600"
            trend="本月新增 8 件"
            linkTo="/records?status=archived"
          />
          <StatCard
            title="异常件"
            value={typedStats.exceptionCount}
            icon="⚠️"
            color="bg-red-100 text-red-600"
            linkTo="/records?exceptionType=missing_record"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">最近更新</h2>
                <Link to="/records" className="text-sm text-ocean-600 hover:underline">
                  查看全部 →
                </Link>
              </div>
              <div className="space-y-3">
                {typedStats.recentRecords.map((record) => {
                  const statusInfo = STATUS_MAP[record.status] || STATUS_MAP[STATUS.PENDING_ACCEPT];
                  const exceptionInfo = EXCEPTION_TYPE_MAP[record.exceptionType] || EXCEPTION_TYPE_MAP[EXCEPTION_TYPES.NORMAL];
                  return (
                    <Link
                      key={record.id}
                      to={`/records/${record.id}`}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                    >
                      <div className="w-10 h-10 bg-ocean-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                        📦
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900 group-hover:text-ocean-600 transition-colors truncate">
                            {record.recordNo}
                          </p>
                          <span className={cn("badge", statusInfo.bgColor, statusInfo.color)}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 truncate mt-0.5">
                          {record.containerNo} · {record.sealNo} · {record.summary}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={cn("badge", exceptionInfo.bgColor, exceptionInfo.color)}>
                          {exceptionInfo.label}
                        </span>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatDateTime(record.updatedAt)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">快速入口</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link to="/records?status=pending_accept" className="p-4 rounded-lg bg-slate-50 hover:bg-ocean-50 transition-colors text-center group">
                  <div className="text-3xl mb-2">📥</div>
                  <p className="text-sm font-medium text-slate-700 group-hover:text-ocean-600">待受理</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {typedStats.byStatus[STATUS.PENDING_ACCEPT] || 0} 件
                  </p>
                </Link>
                <Link to="/processing" className="p-4 rounded-lg bg-slate-50 hover:bg-blue-50 transition-colors text-center group">
                  <div className="text-3xl mb-2">🔍</div>
                  <p className="text-sm font-medium text-slate-700 group-hover:text-blue-600">处理台</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {typedStats.processing} 件处理中
                  </p>
                </Link>
                <Link to="/records?status=pending_review" className="p-4 rounded-lg bg-slate-50 hover:bg-amber-50 transition-colors text-center group">
                  <div className="text-3xl mb-2">✅</div>
                  <p className="text-sm font-medium text-slate-700 group-hover:text-amber-600">待复核</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {typedStats.byStatus[STATUS.PENDING_REVIEW] || 0} 件
                  </p>
                </Link>
                <Link to="/dashboard" className="p-4 rounded-lg bg-slate-50 hover:bg-emerald-50 transition-colors text-center group">
                  <div className="text-3xl mb-2">📊</div>
                  <p className="text-sm font-medium text-slate-700 group-hover:text-emerald-600">复盘看板</p>
                  <p className="text-xs text-slate-500 mt-1">数据统计分析</p>
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">状态分布</h2>
              <div className="space-y-3">
                {Object.entries(typedStats.byStatus).map(([status, count]) => {
                  const info = STATUS_MAP[status] || { label: status, color: "text-slate-600", bgColor: "bg-slate-100" };
                  const percentage = typedStats.total > 0 ? (count / typedStats.total) * 100 : 0;
                  return (
                    <Link key={status} to={`/records?status=${status}`} className="block">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-600">{info.label}</span>
                        <span className="font-medium text-slate-900">{count} 件</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all", info.bgColor.replace("100", "500"))}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">异常类型</h2>
              <div className="space-y-3">
                {Object.entries(typedStats.byType).map(([type, count]) => {
                  const info = EXCEPTION_TYPE_MAP[type] || { label: type, color: "text-slate-600", bgColor: "bg-slate-100" };
                  return (
                    <Link
                      key={type}
                      to={`/records?exceptionType=${type}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className={cn("w-3 h-3 rounded-full", info.bgColor.replace("100", "500"))} />
                        <span className="text-sm text-slate-700">{info.label}</span>
                      </div>
                      <span className="text-sm font-medium text-slate-900">{count}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="card p-6 bg-gradient-to-br from-ocean-500 to-ocean-700 text-white">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">⏱️</span>
                <h3 className="font-semibold">平均处理时长</h3>
              </div>
              <p className="text-4xl font-bold">{typedStats.avgProcessTime} <span className="text-lg font-normal">天</span></p>
              <p className="text-ocean-200 text-sm mt-2">较上月缩短 0.8 天</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
