import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { db } from "~/db";
import { complaints, users, complaintNodes } from "~/db/schema";
import { eq, desc, gte, and, count, sum } from "drizzle-orm";
import { STATUS_MAP, EXCEPTION_TYPE_MAP, formatDate, formatCurrency, formatNoise } from "~/lib/utils";
import { useState } from "react";

export async function loader() {
  const allComplaints = await db.query.complaints.findMany({
    with: {
      nodes: true,
      applicant: true,
    },
    orderBy: [desc(complaints.createdAt)],
  });

  const total = allComplaints.length;
  const archived = allComplaints.filter(c => c.currentStatus === "archived").length;
  const processing = allComplaints.filter(c => c.currentStatus === "processing" || c.currentStatus === "review").length;
  const exceptions = allComplaints.filter(c => c.hasException).length;

  const totalFine = allComplaints
    .filter(c => c.fineAmount)
    .reduce((sum, c) => sum + parseFloat(c.fineAmount as string), 0);

  const sourceStats: Record<string, number> = {};
  allComplaints.forEach(c => {
    sourceStats[c.source] = (sourceStats[c.source] || 0) + 1;
  });

  const statusStats: Record<string, number> = {};
  allComplaints.forEach(c => {
    statusStats[c.currentStatus] = (statusStats[c.currentStatus] || 0) + 1;
  });

  const exceptionStats: Record<string, number> = {};
  allComplaints.filter(c => c.hasException && c.exceptionType).forEach(c => {
    exceptionStats[c.exceptionType!] = (exceptionStats[c.exceptionType!] || 0) + 1;
  });

  const typeStats: Record<string, number> = {};
  allComplaints.filter(c => c.violationType).forEach(c => {
    typeStats[c.violationType!] = (typeStats[c.violationType!] || 0) + 1;
  });

  const avgNoiseBefore = allComplaints.filter(c => c.noiseLevelBefore).length > 0
    ? allComplaints.filter(c => c.noiseLevelBefore)
        .reduce((sum, c) => sum + parseFloat(c.noiseLevelBefore as string), 0) 
        / allComplaints.filter(c => c.noiseLevelBefore).length
    : 0;

  const avgNoiseAfter = allComplaints.filter(c => c.noiseLevelAfter).length > 0
    ? allComplaints.filter(c => c.noiseLevelAfter)
        .reduce((sum, c) => sum + parseFloat(c.noiseLevelAfter as string), 0)
        / allComplaints.filter(c => c.noiseLevelAfter).length
    : 0;

  const recentComplaints = allComplaints.slice(0, 5);
  const exceptionComplaints = allComplaints.filter(c => c.hasException);

  return json({
    stats: {
      total,
      archived,
      processing,
      exceptions,
      totalFine,
      avgNoiseBefore,
      avgNoiseAfter,
      avgReduction: avgNoiseBefore && avgNoiseAfter ? avgNoiseBefore - avgNoiseAfter : 0,
      closureRate: total > 0 ? (archived / total * 100).toFixed(1) : "0",
    },
    sourceStats,
    statusStats,
    exceptionStats,
    typeStats,
    recentComplaints,
    exceptionComplaints,
    allComplaints,
  });
}

export default function ReviewPage() {
  const { stats, sourceStats, statusStats, exceptionStats, typeStats, recentComplaints, exceptionComplaints, allComplaints } = useLoaderData<typeof loader>();
  const [drillDown, setDrillDown] = useState<{ type: string; value: string } | null>(null);

  const getFilteredComplaints = () => {
    if (!drillDown) return [];
    return allComplaints.filter(c => {
      switch (drillDown.type) {
        case "status":
          return c.currentStatus === drillDown.value;
        case "source":
          return c.source === drillDown.value;
        case "exception":
          return c.exceptionType === drillDown.value;
        case "violationType":
          return c.violationType === drillDown.value;
        default:
          return false;
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">复盘统计看板</h1>
          <p className="text-slate-500 text-sm mt-1">实时统计数据，点击图表可钻取查看具体案件</p>
        </div>
        <div className="text-sm text-slate-500">
          数据更新时间：{formatDate(new Date())}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="案件总数"
          value={stats.total.toString()}
          icon="📋"
          gradient="from-blue-500 to-blue-600"
          onClick={() => setDrillDown({ type: "status", value: "all" })}
        />
        <StatCard
          label="已结案"
          value={stats.archived.toString()}
          icon="✅"
          gradient="from-green-500 to-green-600"
          onClick={() => setDrillDown({ type: "status", value: "archived" })}
          subtitle={`结案率 ${stats.closureRate}%`}
        />
        <StatCard
          label="处理中"
          value={stats.processing.toString()}
          icon="🔧"
          gradient="from-amber-500 to-amber-600"
          onClick={() => setDrillDown({ type: "status", value: "processing" })}
        />
        <StatCard
          label="异常案件"
          value={stats.exceptions.toString()}
          icon="⚠️"
          gradient="from-red-500 to-red-600"
          onClick={() => setDrillDown({ type: "exception", value: "all" })}
          alert={stats.exceptions > 0}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="罚款总额"
          value={formatCurrency(stats.totalFine)}
          icon="💰"
          gradient="from-purple-500 to-purple-600"
          large
        />
        <StatCard
          label="平均降噪"
          value={`${stats.avgReduction.toFixed(1)} dB`}
          icon="🔇"
          gradient="from-teal-500 to-teal-600"
          large
          subtitle={`${stats.avgNoiseBefore.toFixed(1)} → ${stats.avgNoiseAfter.toFixed(1)} dB`}
        />
        <StatCard
          label="案件来源数"
          value={Object.keys(sourceStats).length.toString()}
          icon="📡"
          gradient="from-indigo-500 to-indigo-600"
          large
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">📊 状态分布</h3>
          <div className="space-y-3">
            {Object.entries(statusStats).map(([status, count]) => {
              const info = STATUS_MAP[status] || { label: status, color: "text-gray-700", bgColor: "bg-gray-100" };
              const percentage = ((count / stats.total) * 100).toFixed(1);
              return (
                <button
                  key={status}
                  onClick={() => setDrillDown({ type: "status", value: status })}
                  className="w-full text-left group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${info.bgColor} ${info.color}`}>
                        {info.label}
                      </span>
                      <span className="text-sm text-slate-500">{count} 件</span>
                    </div>
                    <span className="text-sm text-slate-400 group-hover:text-blue-600">{percentage}% →</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${info.bgColor.replace("bg-", "bg-").replace("-100", "-500")}`}
                      style={{ width: `${percentage}%`, backgroundColor: status === "archived" ? "#10b981" : status === "processing" ? "#3b82f6" : status === "review" ? "#f59e0b" : status === "rejected" ? "#ef4444" : "#94a3b8" }}
                    ></div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">📡 来源分布</h3>
          <div className="space-y-3">
            {Object.entries(sourceStats).map(([source, count]) => {
              const percentage = ((count / stats.total) * 100).toFixed(1);
              return (
                <button
                  key={source}
                  onClick={() => setDrillDown({ type: "source", value: source })}
                  className="w-full text-left group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {source}
                      </span>
                      <span className="text-sm text-slate-500">{count} 件</span>
                    </div>
                    <span className="text-sm text-slate-400 group-hover:text-blue-600">{percentage}% →</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">⚠️ 异常类型分布</h3>
          {Object.keys(exceptionStats).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(exceptionStats).map(([type, count]) => {
                const info = EXCEPTION_TYPE_MAP[type] || { label: type, color: "text-gray-600" };
                return (
                  <button
                    key={type}
                    onClick={() => setDrillDown({ type: "exception", value: type })}
                    className="w-full p-3 bg-red-50 hover:bg-red-100 rounded-lg text-left transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-200 rounded-full flex items-center justify-center">
                          ⚠️
                        </div>
                        <div>
                          <p className={`font-medium ${info.color}`}>{info.label}</p>
                          <p className="text-xs text-slate-500">{count} 件异常</p>
                        </div>
                      </div>
                      <span className="text-red-500 group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <div className="text-3xl mb-2">✅</div>
              暂无异常案件
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">🏢 违法类型分布</h3>
          {Object.keys(typeStats).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(typeStats).map(([type, count]) => {
                const percentage = ((count / stats.total) * 100).toFixed(1);
                return (
                  <button
                    key={type}
                    onClick={() => setDrillDown({ type: "violationType", value: type })}
                    className="w-full text-left group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                          {type}
                        </span>
                        <span className="text-sm text-slate-500">{count} 件</span>
                      </div>
                      <span className="text-sm text-slate-400 group-hover:text-purple-600">{percentage}% →</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              暂无数据
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">🔔 异常案件列表</h3>
        {exceptionComplaints.length > 0 ? (
          <div className="space-y-3">
            {exceptionComplaints.map((c) => {
              const info = c.exceptionType ? EXCEPTION_TYPE_MAP[c.exceptionType] : null;
              return (
                <Link
                  key={c.id}
                  to={`/complaints/${c.id}`}
                  className="block p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-slate-500">{c.caseNo}</span>
                        {info && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 ${info.color}`}>
                            {info.label}
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-slate-900">{c.title}</p>
                      {c.blockingReason && (
                        <p className="text-sm text-red-600 mt-2">⚠️ {c.blockingReason}</p>
                      )}
                    </div>
                    <span className="text-slate-400">→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <div className="text-3xl mb-2">✅</div>
            暂无异常案件
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">🕐 最近案件</h3>
        <div className="space-y-3">
          {recentComplaints.map((c) => {
            const statusInfo = STATUS_MAP[c.currentStatus] || { label: c.currentStatus, color: "text-gray-700", bgColor: "bg-gray-100" };
            return (
              <Link
                key={c.id}
                to={`/complaints/${c.id}`}
                className="block p-4 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-slate-500">{c.caseNo}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      {c.hasException && (
                        <span className="text-red-500 text-xs">⚠️ 异常</span>
                      )}
                    </div>
                    <p className="font-medium text-slate-900">{c.title}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {c.source} · {formatDate(c.createdAt)}
                    </p>
                  </div>
                  <span className="text-slate-400">→</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {drillDown && (
        <DrillDownModal
          drillDown={drillDown}
          complaints={getFilteredComplaints()}
          allComplaints={allComplaints}
          onClose={() => setDrillDown(null)}
        />
      )}
    </div>
  );
}

function DrillDownModal({ drillDown, complaints, allComplaints, onClose }: {
  drillDown: { type: string; value: string };
  complaints: any[];
  allComplaints: any[];
  onClose: () => void;
}) {
  const displayComplaints = drillDown.value === "all" ? allComplaints : complaints;
  
  let title = "";
  let subtitle = "";
  switch (drillDown.type) {
    case "status":
      const statusLabel = STATUS_MAP[drillDown.value]?.label || "全部";
      title = drillDown.value === "all" ? "全部案件" : `${statusLabel}案件`;
      subtitle = `共 ${displayComplaints.length} 件`;
      break;
    case "source":
      title = `${drillDown.value}来源案件`;
      subtitle = `共 ${displayComplaints.length} 件`;
      break;
    case "exception":
      const exLabel = EXCEPTION_TYPE_MAP[drillDown.value]?.label || "全部异常";
      title = drillDown.value === "all" ? "全部异常案件" : `${exLabel}案件`;
      subtitle = `共 ${displayComplaints.length} 件`;
      break;
    case "violationType":
      title = `${drillDown.value}案件`;
      subtitle = `共 ${displayComplaints.length} 件`;
      break;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900">🔍 {title}</h3>
            <p className="text-sm text-slate-500 mt-1">{subtitle} · 点击可查看详情</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {displayComplaints.length > 0 ? (
            <div className="space-y-2">
              {displayComplaints.map((c) => {
                const statusInfo = STATUS_MAP[c.currentStatus] || { label: c.currentStatus, color: "text-gray-700", bgColor: "bg-gray-100" };
                return (
                  <Link
                    key={c.id}
                    to={`/complaints/${c.id}`}
                    onClick={onClose}
                    className="block p-4 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm text-slate-500">{c.caseNo}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                          {c.hasException && (
                            <span className="text-red-500 text-xs">⚠️</span>
                          )}
                        </div>
                        <p className="font-medium text-slate-900">{c.title}</p>
                        <div className="flex gap-4 mt-2 text-xs text-slate-500">
                          <span>📍 {c.location}</span>
                          <span>💰 {formatCurrency(c.fineAmount)}</span>
                          <span>📡 {c.source}</span>
                        </div>
                      </div>
                      <span className="text-blue-500">→</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400">
              <div className="text-4xl mb-3">📭</div>
              暂无数据
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, gradient, onClick, subtitle, large, alert }: {
  label: string;
  value: string;
  icon: string;
  gradient: string;
  onClick?: () => void;
  subtitle?: string;
  large?: boolean;
  alert?: boolean;
}) {
  const baseClasses = "bg-white rounded-xl shadow-sm border border-slate-200 p-5 transition-all hover:shadow-md";
  const clickableClasses = onClick ? "cursor-pointer hover:scale-[1.02] active:scale-[0.98]" : "";
  const alertClasses = alert ? "ring-2 ring-red-300 ring-opacity-50 animate-pulse" : "";

  return (
    <div
      onClick={onClick}
      className={`${baseClasses} ${clickableClasses} ${alertClasses} ${large ? "p-6" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className={`font-bold text-slate-800 mt-2 ${large ? "text-3xl" : "text-2xl"}`}>{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xl`}>
          {icon}
        </div>
      </div>
      {onClick && (
        <p className="text-xs text-blue-500 mt-3">点击钻取查看 →</p>
      )}
    </div>
  );
}
