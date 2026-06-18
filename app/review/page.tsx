"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ReviewData {
  archivesTotal: number;
  byBowType: Record<string, number>;
  byStatus: Record<string, number>;
  avgDrawWeight: number;
  avgBraceHeight: number;
  avgArrowWeight: number;
  anomalyStats: {
    total: number;
    bySeverity: Record<string, number>;
    byField: Record<string, number>;
  };
  versionStats: {
    total: number;
    batchCount: number;
    byBatch: Record<string, number>;
  };
  targetStats: {
    totalArrows: number;
    totalScore: number;
    avgScore: number;
  };
  recentVersions: {
    id: string;
    archiveId: string;
    versionNumber: number;
    batchCode: string;
    changeLog: string;
    createdBy: string;
    createdAt: string;
    archiveName: string;
  }[];
}

const bowTypeLabels: Record<string, string> = {
  recurve: "竞技反曲",
  compound: "复合",
  traditional: "传统角弓",
  "traditional-wood": "传统木弓",
  longbow: "英式长弓",
  barebow: "光弓",
};

const statusLabels: Record<string, string> = {
  active: "使用中",
  archived: "已归档",
  testing: "调试中",
};

const severityLabels: Record<string, { label: string; cls: string }> = {
  high: { label: "高风险", cls: "text-red-600" },
  medium: { label: "中风险", cls: "text-yellow-600" },
  low: { label: "低风险", cls: "text-blue-600" },
};

const fieldLabels: Record<string, string> = {
  bowLength: "弓长",
  drawWeight: "拉力",
  braceHeight: "弦距",
  arrowWeight: "箭重",
  gpp: "GPP",
  tipWeight: "弓梢差",
  nockingPoint: "搭箭点",
  tillerTop: "上梢差",
  tillerBottom: "下梢差",
  stringStrands: "弦股数",
  centerShot: "中心射",
  plungerTension: "弹簧张力",
};

export default function ReviewPage() {
  const [data, setData] = useState<ReviewData | null>(null);

  useEffect(() => {
    fetch("/api/review").then((r) => r.json()).then(setData);
  }, []);

  if (!data) {
    return <div className="card text-center py-12 text-leather-500">加载中...</div>;
  }

  const topAnomalyFields = Object.entries(data.anomalyStats.byField)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  const maxFieldCount = topAnomalyFields.length > 0 ? topAnomalyFields[0][1] : 1;

  return (
    <div className="space-y-5">
      <div className="card">
        <h1 className="text-2xl font-bold text-bow-dark">📊 复盘聚合</h1>
        <p className="text-sm text-leather-600 mt-1">跨档案统计、批次趋势、异常分布与靶纸汇总</p>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="stat">
          <span className="text-3xl font-bold text-bow">{data.archivesTotal}</span>
          <span className="text-xs text-leather-600 mt-1">档案总数</span>
        </div>
        <div className="stat">
          <span className="text-3xl font-bold text-bow">{data.versionStats.total}</span>
          <span className="text-xs text-leather-600 mt-1">版本快照</span>
        </div>
        <div className="stat">
          <span className="text-3xl font-bold text-bow">{data.versionStats.batchCount}</span>
          <span className="text-xs text-leather-600 mt-1">批次数量</span>
        </div>
        <div className="stat">
          <span className="text-3xl font-bold text-red-600">{data.anomalyStats.total}</span>
          <span className="text-xs text-leather-600 mt-1">异常总数</span>
        </div>
        <div className="stat">
          <span className="text-3xl font-bold text-bow">{data.targetStats.totalArrows}</span>
          <span className="text-xs text-leather-600 mt-1">累计箭数</span>
        </div>
        <div className="stat">
          <span className="text-3xl font-bold text-bow">{data.targetStats.avgScore}<span className="text-base text-leather-500">环</span></span>
          <span className="text-xs text-leather-600 mt-1">平均环值</span>
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="card">
          <h3 className="font-bold text-bow-dark mb-3">弓型分布</h3>
          {Object.keys(data.byBowType).length === 0 ? (
            <p className="text-leather-500 text-sm">暂无数据</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(data.byBowType).map(([k, v]) => (
                <div key={k} className="flex items-center gap-3">
                  <span className="text-sm text-leather-700 w-20">{bowTypeLabels[k] ?? k}</span>
                  <div className="flex-1 bg-leather-100 rounded-full h-5 overflow-hidden">
                    <div
                      className="bg-bow h-full rounded-full transition-all"
                      style={{ width: `${Math.max((v / data.archivesTotal) * 100, 5)}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-bow-dark w-8 text-right">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="font-bold text-bow-dark mb-3">状态分布</h3>
          <div className="space-y-2">
            {Object.entries(data.byStatus).map(([k, v]) => (
              <div key={k} className="flex items-center gap-3">
                <span className="text-sm text-leather-700 w-20">{statusLabels[k] ?? k}</span>
                <div className="flex-1 bg-leather-100 rounded-full h-5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      k === "active" ? "bg-green-600" : k === "archived" ? "bg-leather-400" : "bg-yellow-500"
                    }`}
                    style={{ width: `${Math.max((v / data.archivesTotal) * 100, 5)}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-bow-dark w-8 text-right">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="card">
          <h3 className="font-bold text-bow-dark mb-3">参数均值</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded bg-leather-50 border border-leather-100 text-center">
              <div className="text-2xl font-bold text-bow">{data.avgDrawWeight}</div>
              <div className="text-xs text-leather-500">平均拉力 (lb)</div>
            </div>
            <div className="p-3 rounded bg-leather-50 border border-leather-100 text-center">
              <div className="text-2xl font-bold text-bow">{data.avgBraceHeight}</div>
              <div className="text-xs text-leather-500">平均弦距 (")</div>
            </div>
            <div className="p-3 rounded bg-leather-50 border border-leather-100 text-center">
              <div className="text-2xl font-bold text-bow">{data.avgArrowWeight}</div>
              <div className="text-xs text-leather-500">平均箭重 (gr)</div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="font-bold text-bow-dark mb-3">异常分布</h3>
          <div className="flex gap-4 mb-3">
            {Object.entries(data.anomalyStats.bySeverity).map(([k, v]) => (
              <div key={k} className="text-center">
                <span className={`text-2xl font-bold ${severityLabels[k]?.cls ?? "text-bow"}`}>{v}</span>
                <div className="text-xs text-leather-500">{severityLabels[k]?.label ?? k}</div>
              </div>
            ))}
          </div>
          {topAnomalyFields.length > 0 ? (
            <div className="space-y-1.5">
              {topAnomalyFields.map(([k, v]) => (
                <div key={k} className="flex items-center gap-2">
                  <span className="text-xs text-leather-600 w-16">{fieldLabels[k] ?? k}</span>
                  <div className="flex-1 bg-leather-100 rounded h-3 overflow-hidden">
                    <div
                      className="bg-red-400 h-full rounded transition-all"
                      style={{ width: `${(v / maxFieldCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-bow-dark w-6 text-right">{v}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-leather-500">✅ 无异常数据</p>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="font-bold text-bow-dark mb-3">批次概览</h3>
        {Object.keys(data.versionStats.byBatch).length === 0 ? (
          <p className="text-leather-500 text-sm">暂无批次数据</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.versionStats.byBatch)
              .sort(([, a], [, b]) => b - a)
              .map(([batch, count]) => (
                <span key={batch} className="badge bg-leather-200 text-leather-800 font-mono">
                  {batch} <span className="ml-1 text-leather-600">×{count}</span>
                </span>
              ))}
          </div>
        )}
      </div>

      <div className="card !p-0">
        <div className="p-4 border-b border-leather-200">
          <h3 className="font-bold text-bow-dark">最近版本变更</h3>
        </div>
        {data.recentVersions.length === 0 ? (
          <div className="p-8 text-center text-leather-500">暂无版本记录</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-leather-100 text-leather-700">
              <tr>
                <th className="py-2 px-4 text-left">档案</th>
                <th className="py-2 px-4 text-left">版本</th>
                <th className="py-2 px-4 text-left">批次</th>
                <th className="py-2 px-4 text-left">变更记录</th>
                <th className="py-2 px-4 text-left">操作员</th>
                <th className="py-2 px-4 text-left">时间</th>
              </tr>
            </thead>
            <tbody>
              {data.recentVersions.map((v) => (
                <tr key={v.id} className="border-t border-leather-100 hover:bg-leather-50">
                  <td className="py-2 px-4">
                    <Link href={`/archives/${v.archiveId}`} className="text-bow hover:underline">{v.archiveName || v.archiveId.slice(0, 8)}</Link>
                  </td>
                  <td className="py-2 px-4 font-mono">v{v.versionNumber}</td>
                  <td className="py-2 px-4 font-mono text-xs">{v.batchCode}</td>
                  <td className="py-2 px-4 max-w-[200px] truncate">{v.changeLog || "—"}</td>
                  <td className="py-2 px-4 text-leather-600">{v.createdBy}</td>
                  <td className="py-2 px-4 text-xs text-leather-500">{new Date(v.createdAt).toLocaleString("zh-CN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
