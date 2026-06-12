import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData, useNavigate } from "@remix-run/react";
import { useState } from "react";
import { AppLayout } from "~/components/AppLayout";
import { getStats, getRecords, getCurrentUserInfo } from "~/services/dataService";
import { STATUS_MAP, EXCEPTION_TYPE_MAP, formatDateTime, cn } from "~/utils/constants";
import type { DashboardStats, RecordSummary } from "~/types";
import { STATUS, EXCEPTION_TYPES } from "~/db/schema";

export const meta: MetaFunction = () => {
  return [{ title: "复盘看板 - 铅封核验系统" }];
};

export async function loader(_args: LoaderFunctionArgs) {
  const { stats } = await getStats();
  
  const recordsByExceptionType: Record<string, RecordSummary[]> = {};
  for (const type of Object.keys(stats.byType)) {
    recordsByExceptionType[type] = (await getRecords({ exceptionType: type })).records.slice(0, 5);
  }
  
  const recordsByStatus: Record<string, RecordSummary[]> = {};
  for (const status of Object.keys(stats.byStatus)) {
    recordsByStatus[status] = (await getRecords({ status })).records.slice(0, 5);
  }
  
  const user = await getCurrentUserInfo();
  
  return json({ stats, recordsByExceptionType, recordsByStatus, user });
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
  trend,
  trendUp,
  onClick,
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: string;
  color: string;
  trend?: string;
  trendUp?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn(
        "card p-5 transition-all",
        onClick && "hover:shadow-md cursor-pointer hover:-translate-y-0.5"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          {trend && (
            <p className={cn(
              "text-xs mt-2 font-medium",
              trendUp ? "text-emerald-600" : "text-red-600"
            )}>
              {trendUp ? "↑" : "↓"} {trend}
            </p>
          )}
        </div>
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-2xl", color)}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function BarChart({
  data,
  labelMap,
  colorMap,
  onBarClick,
  title,
}: {
  data: Record<string, number>;
  labelMap: Record<string, { label: string; color: string }>;
  colorMap?: Record<string, string>;
  onBarClick?: (key: string) => void;
  title: string;
}) {
  const maxValue = Math.max(...Object.values(data), 1);
  const entries = Object.entries(data);

  return (
    <div className="card p-6">
      <h3 className="font-semibold text-slate-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {entries.map(([key, value]) => {
          const info = labelMap[key] || { label: key, color: "text-slate-600" };
          const percentage = (value / maxValue) * 100;
          const barColor = colorMap?.[key] || "bg-ocean-500";
          return (
            <div
              key={key}
              className={cn(
                "group cursor-pointer",
                onBarClick && "hover:opacity-80"
              )}
              onClick={() => onBarClick?.(key)}
            >
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-700 group-hover:text-ocean-600 transition-colors">
                  {info.label}
                </span>
                <span className="font-medium text-slate-900">{value} 件</span>
              </div>
              <div className="h-8 bg-slate-100 rounded-lg overflow-hidden">
                <div
                  className={cn("h-full rounded-lg transition-all group-hover:opacity-90", barColor)}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-slate-400 mt-4">💡 点击柱状图可钻取查看具体记录</p>
    </div>
  );
}

function PieChart({
  data,
  labelMap,
  title,
  onSliceClick,
}: {
  data: Record<string, number>;
  labelMap: Record<string, { label: string; color: string }>;
  title: string;
  onSliceClick?: (key: string) => void;
}) {
  const total = Object.values(data).reduce((sum, v) => sum + v, 0);
  const entries = Object.entries(data);
  
  const colors = [
    "bg-emerald-500",
    "bg-amber-500",
    "bg-red-500",
    "bg-purple-500",
    "bg-blue-500",
    "bg-cyan-500",
  ];

  let cumulativePercent = 0;

  return (
    <div className="card p-6">
      <h3 className="font-semibold text-slate-900 mb-4">{title}</h3>
      <div className="flex items-center gap-6">
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            {entries.map(([key, value], index) => {
              const percent = total > 0 ? (value / total) * 100 : 0;
              const strokeDasharray = `${percent} ${100 - percent}`;
              const strokeDashoffset = -cumulativePercent;
              cumulativePercent += percent;
              
              const colorMap: Record<string, string> = {
                [EXCEPTION_TYPES.NORMAL]: "#10b981",
                [EXCEPTION_TYPES.MISSING_RECORD]: "#f59e0b",
                [EXCEPTION_TYPES.ATTACHMENT_VERSION_MISMATCH]: "#ef4444",
                [EXCEPTION_TYPES.RE_PROCESS]: "#8b5cf6",
              };
              const color = colorMap[key] || "#64748b";
              
              return (
                <circle
                  key={key}
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="transparent"
                  stroke={color}
                  strokeWidth="3"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => onSliceClick?.(key)}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-slate-900">{total}</span>
          </div>
        </div>
        
        <div className="flex-1 space-y-2">
          {entries.map(([key, value], index) => {
            const info = labelMap[key] || { label: key, color: "text-slate-600" };
            const percent = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
            return (
              <div
                key={key}
                className={cn(
                  "flex items-center justify-between text-sm cursor-pointer group",
                  onSliceClick && "hover:bg-slate-50 rounded px-2 py-1 -mx-2"
                )}
                onClick={() => onSliceClick?.(key)}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "w-3 h-3 rounded-full",
                      colors[index % colors.length]
                    )}
                  />
                  <span className="text-slate-700 group-hover:text-ocean-600 transition-colors">
                    {info.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900">{value}</span>
                  <span className="text-slate-400 text-xs">({percent}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-4">💡 点击扇区可钻取查看具体记录</p>
    </div>
  );
}

function TrendChart({ title }: { title: string }) {
  const data = [
    { day: "周一", value: 12 },
    { day: "周二", value: 19 },
    { day: "周三", value: 15 },
    { day: "周四", value: 22 },
    { day: "周五", value: 18 },
    { day: "周六", value: 8 },
    { day: "周日", value: 5 },
  ];
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="card p-6">
      <h3 className="font-semibold text-slate-900 mb-4">{title}</h3>
      <div className="flex items-end justify-between h-40 gap-2">
        {data.map((item) => {
          const height = (item.value / maxValue) * 100;
          return (
            <div key={item.day} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-slate-500 font-medium">{item.value}</span>
              <div
                className="w-full bg-ocean-400 rounded-t-md hover:bg-ocean-500 transition-colors cursor-pointer"
                style={{ height: `${height}%`, minHeight: "4px" }}
              />
              <span className="text-xs text-slate-400">{item.day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DrillModal({
  isOpen,
  onClose,
  title,
  records,
  filterKey,
  filterValue,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  records: RecordSummary[];
  filterKey: string;
  filterValue: string;
}) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500">共 {records.length} 条记录</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
          >
            ✕
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          {records.length === 0 ? (
            <p className="text-center text-slate-400 py-8">暂无数据</p>
          ) : (
            <div className="space-y-2">
              {records.map((record) => {
                const statusInfo = STATUS_MAP[record.status] || { label: record.status, color: "text-slate-600", bgColor: "bg-slate-100" };
                return (
                  <div
                    key={record.id}
                    className="p-4 rounded-lg border border-slate-200 hover:border-ocean-300 hover:bg-ocean-50/30 cursor-pointer transition-colors"
                    onClick={() => navigate(`/records/${record.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{record.recordNo}</p>
                        <p className="text-sm text-slate-500">
                          {record.containerNo} · {record.sealNo}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={cn("badge", statusInfo.bgColor, statusInfo.color)}>
                          {statusInfo.label}
                        </span>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatDateTime(record.updatedAt)}
                        </p>
                      </div>
                    </div>
                    {record.summary && (
                      <p className="text-sm text-slate-600 mt-2 line-clamp-1">
                        {record.summary}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end">
          <Link
            to={`/records?${filterKey}=${filterValue}`}
            className="btn-primary text-sm"
          >
            查看全部 →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { stats, recordsByExceptionType, recordsByStatus, user } = useLoaderData<typeof loader>();
  const typedStats = stats as DashboardStats;
  const typedRecordsByType = recordsByExceptionType as Record<string, RecordSummary[]>;
  const typedRecordsByStatus = recordsByStatus as Record<string, RecordSummary[]>;

  const [drillModal, setDrillModal] = useState<{
    isOpen: boolean;
    title: string;
    records: RecordSummary[];
    filterKey: string;
    filterValue: string;
  }>({
    isOpen: false,
    title: "",
    records: [],
    filterKey: "",
    filterValue: "",
  });

  const handleDrillByType = (type: string) => {
    const typeInfo = EXCEPTION_TYPE_MAP[type] || { label: type };
    setDrillModal({
      isOpen: true,
      title: `${typeInfo.label} - 详细记录`,
      records: typedRecordsByType[type] || [],
      filterKey: "exceptionType",
      filterValue: type,
    });
  };

  const handleDrillByStatus = (status: string) => {
    const statusInfo = STATUS_MAP[status] || { label: status };
    setDrillModal({
      isOpen: true,
      title: `${statusInfo.label} - 详细记录`,
      records: typedRecordsByStatus[status] || [],
      filterKey: "status",
      filterValue: status,
    });
  };

  const statusColorMap: Record<string, string> = {
    [STATUS.PENDING_ACCEPT]: "bg-slate-400",
    [STATUS.PROCESSING]: "bg-blue-500",
    [STATUS.PENDING_REVIEW]: "bg-amber-500",
    [STATUS.RETURNED]: "bg-red-500",
    [STATUS.ARCHIVED]: "bg-emerald-500",
  };

  return (
    <AppLayout
      title="复盘看板"
      subtitle="数据统计与趋势分析 · 支持钻取查看明细"
      user={user}
      actions={
        <div className="flex items-center gap-2">
          <select className="input py-2 text-sm w-32">
            <option>本周</option>
            <option>本月</option>
            <option>本季度</option>
            <option>本年度</option>
          </select>
          <button className="btn-secondary text-sm">
            📥 导出报表
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="总核验数"
            value={typedStats.total}
            subtitle="本期累计"
            icon="📦"
            color="bg-blue-100 text-blue-600"
            trend="12.5%"
            trendUp
            onClick={() => handleDrillByStatus(STATUS.ARCHIVED)}
          />
          <StatCard
            title="待处理"
            value={typedStats.pending}
            subtitle="需要关注"
            icon="⏳"
            color="bg-amber-100 text-amber-600"
            trend="2 件"
            trendUp={false}
            onClick={() => handleDrillByStatus(STATUS.PENDING_ACCEPT)}
          />
          <StatCard
            title="异常件数"
            value={typedStats.exceptionCount}
            subtitle="异常占比 40%"
            icon="⚠️"
            color="bg-red-100 text-red-600"
            trend="5.2%"
            trendUp={false}
            onClick={() => handleDrillByType(EXCEPTION_TYPES.MISSING_RECORD)}
          />
          <StatCard
            title="平均处理时长"
            value={`${typedStats.avgProcessTime}天`}
            subtitle="从受理到归档"
            icon="⏱️"
            color="bg-emerald-100 text-emerald-600"
            trend="0.8 天"
            trendUp={false}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BarChart
            title="状态分布"
            data={typedStats.byStatus}
            labelMap={STATUS_MAP}
            colorMap={statusColorMap}
            onBarClick={handleDrillByStatus}
          />
          
          <PieChart
            title="异常类型分布"
            data={typedStats.byType}
            labelMap={EXCEPTION_TYPE_MAP}
            onSliceClick={handleDrillByType}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TrendChart title="近7日核验趋势" />
          </div>
          
          <div className="card p-6">
            <h3 className="font-semibold text-slate-900 mb-4">处理人工作量</h3>
            <div className="space-y-4">
              {[
                { name: "李明", count: 28, avatar: "李" },
                { name: "王芳", count: 25, avatar: "王" },
                { name: "张伟", count: 18, avatar: "张" },
                { name: "陈杰", count: 15, avatar: "陈" },
                { name: "刘洋", count: 12, avatar: "刘" },
              ].map((person, index) => (
                <div key={person.name} className="flex items-center gap-3">
                  <span className="text-sm text-slate-400 w-4">{index + 1}</span>
                  <div className="w-8 h-8 bg-ocean-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {person.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-700">{person.name}</span>
                      <span className="text-sm font-medium text-slate-900">{person.count} 件</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-ocean-400 rounded-full"
                        style={{ width: `${(person.count / 28) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">最近异常记录</h3>
            <Link to="/records?exceptionType=missing_record" className="text-sm text-ocean-600 hover:underline">
              查看全部 →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 font-medium">记录编号</th>
                  <th className="pb-3 font-medium">异常类型</th>
                  <th className="pb-3 font-medium">状态</th>
                  <th className="pb-3 font-medium">责任人</th>
                  <th className="pb-3 font-medium">摘要</th>
                  <th className="pb-3 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {typedStats.recentRecords
                  .filter(r => r.exceptionType !== EXCEPTION_TYPES.NORMAL)
                  .slice(0, 5)
                  .map((record) => {
                    const statusInfo = STATUS_MAP[record.status] || { label: record.status, color: "text-slate-600", bgColor: "bg-slate-100" };
                    const typeInfo = EXCEPTION_TYPE_MAP[record.exceptionType] || { label: record.exceptionType, color: "text-slate-600", bgColor: "bg-slate-100" };
                    return (
                      <tr key={record.id} className="hover:bg-slate-50">
                        <td className="py-3">
                          <Link to={`/records/${record.id}`} className="text-ocean-600 hover:underline font-medium">
                            {record.recordNo}
                          </Link>
                        </td>
                        <td className="py-3">
                          <span className={cn("badge", typeInfo.bgColor, typeInfo.color)}>
                            {typeInfo.label}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={cn("badge", statusInfo.bgColor, statusInfo.color)}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="py-3 text-sm text-slate-700">{record.currentHandler}</td>
                        <td className="py-3 text-sm text-slate-600 max-w-xs truncate">
                          {record.summary}
                        </td>
                        <td className="py-3 text-right">
                          <Link to={`/processing/${record.id}`} className="text-sm text-ocean-600 hover:underline">
                            处理
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <DrillModal
        isOpen={drillModal.isOpen}
        onClose={() => setDrillModal({ ...drillModal, isOpen: false })}
        title={drillModal.title}
        records={drillModal.records}
        filterKey={drillModal.filterKey}
        filterValue={drillModal.filterValue}
      />
    </AppLayout>
  );
}
