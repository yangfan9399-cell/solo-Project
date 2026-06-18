"use client";

import { useEffect, useState, useCallback } from "react";
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

const bowTypeLabels: Record<string, string> = {
  recurve: "Recurve 竞技反曲",
  compound: "Compound 复合",
  traditional: "Traditional 传统角弓",
  "traditional-wood": "Traditional 传统木弓",
  longbow: "Longbow 英式长弓",
  barebow: "Barebow 光弓",
};

const releaseTypeLabels: Record<string, string> = {
  finger: "地中海式 (Finger)",
  thumb: "蒙古式/扳指 (Thumb)",
  pinch: "捏箭式 (Pinch)",
  release: "撒放器 (Release)",
};

const limbAlignmentLabels: Record<string, string> = {
  "正中": "正中",
  "微偏左": "微偏左",
  "微偏右": "微偏右",
  "偏左": "偏左",
  "偏右": "偏右",
  "严重偏左": "严重偏左",
  "严重偏右": "严重偏右",
};

const plungerSpringLabels: Record<string, string> = {
  Soft: "Soft (软)",
  Medium: "Medium (中)",
  Hard: "Hard (硬)",
  "N/A": "N/A",
};

const SNAPSHOT_HIDDEN = new Set(["id", "createdAt", "updatedAt", "equipmentId"]);

function display(v: any, suffix = ""): string {
  if (v === null || v === undefined || v === "") return "—";
  return `${v}${suffix}`;
}

export default function ArchiveDetail({ params }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [id, setId] = useState<string>("");
  const [archive, setArchive] = useState<BowArchive | null>(null);
  const [loadedAt, setLoadedAt] = useState<string>("");
  const [versions, setVersions] = useState<BowVersion[]>([]);
  const [points, setPoints] = useState<TargetPoint[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyAlert[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState(searchParams.get("tab") || "params");
  const [form, setForm] = useState<Partial<BowArchive>>({});
  const [newVersion, setNewVersion] = useState({ changeLog: "", createdBy: "" });
  const [snapshotSaving, setSnapshotSaving] = useState(false);
  const [archiveReview, setArchiveReview] = useState<{ open: boolean; target: string }>({ open: false, target: "" });

  const loadArchive = useCallback(() => {
    if (!id) return;
    fetch(`/api/archives/${id}`).then((r) => r.json()).then((a) => {
      if (a && !a.error) {
        setArchive(a);
        setForm(a);
        setLoadedAt(a.updatedAt);
      }
    });
    fetch(`/api/archives/${id}/versions`).then((r) => r.json()).then(setVersions);
    fetch(`/api/archives/${id}/points`).then((r) => r.json()).then(setPoints);
    fetch(`/api/archives/${id}/anomalies`).then((r) => r.json()).then(setAnomalies);
  }, [id]);

  useEffect(() => {
    params.then((p) => {
      setId(p.id);
    });
  }, [params]);

  useEffect(() => {
    if (id) loadArchive();
  }, [id, loadArchive]);

  useEffect(() => { fetch("/api/equipment").then((r) => r.json()).then(setEquipment); }, []);

  if (!archive) {
    return <div className="card text-center py-12 text-leather-500">加载中...</div>;
  }

  const saveForm = async () => {
    setSaving(true);
    try {
      const fresh = await fetch(`/api/archives/${id}`).then((r) => r.json());
      if (fresh && fresh.updatedAt && fresh.updatedAt !== loadedAt) {
        const ok = confirm(
          `⚠️ 版本冲突：此档案在您编辑期间已被他人修改（更新于 ${new Date(fresh.updatedAt).toLocaleString("zh-CN")}）。\n\n点击「确定」覆盖保存，点击「取消」放弃编辑并刷新。`
        );
        if (!ok) {
          setArchive(fresh);
          setForm(fresh);
          setLoadedAt(fresh.updatedAt);
          setEditing(false);
          setSaving(false);
          return;
        }
      }
      const res = await fetch(`/api/archives/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, updatedAt: undefined }),
      });
      if (res.ok) {
        const updated = await res.json();
        setArchive(updated);
        setLoadedAt(updated.updatedAt);
        setEditing(false);
        fetch(`/api/archives/${id}/anomalies`).then((r) => r.json()).then(setAnomalies);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`保存失败：${err.error || "请检查参数"}`);
      }
    } catch {
      alert("保存失败：网络错误");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === "archived" && archive.status !== "archived") {
      const highCount = anomalies.filter((a) => a.severity === "high").length;
      const totalCount = anomalies.length;
      setArchiveReview({ open: true, target: newStatus });
      return;
    }
    if (newStatus === "active" && archive.status === "archived") {
      const ok = confirm("确认将此档案从「已归档」恢复为「使用中」？恢复后需重新进行参数校验。");
      if (!ok) return;
      submitStatusChange(newStatus, "恢复归档档案为使用中状态");
      return;
    }
    submitStatusChange(newStatus, `状态变更为${statusMap[newStatus]?.label ?? newStatus}`);
  };

  const submitStatusChange = async (newStatus: string, reason: string) => {
    setArchiveReview({ open: false, target: "" });
    const res = await fetch(`/api/archives/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated = await res.json();
      setArchive(updated);
      setForm(updated);
      setLoadedAt(updated.updatedAt);
      await fetch(`/api/archives/${id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          versionNumber: (versions[0]?.versionNumber ?? 0) + 1,
          batchCode: `BATCH-${Date.now().toString(36).toUpperCase()}`,
          changeLog: reason,
          createdBy: "审批流转",
          snapshot: updated,
        }),
      });
      fetch(`/api/archives/${id}/versions`).then((r) => r.json()).then(setVersions);
      fetch(`/api/archives/${id}/anomalies`).then((r) => r.json()).then(setAnomalies);
    }
  };

  const createVersion = async () => {
    if (!newVersion.changeLog) return alert("请填写变更记录");
    setSnapshotSaving(true);
    try {
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
      } else {
        alert("快照创建失败，请重试");
      }
    } catch {
      alert("快照创建失败：网络错误");
    } finally {
      setSnapshotSaving(false);
    }
  };

  const removeArchive = async () => {
    if (!confirm("确认删除此档案？此操作不可撤销。")) return;
    const res = await fetch(`/api/archives/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/");
    } else {
      alert("删除失败");
    }
  };

  const tabs = [
    { k: "params", label: "📐 参数详情" },
    { k: "target", label: "🎯 靶纸标点" },
    { k: "versions", label: "📜 版本批次" },
    { k: "anomalies", label: "⚠️ 异常提示" },
  ];

  const highAnomalyCount = anomalies.filter((a) => a.severity === "high").length;

  return (
    <div className="space-y-5">
      {archiveReview.open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-bow-dark">📋 归档复核确认</h3>
            <p className="text-sm text-leather-700">您正在将档案「{archive.name}」变更为<b>已归档</b>状态。</p>
            {highAnomalyCount > 0 && (
              <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
                ⚠️ 此档案仍有 <b>{highAnomalyCount}</b> 项高风险异常未解决，归档后可能影响后续复用。
              </div>
            )}
            {anomalies.length > 0 && highAnomalyCount === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
                ℹ️ 此档案有 {anomalies.length} 项低/中风险异常提示，不影响归档。
              </div>
            )}
            {anomalies.length === 0 && (
              <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">
                ✅ 此档案参数均在常规范围内，可安全归档。
              </div>
            )}
            <div>
              <label className="label">归档原因</label>
              <input className="input" id="archive-reason" placeholder="如：赛季结束、器材退役..." />
            </div>
            <div className="flex gap-2 justify-end">
              <button className="btn btn-secondary" onClick={() => setArchiveReview({ open: false, target: "" })}>取消</button>
              <button className="btn btn-primary" onClick={() => {
                const reason = (document.getElementById("archive-reason") as HTMLInputElement)?.value || "归档";
                submitStatusChange("archived", `归档复核通过：${reason}`);
              }}>确认归档</button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-bow-dark">{archive.name}</h1>
              <span className={`badge ${statusMap[archive.status]?.cls ?? ""}`}>
                {statusMap[archive.status]?.label ?? archive.status}
              </span>
              {highAnomalyCount > 0 && (
                <span className="badge bg-red-100 text-red-700">⚠️ {highAnomalyCount} 项高风险</span>
              )}
            </div>
            <p className="text-sm text-leather-600">
              {bowTypeLabels[archive.bowType] ?? archive.bowType} · 弓长 {archive.bowLength}&quot; · 拉力 {archive.drawWeight} lb · 弦距 {archive.braceHeight}&quot;
              {" · "}更新于 {new Date(archive.updatedAt).toLocaleString("zh-CN")}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button className="btn btn-secondary" onClick={() => router.push("/")}>← 返回</button>
            <button className="btn btn-secondary" onClick={() => router.push(`/exports?archiveId=${id}`)}>📤 导出</button>
            {!editing ? (
              <button className="btn btn-primary" onClick={() => setEditing(true)}>✏️ 编辑</button>
            ) : (
              <>
                <button className="btn btn-secondary" onClick={() => { setEditing(false); setForm(archive); }}>取消</button>
                <button className="btn btn-primary" onClick={saveForm} disabled={saving}>
                  {saving ? "保存中..." : "💾 保存"}
                </button>
              </>
            )}
            {!editing && (
              <select
                className="input !w-auto text-sm"
                value={archive.status}
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                <option value="active">使用中</option>
                <option value="testing">调试中</option>
                <option value="archived">已归档</option>
              </select>
            )}
            <button className="btn btn-danger" onClick={removeArchive}>🗑</button>
          </div>
        </div>
      </div>

      {anomalies.length > 0 && tab !== "anomalies" && (
        <div className={`border-l-4 ${highAnomalyCount > 0 ? "border-red-500 bg-red-50" : "border-yellow-500 bg-yellow-50"} p-4 rounded-r-md`}>
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
            <div className="space-y-4">
              <ParamGroup title="基础参数">
                {[
                  ["弓型", bowTypeLabels[archive.bowType] ?? archive.bowType],
                  ["弓长", display(archive.bowLength, " 英寸")],
                  ["拉力 (Draw Weight)", display(archive.drawWeight, " lb")],
                  ["拉距 (Draw Length)", display(archive.drawLength, " 英寸")],
                  ["弦距 (Brace Height)", display(archive.braceHeight, " 英寸")],
                  ["撒放方式", releaseTypeLabels[archive.releaseType] ?? display(archive.releaseType)],
                ].map(([k, v]) => (
                  <ParamItem key={k} label={k} value={v} />
                ))}
              </ParamGroup>
              <ParamGroup title="弓体调校">
                {[
                  ["上弓梢重量", display(archive.upperTipWeight, " oz")],
                  ["下弓梢重量", display(archive.lowerTipWeight, " oz")],
                  ["弓片弹力比", display(archive.limbRatio)],
                  ["弓片对齐", limbAlignmentLabels[archive.limbAlignment ?? ""] ?? display(archive.limbAlignment)],
                  ["中心射偏移", display(archive.centerShot, " mm")],
                ].map(([k, v]) => (
                  <ParamItem key={k} label={k} value={v} />
                ))}
              </ParamGroup>
              <ParamGroup title="箭与弓弦">
                {[
                  ["箭重", display(archive.arrowWeight, " gr")],
                  ["箭杆挠度 (Spine)", display(archive.arrowSpine)],
                  ["搭箭点位置", display(archive.nockingPoint, " cm")],
                  ["弓弦材质", display(archive.stringMaterial)],
                  ["弦股数", display(archive.stringStrands, " 股")],
                ].map(([k, v]) => (
                  <ParamItem key={k} label={k} value={v} />
                ))}
              </ParamGroup>
              <ParamGroup title="箭台与瞄准">
                {[
                  ["箭台类型", display(archive.restType)],
                  ["箭台弹簧", plungerSpringLabels[archive.plungerSpring ?? ""] ?? display(archive.plungerSpring)],
                  ["弹簧张力", display(archive.plungerTension, " 档")],
                  ["瞄准器类型", display(archive.sightType)],
                  ["瞄点标记", display(archive.sightMark)],
                  ["关联器材", equipment.find((e) => e.id === archive.equipmentId)?.name ?? "未关联"],
                ].map(([k, v]) => (
                  <ParamItem key={k} label={k} value={v} />
                ))}
              </ParamGroup>
              <div className="p-3 rounded-md bg-leather-50 border border-leather-100">
                <div className="text-xs text-leather-500 mb-1">备注</div>
                <div className="text-bow-dark whitespace-pre-wrap">{archive.notes || "—"}</div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-bow-dark mb-3 text-sm border-b border-leather-200 pb-1">基础参数</h4>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <Field label="档案名称" required>
                    <input className="input" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </Field>
                  <Field label="弓型" required>
                    <select className="input" value={form.bowType || ""} onChange={(e) => setForm({ ...form, bowType: e.target.value })}>
                      <option value="recurve">Recurve 竞技反曲</option>
                      <option value="compound">Compound 复合</option>
                      <option value="traditional">Traditional 传统角弓</option>
                      <option value="traditional-wood">Traditional 传统木弓</option>
                      <option value="longbow">Longbow 英式长弓</option>
                      <option value="barebow">Barebow 光弓</option>
                    </select>
                  </Field>
                  <Field label="弓长 (英寸)" required>
                    <input type="number" step="0.5" className="input" value={form.bowLength || ""} onChange={(e) => setForm({ ...form, bowLength: Number(e.target.value) })} />
                  </Field>
                  <Field label="拉力 (lb)" required>
                    <input type="number" step="0.5" className="input" value={form.drawWeight || ""} onChange={(e) => setForm({ ...form, drawWeight: Number(e.target.value) })} />
                  </Field>
                  <Field label="拉距 (英寸)" required>
                    <input type="number" step="0.5" className="input" value={form.drawLength || ""} onChange={(e) => setForm({ ...form, drawLength: Number(e.target.value) })} />
                  </Field>
                  <Field label="弦距 (英寸)" required>
                    <input type="number" step="0.1" className="input" value={form.braceHeight || ""} onChange={(e) => setForm({ ...form, braceHeight: Number(e.target.value) })} />
                  </Field>
                  <Field label="撒放方式" required>
                    <select className="input" value={form.releaseType || ""} onChange={(e) => setForm({ ...form, releaseType: e.target.value })}>
                      <option value="finger">地中海式 (Finger)</option>
                      <option value="thumb">蒙古式/扳指 (Thumb)</option>
                      <option value="pinch">捏箭式 (Pinch)</option>
                      <option value="release">撒放器 (Release)</option>
                    </select>
                  </Field>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-bow-dark mb-3 text-sm border-b border-leather-200 pb-1">弓体调校</h4>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <Field label="上弓梢重量 (oz)">
                    <input type="number" step="0.1" className="input" value={form.upperTipWeight ?? ""} onChange={(e) => setForm({ ...form, upperTipWeight: Number(e.target.value) || undefined })} />
                  </Field>
                  <Field label="下弓梢重量 (oz)">
                    <input type="number" step="0.1" className="input" value={form.lowerTipWeight ?? ""} onChange={(e) => setForm({ ...form, lowerTipWeight: Number(e.target.value) || undefined })} />
                  </Field>
                  <Field label="弓片弹力比">
                    <input type="number" step="0.1" className="input" value={form.limbRatio ?? ""} onChange={(e) => setForm({ ...form, limbRatio: Number(e.target.value) || undefined })} />
                  </Field>
                  <Field label="弓片对齐">
                    <select className="input" value={form.limbAlignment || "正中"} onChange={(e) => setForm({ ...form, limbAlignment: e.target.value })}>
                      <option value="正中">正中</option>
                      <option value="微偏左">微偏左</option>
                      <option value="微偏右">微偏右</option>
                      <option value="偏左">偏左</option>
                      <option value="偏右">偏右</option>
                      <option value="严重偏左">严重偏左</option>
                      <option value="严重偏右">严重偏右</option>
                    </select>
                  </Field>
                  <Field label="中心射偏移 (mm)">
                    <input type="number" step="0.5" className="input" value={form.centerShot ?? ""} onChange={(e) => setForm({ ...form, centerShot: Number(e.target.value) || undefined })} />
                  </Field>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-bow-dark mb-3 text-sm border-b border-leather-200 pb-1">箭与弓弦</h4>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <Field label="箭重 (gr)" required>
                    <input type="number" className="input" value={form.arrowWeight || ""} onChange={(e) => setForm({ ...form, arrowWeight: Number(e.target.value) })} />
                  </Field>
                  <Field label="箭杆挠度 (Spine)">
                    <input className="input" value={form.arrowSpine || ""} onChange={(e) => setForm({ ...form, arrowSpine: e.target.value })} />
                  </Field>
                  <Field label="搭箭点位置 (cm)">
                    <input type="number" step="0.05" className="input" value={form.nockingPoint ?? ""} onChange={(e) => setForm({ ...form, nockingPoint: Number(e.target.value) || undefined })} />
                  </Field>
                  <Field label="弓弦材质">
                    <input className="input" value={form.stringMaterial || ""} onChange={(e) => setForm({ ...form, stringMaterial: e.target.value })} />
                  </Field>
                  <Field label="弦股数">
                    <input type="number" className="input" value={form.stringStrands || ""} onChange={(e) => setForm({ ...form, stringStrands: Number(e.target.value) || undefined })} />
                  </Field>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-bow-dark mb-3 text-sm border-b border-leather-200 pb-1">箭台与瞄准</h4>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <Field label="箭台类型">
                    <input className="input" placeholder="如 Magnetic Rest" value={form.restType || ""} onChange={(e) => setForm({ ...form, restType: e.target.value })} />
                  </Field>
                  <Field label="箭台弹簧">
                    <select className="input" value={form.plungerSpring || "Medium"} onChange={(e) => setForm({ ...form, plungerSpring: e.target.value })}>
                      <option value="Soft">Soft (软)</option>
                      <option value="Medium">Medium (中)</option>
                      <option value="Hard">Hard (硬)</option>
                      <option value="N/A">N/A</option>
                    </select>
                  </Field>
                  <Field label="弹簧张力 (档)">
                    <input type="number" step="0.5" className="input" value={form.plungerTension ?? ""} onChange={(e) => setForm({ ...form, plungerTension: Number(e.target.value) || undefined })} />
                  </Field>
                  <Field label="瞄准器类型">
                    <input className="input" placeholder="如 Recurve Sight" value={form.sightType || ""} onChange={(e) => setForm({ ...form, sightType: e.target.value })} />
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
                </div>
              </div>

              <div>
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
                <button className="btn btn-primary" onClick={createVersion} disabled={snapshotSaving}>
                  {snapshotSaving ? "保存中..." : "📸 快照"}
                </button>
              </div>
            </div>
          </div>

          <div className="card !p-0">
            <div className="p-4 border-b border-leather-200">
              <h3 className="font-bold text-bow-dark">版本批次历史（共 {versions.length} 次）</h3>
            </div>
            {versions.length === 0 && <div className="p-8 text-center text-leather-500">暂无版本记录，点击上方「快照」创建第一份参数快照</div>}
            <ol className="relative border-l border-leather-200 ml-5 mb-4">
              {versions.map((v, i) => {
                const snapEntries = Object.entries(v.snapshot || {}).filter(([k]) => !SNAPSHOT_HIDDEN.has(k));
                return (
                <li key={v.id} className="mb-4 ml-6 mt-4">
                  <span className="absolute -left-[9px] flex items-center justify-center w-4 h-4 rounded-full bg-bow ring-4 ring-leather-100" />
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                    <h4 className="font-semibold text-bow-dark">
                      v{v.versionNumber} · <span className="font-mono text-sm">{v.batchCode}</span>
                    </h4>
                    <span className="text-xs text-leather-500">
                      {v.createdBy || "系统记录"} · {new Date(v.createdAt).toLocaleString("zh-CN")}
                    </span>
                  </div>
                  <p className="text-sm text-bow-dark mb-2">{v.changeLog || "无变更记录"}</p>
                  {snapEntries.length > 0 && (
                    <details className="text-xs bg-leather-50 rounded p-2 border border-leather-200">
                      <summary className="cursor-pointer text-leather-600 hover:text-bow">查看参数快照（{snapEntries.length} 项）</summary>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 font-mono">
                        {snapEntries.map(([k, val]) => (
                          <div key={k} className="p-1">
                            <span className="text-leather-500">{k}:</span>{" "}
                            <span className="text-bow-dark">{typeof val === "object" ? JSON.stringify(val) : String(val ?? "—")}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                  {i === 0 && versions.length > 1 && (
                    <VersionCompare current={v.snapshot} previous={versions[1].snapshot} />
                  )}
                </li>
              );})}
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

function ParamGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="font-semibold text-bow-dark mb-2 text-sm border-b border-leather-200 pb-1">{title}</h4>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">{children}</div>
    </div>
  );
}

function ParamItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-md bg-leather-50 border border-leather-100">
      <div className="text-xs text-leather-500 mb-1">{label}</div>
      <div className="font-medium text-bow-dark">{value}</div>
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
    if (SNAPSHOT_HIDDEN.has(k) || typeof current[k] === "object") continue;
    if (String(current[k] ?? "") !== String(previous?.[k] ?? "")) {
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
