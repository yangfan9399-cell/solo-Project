"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { BowArchive, BowVersion, TargetPoint, AnomalyAlert, Equipment } from "@/lib/types";
import TargetBoard from "@/components/TargetBoard";

interface Props {
  params: Promise<{ id: string }>;
}

const statusMap: Record<string, { label: string; cls: string }> = {
  active: { label: "使用中", cls: "bg-green-100 text-green-800" },
  archived: { label: "已归档", cls: "bg-leather-200 text-leather-700" },
  testing: { label: "调试中", cls: "bg-yellow-100 text-yellow-800" },
};

const severityCls: Record<string, string> = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

export default function ArchiveDetail({ params }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [id, setId] = useState<string>("");
  const [archive, setArchive] = useState<BowArchive | null>(null);
  const [versions, setVersions] = useState<BowVersion[]>([]);
  const [points, setPoints] = useState<TargetPoint[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyAlert[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState(searchParams.get("tab") || "params");
  const [form, setForm] = useState<Partial<BowArchive>>({});
  const [newVersion, setNewVersion] = useState({ changeLog: "", createdBy: "" });

  useEffect(() => {
    params.then((p) => {
      setId(p.id);
      fetch(`/api/archives/${p.id}`).then((r) => r.json()).then((a) => {
        setArchive(a);
        setForm(a);
      });
      fetch(`/api/archives/${p.id}/versions`).then((r) => r.json()).then(setVersions);
      fetch(`/api/archives/${p.id}/points`).then((r) => r.json()).then(setPoints);
      fetch(`/api/archives/${p.id}/anomalies`).then((r) => r.json()).then(setAnomalies);
    });
    fetch("/api/equipment").then((r) => r.json()).then(setEquipment);
  }, [params]);

  if (!archive) {
    return <div className="card text-center py-12">加载中...</div>;
  }

  const saveForm = async () => {
    const res = await fetch(`/api/archives/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const updated = await res.json();
      setArchive(updated);
      setEditing(false);
      fetch(`/api/archives/${id}/anomalies`).then((r) => r.json()).then(setAnomalies);
    }
  };

  const createVersion = async () => {
    if (!newVersion.changeLog) return alert("请填写变更记录");
    const batchCode = `BATCH-${Date.now().toString(36).toUpperCase()}`;
    const res = await fetch(`/api/archives/${id}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        versionNumber: (versions[0]?.versionNumber ?? 0) + 1,
        batchCode,
        changeLog: newVersion.changeLog,
        createdBy: newVersion.createdBy || "匿名",
        snapshot: archive,
      }),
    });
    if (res.ok) {
      setNewVersion({ changeLog: "", createdBy: "" });
      fetch(`/api/archives/${id}/versions`).then((r) => r.json()).then(setVersions);
    }
  };

  const removeArchive = async () => {
    if (!confirm("确认删除此档案？此操作不可撤销。")) return;
    await fetch(`/api/archives/${id}`, { method: "DELETE" });
    router.push("/");
  };

  const tabs = [
    { k: "params", label: "📐 参数详情" },
    { k: "target", label: "🎯 靶纸标点" },
    { k: "versions", label: "📜 版本批次" },
    { k: "anomalies", label: "⚠️ 异常提示" },
  ];

  return (
    <div className="space-y-5">
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-bow-dark">{archive.name}</h1>
              <span className={`badge ${statusMap[archive.status]?.cls ?? ""}`}>
                {statusMap[archive.status]?.label ?? archive.status}
              </span>
              {anomalies.filter((a) => a.severity === "high").length > 0 && (
                <span className="badge bg-red-100 text-red-700">
                  ⚠️ {anomalies.filter((a) => a.severity === "high").length} 项高风险
                </span>
              )}
            </div>
            <p className="text-sm text-leather-600">
              {archive.bowType} · 弓长 {archive.bowLength}&quot; · 拉力 {archive.drawWeight} lb · 弦距 {archive.braceHeight}&quot;
              {" · "}更新于 {new Date(archive.updatedAt).toLocaleString("zh-CN")}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-secondary" onClick={() => router.push("/")}>← 返回</button>
            <button
              className="btn btn-secondary"
              onClick={() => router.push(`/exports?archiveId=${id}`)}
            >📤 导出</button>
            {!editing ? (
              <button className="btn btn-primary" onClick={() => setEditing(true)}>✏️ 编辑</button>
            ) : (
              <>
                <button className="btn btn-secondary" onClick={() => { setEditing(false); setForm(archive); }}>取消</button>
                <button className="btn btn-primary" onClick={saveForm}>💾 保存</button>
              </>
            )}
            <button className="btn btn-danger" onClick={removeArchive}>🗑</button>
          </div>
        </div>
      </div>

      {anomalies.length > 0 && tab !== "anomalies" && (
        <div className={`border-l-4 ${anomalies.some((a) => a.severity === "high") ? "border-red-500 bg-red-50" : "border-yellow-500 bg-yellow-50"} p-4 rounded-r-md`}>
          <div className="flex items-center justify-between">
            <span className="font-semibold">检测到 {anomalies.length} 项参数异常</span>
            <button className="text-sm text-bow hover:underline" onClick={() => setTab("anomalies")}>查看详情 →</button>
          </div>
        </div>
      )}

      <div className="flex gap-2 border-b border-leather-200">
        {tabs.map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`px-4 py-2 -mb-px border-b-2 transition ${
              tab === t.k ? "border-bow text-bow font-semibold" : "border-transparent text-leather-600 hover:text-bow"
            }`}
          >
            {t.label}
            {t.k === "anomalies" && anomalies.length > 0 && (
              <span className="ml-1 px-1.5 rounded-full bg-red-500 text-white text-xs">{anomalies.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "params" && (
        <div className="card">
          <h3 className="font-bold text-lg text-bow-dark mb-4">调弓参数</h3>
          {!editing ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              {[
                ["弓型", archive.bowType],
                ["弓长", `${archive.bowLength} 英寸`],
                ["拉力 (Draw Weight)", `${archive.drawWeight} lb`],
                ["弦距 (Brace Height)", `${archive.braceHeight} 英寸`],
                ["箭重", `${archive.arrowWeight} 格令 (gr)`],
                ["箭杆挠度 (Spine)", archive.arrowSpine],
                ["撒放方式", archive.releaseType],
                ["弓弦材质", archive.stringMaterial],
                ["弦股数", `${archive.stringStrands} 股`],
                ["搭箭点位置", `${archive.nockingPoint} cm`],
                ["上弓梢梢差", `${archive.tillerTop} 英寸`],
                ["下弓梢梢差", `${archive.tillerBottom} 英寸`],
                ["弓片对齐", archive.limbAlignment],
                ["中心射偏移", `${archive.centerShot} mm`],
                ["箭台弹簧", archive.plungerSpring],
                ["弹簧张力", `${archive.plungerTension} 档`],
                ["瞄点标记", archive.sightMark ? `${archive.sightMark}` : "—"],
                ["关联器材", equipment.find((e) => e.id === archive.equipmentId)?.name ?? "未关联"],
              ].map(([k, v]) => (
                <div key={k} className="p-3 rounded-md bg-leather-50 border border-leather-100">
                  <div className="text-xs text-leather-500 mb-1">{k}</div>
                  <div className="font-medium text-bow-dark">{v}</div>
                </div>
              ))}
              <div className="md:col-span-2 lg:col-span-4 p-3 rounded-md bg-leather-50 border border-leather-100">
                <div className="text-xs text-leather-500 mb-1">备注</div>
                <div className="text-bow-dark whitespace-pre-wrap">{archive.notes || "—"}</div>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              <Field label="档案名称" required>
                <input className="input" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="弓型" required>
                <select className="input" value={form.bowType || ""} onChange={(e) => setForm({ ...form, bowType: e.target.value })}>
                  <option>Recurve 竞技反曲</option>
                  <option>Compound 复合</option>
                  <option>Traditional 传统角弓</option>
                  <option>Traditional 传统木弓</option>
                  <option>Longbow 英式长弓</option>
                  <option>Barebow 光弓</option>
                </select>
              </Field>
              <Field label="状态">
                <select className="input" value={form.status || "active"} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
                  <option value="active">使用中</option>
                  <option value="testing">调试中</option>
                  <option value="archived">已归档</option>
                </select>
              </Field>
              <Field label="弓长 (英寸)" required>
                <input type="number" step="0.5" className="input" value={form.bowLength || ""} onChange={(e) => setForm({ ...form, bowLength: Number(e.target.value) })} />
              </Field>
              <Field label="拉力 (lb)" required>
                <input type="number" step="0.5" className="input" value={form.drawWeight || ""} onChange={(e) => setForm({ ...form, drawWeight: Number(e.target.value) })} />
              </Field>
              <Field label="弦距 (英寸)" required>
                <input type="number" step="0.1" className="input" value={form.braceHeight || ""} onChange={(e) => setForm({ ...form, braceHeight: Number(e.target.value) })} />
              </Field>
              <Field label="箭重 (gr)" required>
                <input type="number" className="input" value={form.arrowWeight || ""} onChange={(e) => setForm({ ...form, arrowWeight: Number(e.target.value) })} />
              </Field>
              <Field label="箭杆挠度 (Spine)" required>
                <input className="input" value={form.arrowSpine || ""} onChange={(e) => setForm({ ...form, arrowSpine: e.target.value })} />
              </Field>
              <Field label="撒放方式" required>
                <select className="input" value={form.releaseType || ""} onChange={(e) => setForm({ ...form, releaseType: e.target.value })}>
                  <option>地中海式</option>
                  <option>蒙古式</option>
                  <option>捏箭式</option>
                  <option>撒放器</option>
                </select>
              </Field>
              <Field label="弓弦材质" required>
                <input className="input" value={form.stringMaterial || ""} onChange={(e) => setForm({ ...form, stringMaterial: e.target.value })} />
              </Field>
              <Field label="弦股数" required>
                <input type="number" className="input" value={form.stringStrands || ""} onChange={(e) => setForm({ ...form, stringStrands: Number(e.target.value) })} />
              </Field>
              <Field label="搭箭点 (cm)" required>
                <input type="number" step="0.05" className="input" value={form.nockingPoint || ""} onChange={(e) => setForm({ ...form, nockingPoint: Number(e.target.value) })} />
              </Field>
              <Field label="上弓梢梢差 (英寸)" required>
                <input type="number" step="0.05" className="input" value={form.tillerTop || ""} onChange={(e) => setForm({ ...form, tillerTop: Number(e.target.value) })} />
              </Field>
              <Field label="下弓梢梢差 (英寸)" required>
                <input type="number" step="0.05" className="input" value={form.tillerBottom || ""} onChange={(e) => setForm({ ...form, tillerBottom: Number(e.target.value) })} />
              </Field>
              <Field label="弓片对齐" required>
                <select className="input" value={form.limbAlignment || ""} onChange={(e) => setForm({ ...form, limbAlignment: e.target.value })}>
                  <option>正中</option>
                  <option>微偏左</option>
                  <option>微偏右</option>
                  <option>偏左</option>
                  <option>偏右</option>
                  <option>严重偏左</option>
                  <option>严重偏右</option>
                </select>
              </Field>
              <Field label="中心射偏移 (mm)" required>
                <input type="number" step="0.5" className="input" value={form.centerShot || ""} onChange={(e) => setForm({ ...form, centerShot: Number(e.target.value) })} />
              </Field>
              <Field label="箭台弹簧" required>
                <select className="input" value={form.plungerSpring || ""} onChange={(e) => setForm({ ...form, plungerSpring: e.target.value })}>
                  <option>Soft</option>
                  <option>Medium</option>
                  <option>Hard</option>
                  <option>N/A</option>
                </select>
              </Field>
              <Field label="弹簧张力 (档)" required>
                <input type="number" step="0.5" className="input" value={form.plungerTension || ""} onChange={(e) => setForm({ ...form, plungerTension: Number(e.target.value) })} />
              </Field>
              <Field label="瞄点标记">
                <input type="number" step="0.1" className="input" value={form.sightMark ?? ""} onChange={(e) => setForm({ ...form, sightMark: Number(e.target.value) || undefined })} />
              </Field>
              <Field label="关联器材">
                <select className="input" value={form.equipmentId || ""} onChange={(e) => setForm({ ...form, equipmentId: e.target.value || undefined })}>
                  <option value="">—</option>
                  {equipment.filter((e) => e.category === "bow").map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </Field>
              <div className="md:col-span-2 lg:col-span-3">
                <label className="label">备注</label>
                <textarea className="input min-h-[80px]" value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "target" && <TargetBoard points={points} archiveId={id} onUpdate={setPoints} />}

      {tab === "versions" && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-bold mb-3 text-bow-dark">创建新版本 / 批次快照</h3>
            <div className="grid md:grid-cols-3 gap-3">
              <input className="input" placeholder="操作员/调弓师" value={newVersion.createdBy} onChange={(e) => setNewVersion({ ...newVersion, createdBy: e.target.value })} />
              <div className="md:col-span-2 flex gap-2">
                <input className="input flex-1" placeholder="变更记录 (如：抬高搭箭点 0.25cm)" value={newVersion.changeLog} onChange={(e) => setNewVersion({ ...newVersion, changeLog: e.target.value })} />
                <button className="btn btn-primary" onClick={createVersion}>📸 快照</button>
              </div>
            </div>
          </div>

          <div className="card !p-0">
            <div className="p-4 border-b border-leather-200">
              <h3 className="font-bold text-bow-dark">版本批次历史（共 {versions.length} 次）</h3>
            </div>
            {versions.length === 0 && <div className="p-8 text-center text-leather-500">暂无版本记录</div>}
            <ol className="relative border-l border-leather-200 ml-5 mb-4">
              {versions.map((v, i) => (
                <li key={v.id} className="mb-4 ml-6 mt-4">
                  <span className="absolute -left-[9px] flex items-center justify-center w-4 h-4 rounded-full bg-bow ring-4 ring-leather-100" />
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                    <h4 className="font-semibold text-bow-dark">
                      v{v.versionNumber} · <span className="font-mono text-sm">{v.batchCode}</span>
                    </h4>
                    <span className="text-xs text-leather-500">
                      {v.createdBy} · {new Date(v.createdAt).toLocaleString("zh-CN")}
                    </span>
                  </div>
                  <p className="text-sm text-bow-dark mb-2">{v.changeLog}</p>
                  {v.snapshot && (
                    <details className="text-xs bg-leather-50 rounded p-2 border border-leather-200">
                      <summary className="cursor-pointer text-leather-600 hover:text-bow">查看参数快照</summary>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 font-mono">
                        {Object.entries(v.snapshot).map(([k, val]) => (
                          <div key={k} className="p-1">
                            <span className="text-leather-500">{k}:</span>{" "}
                            <span className="text-bow-dark">{typeof val === "object" ? JSON.stringify(val) : String(val)}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                  {i === 0 && versions.length > 1 && (
                    <VersionCompare current={v.snapshot} previous={versions[1].snapshot} />
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {tab === "anomalies" && (
        <div className="card">
          <h3 className="font-bold text-lg mb-3 text-bow-dark">异常数据检测（{anomalies.length}）</h3>
          {anomalies.length === 0 ? (
            <div className="py-10 text-center text-leather-500">
              <p className="text-3xl mb-2">✅</p>
              <p>当前参数在常规范围内，未发现异常</p>
            </div>
          ) : (
            <div className="space-y-2">
              {anomalies.map((a) => (
                <div key={a.id} className={`flex items-start justify-between p-3 rounded-md border-l-4 ${
                  a.severity === "high" ? "border-red-500 bg-red-50"
                    : a.severity === "medium" ? "border-yellow-500 bg-yellow-50"
                    : "border-blue-500 bg-blue-50"
                }`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge ${severityCls[a.severity]}`}>
                        {a.severity === "high" ? "高风险" : a.severity === "medium" ? "中风险" : "低风险"}
                      </span>
                      <span className="font-mono text-xs text-leather-600">字段: {a.field}</span>
                    </div>
                    <p className="text-sm text-bow-dark">{a.message}</p>
                    {(a.expectedMin !== undefined || a.expectedMax !== undefined) && (
                      <p className="text-xs text-leather-500 mt-1">
                        建议范围: {a.expectedMin ?? "—"} ~ {a.expectedMax ?? "—"}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold font-mono text-bow-dark">{String(a.value)}</div>
                    <div className="text-xs text-leather-500">当前值</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="label">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
      {children}
    </div>
  );
}

function VersionCompare({ current, previous }: { current: any; previous: any }) {
  const diffs: { field: string; before: any; after: any }[] = [];
  for (const k of Object.keys(current || {})) {
    if (typeof current[k] === "object") continue;
    if (String(current[k]) !== String(previous?.[k])) {
      diffs.push({ field: k, before: previous?.[k], after: current[k] });
    }
  }
  if (diffs.length === 0) return null;
  return (
    <div className="mt-2 text-xs bg-white rounded p-2 border border-bow/30">
      <div className="font-semibold text-bow mb-1">📊 相比上一版本变更:</div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-1 font-mono">
        {diffs.map((d) => (
          <div key={d.field} className="p-1 bg-leather-50 rounded">
            <span className="text-leather-600">{d.field}:</span>{" "}
            <span className="line-through text-red-600">{String(d.before ?? "∅")}</span>{" "}
            → <span className="text-green-700 font-bold">{String(d.after ?? "∅")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
