"use client";

import { useEffect, useState } from "react";
import type { Equipment } from "@/lib/types";

const conditionMap: Record<string, string> = {
  new: "bg-emerald-100 text-emerald-800",
  excellent: "bg-green-100 text-green-800",
  good: "bg-blue-100 text-blue-800",
  fair: "bg-yellow-100 text-yellow-800",
  repair: "bg-red-100 text-red-800",
  poor: "bg-red-100 text-red-800",
};

const conditionLabels: Record<string, string> = {
  new: "全新",
  excellent: "优秀",
  good: "良好",
  fair: "一般",
  repair: "待修",
  poor: "待修",
};

const categoryLabel: Record<string, string> = {
  bow: "弓体",
  arrow: "箭矢",
  string: "弓弦",
  accessory: "配件",
  limb: "弓片",
  riser: "弓把",
};

export default function EquipmentPage() {
  const [items, setItems] = useState<Equipment[]>([]);
  const [category, setCategory] = useState("");
  const [editing, setEditing] = useState<Equipment | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState<Partial<Equipment>>({
    category: "bow",
    status: "good",
    spec: "",
  });

  const load = () => {
    const q = category ? `?category=${category}` : "";
    fetch(`/api/equipment${q}`).then((r) => r.json()).then(setItems);
  };

  useEffect(() => { load(); }, [category]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return alert("请填写器材名称");
    const url = editing ? `/api/equipment/${editing.id}` : "/api/equipment";
    const method = editing ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ category: "bow", status: "good", spec: "" });
      setEditing(null);
      setShowForm(false);
      load();
    }
  };

  const remove = async (id: string) => {
    if (!confirm("确认删除？")) return;
    await fetch(`/api/equipment/${id}`, { method: "DELETE" });
    load();
  };

  const edit = (it: Equipment) => {
    setEditing(it);
    setForm(it);
    setShowForm(true);
  };

  return (
    <div className="space-y-5">
      <div className="card flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-bow-dark">🛠️ 器材库</h1>
          <p className="text-sm text-leather-600 mt-1">弓、箭、弦、配件统一管理</p>
        </div>
        <div className="flex gap-2">
          <select className="input !w-auto" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">全部分类</option>
            {Object.entries(categoryLabel).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setForm({ category: "bow", condition: "good", specs: {} }); setShowForm(true); }}>
            ＋ 新增器材
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={save} className="card">
          <h3 className="font-bold mb-4 text-bow-dark">{editing ? "编辑器材" : "新增器材"}</h3>
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="label">器材名称 *</label>
              <input className="input" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">分类</label>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as any })}>
                {Object.entries(categoryLabel).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">状态</label>
              <select className="input" value={form.status || "good"} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
                <option value="new">全新</option>
                <option value="excellent">优秀</option>
                <option value="good">良好</option>
                <option value="fair">一般</option>
                <option value="repair">待修</option>
              </select>
            </div>
            <div>
              <label className="label">品牌</label>
              <input className="input" value={form.brand || ""} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            </div>
            <div>
              <label className="label">型号</label>
              <input className="input" value={form.model || ""} onChange={(e) => setForm({ ...form, model: e.target.value })} />
            </div>
            <div>
              <label className="label">购置日期</label>
              <input type="date" className="input" value={form.purchaseDate || ""} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} />
            </div>
            <div>
              <label className="label">存放位置</label>
              <input className="input" value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="label">备注</label>
              <input className="input" value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="btn btn-primary">{editing ? "💾 保存修改" : "＋ 创建"}</button>
            <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditing(null); }}>取消</button>
          </div>
        </form>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it) => {
          const cond: string = (it.status || it.condition || "good") as string;
          const specObj: Record<string, any> =
            typeof it.specs === "object" && it.specs !== null
              ? it.specs
              : it.spec
              ? { 规格: it.spec }
              : {};
          return (
          <div key={it.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-bold text-bow-dark">{it.name}</h3>
                <p className="text-xs text-leather-500">
                  {categoryLabel[it.category] ?? it.category}
                  {it.brand && ` · ${it.brand}`}
                  {it.model && ` · ${it.model}`}
                </p>
              </div>
              <span className={`badge ${conditionMap[cond] ?? ""}`}>
                {conditionLabels[cond] ?? cond}
              </span>
            </div>
            <div className="text-sm text-leather-700 space-y-1 mb-3">
              {it.purchaseDate && <p>购置: {it.purchaseDate}</p>}
              {it.location && <p>位置: {it.location}</p>}
              {Object.keys(specObj).length > 0 && (
                <p className="font-mono text-xs bg-leather-50 rounded p-2">
                  {Object.entries(specObj).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                </p>
              )}
              {it.notes && <p className="text-leather-600 text-xs italic">"{it.notes}"</p>}
            </div>
            <div className="flex gap-2 text-sm">
              <button className="text-bow hover:underline" onClick={() => edit(it)}>编辑</button>
              <button className="text-red-600 hover:underline" onClick={() => remove(it.id)}>删除</button>
            </div>
          </div>
          );
        })}
        {items.length === 0 && (
          <div className="col-span-full card text-center py-10 text-leather-500">暂无器材数据</div>
        )}
      </div>
    </div>
  );
}
