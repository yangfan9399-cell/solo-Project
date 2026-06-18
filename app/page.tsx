"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { BowArchive } from "@/lib/types";

interface Stats {
  archivesTotal: number;
  active: number;
  archived: number;
  anomaliesTotal: number;
  anomaliesHigh: number;
  equipmentTotal: number;
  avgDrawWeight: number;
}

const statusMap: Record<string, { label: string; cls: string }> = {
  active: { label: "使用中", cls: "bg-green-100 text-green-800" },
  archived: { label: "已归档", cls: "bg-leather-200 text-leather-700" },
  testing: { label: "调试中", cls: "bg-yellow-100 text-yellow-800" },
};

export default function Home() {
  const [archives, setArchives] = useState<BowArchive[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [status, setStatus] = useState("");
  const [bowType, setBowType] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setStats);
  }, []);

  useEffect(() => {
    const q = new URLSearchParams();
    if (status) q.set("status", status);
    if (bowType) q.set("bowType", bowType);
    if (search) q.set("search", search);
    fetch(`/api/archives?${q.toString()}`)
      .then((r) => r.json())
      .then(setArchives);
  }, [status, bowType, search]);

  const bowTypes = Array.from(new Set(archives.map((a) => a.bowType)));

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="stat">
          <span className="text-3xl font-bold text-bow">{stats?.archivesTotal ?? "—"}</span>
          <span className="text-xs text-leather-600 mt-1">档案总数</span>
        </div>
        <div className="stat">
          <span className="text-3xl font-bold text-green-700">{stats?.active ?? "—"}</span>
          <span className="text-xs text-leather-600 mt-1">使用中</span>
        </div>
        <div className="stat">
          <span className="text-3xl font-bold text-leather-500">{stats?.archived ?? "—"}</span>
          <span className="text-xs text-leather-600 mt-1">已归档</span>
        </div>
        <div className="stat">
          <span className="text-3xl font-bold text-red-600">{stats?.anomaliesHigh ?? "—"}</span>
          <span className="text-xs text-leather-600 mt-1">高风险异常</span>
        </div>
        <div className="stat">
          <span className="text-3xl font-bold text-orange-600">{stats?.anomaliesTotal ?? "—"}</span>
          <span className="text-xs text-leather-600 mt-1">异常总数</span>
        </div>
        <div className="stat">
          <span className="text-3xl font-bold text-bow">{stats?.equipmentTotal ?? "—"}</span>
          <span className="text-xs text-leather-600 mt-1">器材条目</span>
        </div>
        <div className="stat">
          <span className="text-3xl font-bold text-bow">{stats?.avgDrawWeight ?? "—"}<span className="text-base text-leather-500">lb</span></span>
          <span className="text-xs text-leather-600 mt-1">平均拉力</span>
        </div>
      </section>

      <section className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold text-bow-dark">调弓参数台账</h2>
          <div className="flex flex-wrap gap-2">
            <input
              className="input !w-auto min-w-[180px]"
              placeholder="🔍 搜索名称/备注/弓型..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className="input !w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">全部状态</option>
              <option value="active">使用中</option>
              <option value="testing">调试中</option>
              <option value="archived">已归档</option>
            </select>
            <select className="input !w-auto" value={bowType} onChange={(e) => setBowType(e.target.value)}>
              <option value="">全部弓型</option>
              {bowTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-leather-200 text-left text-leather-600">
                <th className="py-2 px-3">档案名称</th>
                <th className="py-2 px-3">弓型</th>
                <th className="py-2 px-3">弓长</th>
                <th className="py-2 px-3">拉力</th>
                <th className="py-2 px-3">弦距</th>
                <th className="py-2 px-3">箭重</th>
                <th className="py-2 px-3">撒放</th>
                <th className="py-2 px-3">状态</th>
                <th className="py-2 px-3">更新时间</th>
                <th className="py-2 px-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {archives.length === 0 && (
                <tr><td colSpan={10} className="py-8 text-center text-leather-500">暂无档案数据</td></tr>
              )}
              {archives.map((a) => (
                <tr key={a.id} className="border-b border-leather-100 hover:bg-leather-50">
                  <td className="py-2 px-3">
                    <Link href={`/archives/${a.id}`} className="font-medium text-bow hover:underline">
                      {a.name}
                    </Link>
                  </td>
                  <td className="py-2 px-3 text-leather-700">{a.bowType}</td>
                  <td className="py-2 px-3">{a.bowLength}&quot;</td>
                  <td className="py-2 px-3">{a.drawWeight} lb</td>
                  <td className="py-2 px-3">{a.braceHeight}&quot;</td>
                  <td className="py-2 px-3">{a.arrowWeight} gr</td>
                  <td className="py-2 px-3">{a.releaseType}</td>
                  <td className="py-2 px-3">
                    <span className={`badge ${statusMap[a.status]?.cls ?? ""}`}>
                      {statusMap[a.status]?.label ?? a.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-xs text-leather-500">
                    {new Date(a.updatedAt).toLocaleString("zh-CN")}
                  </td>
                  <td className="py-2 px-3">
                    <Link href={`/archives/${a.id}`} className="text-bow hover:underline">详情</Link>
                    <span className="mx-2 text-leather-300">·</span>
                    <Link href={`/archives/${a.id}?tab=versions`} className="text-bow hover:underline">版本</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
