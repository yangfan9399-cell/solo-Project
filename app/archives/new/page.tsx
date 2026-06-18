"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const defaultForm = {
  name: "",
  bowType: "Recurve 竞技反曲",
  bowLength: 70,
  drawWeight: 36,
  braceHeight: 8.5,
  arrowWeight: 340,
  arrowSpine: "600",
  releaseType: "地中海式",
  stringMaterial: "BCY X99",
  stringStrands: 16,
  nockingPoint: 0.5,
  tillerTop: 0.15,
  tillerBottom: 0.1,
  limbAlignment: "正中",
  centerShot: 15,
  plungerSpring: "Medium",
  plungerTension: 4,
  sightMark: undefined as number | undefined,
  notes: "",
  status: "active" as "active" | "testing" | "archived",
  equipmentId: undefined as string | undefined,
};

export default function NewArchive() {
  const router = useRouter();
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return alert("请填写档案名称");
    setSaving(true);
    const res = await fetch("/api/archives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const a = await res.json();
      router.push(`/archives/${a.id}`);
    }
    setSaving(false);
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="card flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-bow-dark">＋ 新建调弓参数档案</h1>
          <p className="text-sm text-leather-600 mt-1">完整记录弓长、弦距、箭重、撒放方式等核心参数</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn btn-secondary" onClick={() => router.back()}>取消</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "保存中..." : "💾 创建档案"}
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="font-bold text-lg text-bow-dark mb-4">基础信息</h3>
        <div className="grid md:grid-cols-3 gap-3">
          <Field label="档案名称" required>
            <input className="input" placeholder="例如：春季竞技反曲调谐" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="弓型" required>
            <select className="input" value={form.bowType} onChange={(e) => setForm({ ...form, bowType: e.target.value })}>
              <option>Recurve 竞技反曲</option>
              <option>Compound 复合</option>
              <option>Traditional 传统角弓</option>
              <option>Traditional 传统木弓</option>
              <option>Longbow 英式长弓</option>
              <option>Barebow 光弓</option>
            </select>
          </Field>
          <Field label="状态">
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
              <option value="active">使用中</option>
              <option value="testing">调试中</option>
              <option value="archived">已归档</option>
            </select>
          </Field>
        </div>
      </div>

      <div className="card">
        <h3 className="font-bold text-lg text-bow-dark mb-4">弓体参数</h3>
        <div className="grid md:grid-cols-3 gap-3">
          <Field label="弓长 (英寸)" required>
            <input type="number" step="0.5" className="input" value={form.bowLength} onChange={(e) => setForm({ ...form, bowLength: Number(e.target.value) })} />
          </Field>
          <Field label="拉力 Draw Weight (lb)" required>
            <input type="number" step="0.5" className="input" value={form.drawWeight} onChange={(e) => setForm({ ...form, drawWeight: Number(e.target.value) })} />
          </Field>
          <Field label="弦距 Brace Height (英寸)" required>
            <input type="number" step="0.1" className="input" value={form.braceHeight} onChange={(e) => setForm({ ...form, braceHeight: Number(e.target.value) })} />
          </Field>
          <Field label="上弓梢梢差 (英寸)" required>
            <input type="number" step="0.05" className="input" value={form.tillerTop} onChange={(e) => setForm({ ...form, tillerTop: Number(e.target.value) })} />
          </Field>
          <Field label="下弓梢梢差 (英寸)" required>
            <input type="number" step="0.05" className="input" value={form.tillerBottom} onChange={(e) => setForm({ ...form, tillerBottom: Number(e.target.value) })} />
          </Field>
          <Field label="弓片对齐" required>
            <select className="input" value={form.limbAlignment} onChange={(e) => setForm({ ...form, limbAlignment: e.target.value })}>
              <option>正中</option><option>微偏左</option><option>微偏右</option>
              <option>偏左</option><option>偏右</option><option>严重偏左</option><option>严重偏右</option>
            </select>
          </Field>
        </div>
      </div>

      <div className="card">
        <h3 className="font-bold text-lg text-bow-dark mb-4">箭与弓弦</h3>
        <div className="grid md:grid-cols-3 gap-3">
          <Field label="箭重 (gr)" required>
            <input type="number" className="input" value={form.arrowWeight} onChange={(e) => setForm({ ...form, arrowWeight: Number(e.target.value) })} />
          </Field>
          <Field label="箭杆挠度 Spine" required>
            <input className="input" value={form.arrowSpine} onChange={(e) => setForm({ ...form, arrowSpine: e.target.value })} />
          </Field>
          <Field label="撒放方式" required>
            <select className="input" value={form.releaseType} onChange={(e) => setForm({ ...form, releaseType: e.target.value })}>
              <option>地中海式</option><option>蒙古式</option><option>捏箭式</option><option>撒放器</option>
            </select>
          </Field>
          <Field label="弓弦材质" required>
            <input className="input" value={form.stringMaterial} onChange={(e) => setForm({ ...form, stringMaterial: e.target.value })} />
          </Field>
          <Field label="弦股数" required>
            <input type="number" className="input" value={form.stringStrands} onChange={(e) => setForm({ ...form, stringStrands: Number(e.target.value) })} />
          </Field>
          <Field label="搭箭点 (cm)" required>
            <input type="number" step="0.05" className="input" value={form.nockingPoint} onChange={(e) => setForm({ ...form, nockingPoint: Number(e.target.value) })} />
          </Field>
        </div>
      </div>

      <div className="card">
        <h3 className="font-bold text-lg text-bow-dark mb-4">瞄准与箭台</h3>
        <div className="grid md:grid-cols-3 gap-3">
          <Field label="中心射偏移 (mm)" required>
            <input type="number" step="0.5" className="input" value={form.centerShot} onChange={(e) => setForm({ ...form, centerShot: Number(e.target.value) })} />
          </Field>
          <Field label="箭台弹簧" required>
            <select className="input" value={form.plungerSpring} onChange={(e) => setForm({ ...form, plungerSpring: e.target.value })}>
              <option>Soft</option><option>Medium</option><option>Hard</option><option>N/A</option>
            </select>
          </Field>
          <Field label="弹簧张力 (档)" required>
            <input type="number" step="0.5" className="input" value={form.plungerTension} onChange={(e) => setForm({ ...form, plungerTension: Number(e.target.value) })} />
          </Field>
          <Field label="瞄点标记 (可选)">
            <input type="number" step="0.1" className="input" value={form.sightMark ?? ""} onChange={(e) => setForm({ ...form, sightMark: Number(e.target.value) || undefined })} />
          </Field>
        </div>
      </div>

      <div className="card">
        <h3 className="font-bold text-lg text-bow-dark mb-3">备注</h3>
        <textarea className="input min-h-[100px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="调弓记录、调试过程、特殊情况备注..." />
      </div>
    </form>
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
