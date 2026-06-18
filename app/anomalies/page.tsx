"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AnomalyAlert, BowArchive } from "@/lib/types";

const severityCls: Record<string, string> = {
  low: "bg-blue-100 text-blue-800 border-blue-300",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  high: "bg-red-100 text-red-800 border-red-300",
};

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<AnomalyAlert[]>([]);
  const [archives, setArchives] = useState<BowArchive[]>([]);
  const [severity, setSeverity] = useState("");

  useEffect(() => {
    fetch("/api/anomalies").then((r) => r.json()).then(setAnomalies);
    fetch("/api/archives").then((r) => r.json()).then(setArchives);
  }, []);

  const filtered = severity ? anomalies.filter((a) => a.severity === severity) : anomalies;
  const high = anomalies.filter((a) => a.severity === "high").length;
  const medium = anomalies.filter((a) => a.severity === "medium").length;
  const low = anomalies.filter((a) => a.severity === "low").length;

  return (
    <div className="space-y-5">
      <div className="card flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-bow-dark">⚠️ 异常数据提示</h1>
          <p className="text-sm text-leather-600 mt-1">基于弓型规则自动检测参数异常、空放风险和调弓隐患</p>
        </div>
        <select className="input !w-auto" value={severity} onChange={(e) => setSeverity(e.target.value)}>
          <option value="">全部级别</option>
          <option value="high">高风险</option>
          <option value="medium">中风险</option>
          <option value="low">低风险</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="stat !bg-red-50 !border-red-200">
          <span className="text-3xl font-bold text-red-600">{high}</span>
          <span className="text-xs text-red-700 mt-1">高风险异常</span>
        </div>
        <div className="stat !bg-yellow-50 !border-yellow-200">
          <span className="text-3xl font-bold text-yellow-700">{medium}</span>
          <span className="text-xs text-yellow-800 mt-1">中风险异常</span>
        </div>
        <div className="stat !bg-blue-50 !border-blue-200">
          <span className="text-3xl font-bold text-blue-600">{low}</span>
          <span className="text-xs text-blue-700 mt-1">低风险异常</span>
        </div>
      </div>

      <div className="card !p-0">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-leather-500">
            <p className="text-5xl mb-3">✅</p>
            <p className="font-medium">所有参数在常规范围内</p>
          </div>
        ) : (
          filtered.map((a) => {
            const arc = archives.find((x) => x.id === a.archiveId);
            return (
              <div
                key={a.id}
                className={`border-l-4 ${
                  a.severity === "high" ? "border-red-500" : a.severity === "medium" ? "border-yellow-500" : "border-blue-500"
                } p-4 border-b border-leather-100 last:border-b-0 hover:bg-leather-50/50`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`badge ${severityCls[a.severity]} border`}>
                        {a.severity === "high" ? "🚨 高风险" : a.severity === "medium" ? "⚠️ 中风险" : "ℹ️ 低风险"}
                      </span>
                      <span className="font-mono text-xs bg-leather-100 px-2 py-0.5 rounded text-leather-700">
                        字段: {a.field}
                      </span>
                      {arc && (
                        <Link href={`/archives/${arc.id}`} className="text-sm text-bow hover:underline">
                          🔗 {arc.name}
                        </Link>
                      )}
                    </div>
                    <p className="text-bow-dark">{a.message}</p>
                    {(a.expectedMin !== undefined || a.expectedMax !== undefined) && (
                      <p className="text-xs text-leather-500 mt-1">
                        建议范围: <span className="font-mono">{a.expectedMin ?? "—"} ~ {a.expectedMax ?? "—"}</span>
                      </p>
                    )}
                    <p className="text-xs text-leather-400 mt-1">
                      检测于 {new Date(a.detectedAt).toLocaleString("zh-CN")}
                    </p>
                  </div>
                  <div className="text-right min-w-[80px]">
                    <div className="text-2xl font-bold font-mono text-bow-dark">{String(a.value)}</div>
                    <div className="text-xs text-leather-500">当前值</div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
