"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ExportSummary, BowArchive } from "@/lib/types";

export default function ExportsPage() {
  const params = useSearchParams();
  const archiveId = params.get("archiveId") || "";
  const [exports, setExports] = useState<ExportSummary[]>([]);
  const [archives, setArchives] = useState<BowArchive[]>([]);
  const [format, setFormat] = useState<"text" | "json">("text");
  const [selectedArchive, setSelectedArchive] = useState(archiveId);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/exports").then((r) => r.json()).then(setExports);
    fetch("/api/archives").then((r) => r.json()).then(setArchives);
  }, []);

  const runExport = async () => {
    const res = await fetch("/api/exports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archiveId: selectedArchive || null, format }),
    });
    if (res.ok) {
      const created = await res.json();
      setPreview(created.content);
      fetch("/api/exports").then((r) => r.json()).then(setExports);
    }
  };

  const download = (e: ExportSummary) => {
    const ext = e.format === "json" ? "json" : e.format === "csv" ? "csv" : "txt";
    const mime = e.format === "json" ? "application/json" : "text/plain";
    const blob = new Blob([e.content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `archery-archive-${e.id.slice(0, 6)}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-bow-dark">📤 导出摘要</h1>
            <p className="text-sm text-leather-600 mt-1">生成调弓参数档案的导出摘要，支持文本与 JSON 格式</p>
          </div>
        </div>
        <div className="mt-4 grid md:grid-cols-4 gap-3">
          <div>
            <label className="label">选择档案</label>
            <select className="input" value={selectedArchive} onChange={(e) => setSelectedArchive(e.target.value)}>
              <option value="">— 全部档案 —</option>
              {archives.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">导出格式</label>
            <select className="input" value={format} onChange={(e) => setFormat(e.target.value as any)}>
              <option value="text">文本摘要 (.txt)</option>
              <option value="json">JSON 数据 (.json)</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="btn btn-primary" onClick={runExport}>📤 生成导出</button>
          </div>
        </div>
        {preview && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-bow-dark">📋 导出预览</h4>
              <button
                className="btn btn-secondary text-sm"
                onClick={() => {
                  const blob = new Blob([preview!], { type: format === "json" ? "application/json" : "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `archery-export.${format === "json" ? "json" : "txt"}`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >⬇️ 下载</button>
            </div>
            <pre className="bg-leather-50 border border-leather-200 rounded p-3 text-xs font-mono overflow-auto max-h-[320px] whitespace-pre-wrap">
              {preview}
            </pre>
          </div>
        )}
      </div>

      <div className="card !p-0">
        <div className="p-4 border-b border-leather-200">
          <h3 className="font-bold text-bow-dark">历史导出记录（{exports.length}）</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-leather-100 text-leather-700">
            <tr>
              <th className="py-2 px-4 text-left">时间</th>
              <th className="py-2 px-4 text-left">关联档案</th>
              <th className="py-2 px-4 text-left">格式</th>
              <th className="py-2 px-4 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {exports.length === 0 && (
              <tr><td colSpan={4} className="py-10 text-center text-leather-500">暂无导出记录</td></tr>
            )}
            {exports.map((e) => {
              const a = archives.find((x) => x.id === e.archiveId);
              return (
                <tr key={e.id} className="border-t border-leather-100 hover:bg-leather-50">
                  <td className="py-2 px-4 text-xs text-leather-600">
                    {new Date(e.exportedAt).toLocaleString("zh-CN")}
                  </td>
                  <td className="py-2 px-4">{a?.name ?? "全部档案"}</td>
                  <td className="py-2 px-4">
                    <span className="badge bg-leather-200 text-leather-700">{e.format.toUpperCase()}</span>
                  </td>
                  <td className="py-2 px-4">
                    <button className="text-bow hover:underline mr-3" onClick={() => setPreview(e.content)}>查看</button>
                    <button className="text-bow hover:underline" onClick={() => download(e)}>下载</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
