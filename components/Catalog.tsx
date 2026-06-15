"use client";

import { useState } from "react";
import type { Species, SpeciesType } from "@/lib/types";

interface CatalogProps {
  species: Species[];
  observedIds?: Set<string>;
}

const typeLabels: Record<SpeciesType, string> = {
  crab: "🦀 蟹类",
  anemone: "🌸 海葵",
  fish: "🐟 鱼类",
};

const rarityLabels: Record<string, { text: string; color: string }> = {
  common: { text: "常见", color: "bg-slate-100 text-slate-700" },
  uncommon: { text: "少见", color: "bg-amber-100 text-amber-700" },
  rare: { text: "稀有", color: "bg-purple-100 text-purple-700" },
};

export default function Catalog({ species, observedIds = new Set() }: CatalogProps) {
  const [filter, setFilter] = useState<SpeciesType | "all">("all");

  const filtered = filter === "all" ? species : species.filter((s) => s.type === filter);

  return (
    <div className="pool-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-lg text-slate-800">📖 物种图鉴</h3>
        <span className="text-sm text-slate-500">
          已发现 {observedIds.size} / {species.length}
        </span>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1 text-xs rounded-full transition-colors ${
            filter === "all" ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          全部
        </button>
        {(Object.keys(typeLabels) as SpeciesType[]).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              filter === t ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {typeLabels[t]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
        {filtered.map((s) => {
          const observed = observedIds.has(s.id);
          const rarity = rarityLabels[s.rarity];
          return (
            <div
              key={s.id}
              className={`p-3 rounded-lg border transition-all ${
                observed
                  ? "bg-emerald-50 border-emerald-300 shadow-sm"
                  : "bg-slate-50 border-slate-200 opacity-70"
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-2xl">{observed ? s.emoji : "❓"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 text-sm">
                      {observed ? s.name : "未知物种"}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${rarity.color}`}>
                      {rarity.text}
                    </span>
                  </div>
                  {observed && (
                    <>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{s.description}</p>
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500">
                        <span>🌊 {s.preferredTide.join("/")}</span>
                        <span>📊 {Math.round(s.minTideLevel * 100)}%~{Math.round(s.maxTideLevel * 100)}%</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
