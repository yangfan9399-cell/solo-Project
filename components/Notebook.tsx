"use client";

import { useState } from "react";
import type { ObservationRecord, NotebookEntry, Species } from "@/lib/types";
import { SPECIES } from "@/lib/gameData";

interface NotebookProps {
  sessionId: string;
  observations: ObservationRecord[];
  notebookEntries: NotebookEntry[];
  onAddNote: (speciesId: string, content: string) => Promise<void>;
}

export default function Notebook({ sessionId, observations, notebookEntries, onAddNote }: NotebookProps) {
  const [newNote, setNewNote] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const speciesMap = new Map(SPECIES.map((s) => [s.id, s]));
  const observedSpecies = Array.from(new Set(observations.map((o) => o.speciesId)));

  const handleSubmit = async () => {
    if (!selectedSpecies || !newNote.trim()) return;
    setSubmitting(true);
    await onAddNote(selectedSpecies, newNote.trim());
    setNewNote("");
    setSelectedSpecies("");
    setSubmitting(false);
  };

  return (
    <div className="pool-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-lg text-slate-800">📝 观察笔记</h3>
        <span className="text-xs text-slate-500">记录 {observations.length} 条</span>
      </div>

      <div className="mb-4">
        <div className="flex gap-2 mb-2">
          <select
            value={selectedSpecies}
            onChange={(e) => setSelectedSpecies(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            <option value="">选择物种...</option>
            {observedSpecies.map((sid) => {
              const sp = speciesMap.get(sid);
              if (!sp) return null;
              return (
                <option key={sid} value={sid}>
                  {sp.emoji} {sp.name}
                </option>
              );
            })}
          </select>
        </div>
        <div className="flex gap-2">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="记录你的观察发现..."
            rows={2}
            className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
          />
          <button
            onClick={handleSubmit}
            disabled={!selectedSpecies || !newNote.trim() || submitting}
            className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            记录
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {observations.length === 0 && notebookEntries.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">还没有观察记录</p>
        )}
        {observations
          .slice()
          .reverse()
          .map((obs) => {
            const sp = speciesMap.get(obs.speciesId);
            if (!sp) return null;
            const relatedNotes = notebookEntries.filter((n) => n.speciesId === obs.speciesId);
            return (
              <div
                key={obs.id}
                className={`p-3 rounded-lg text-sm ${
                  obs.trampled ? "bg-red-50 border border-red-200" : "bg-sky-50 border border-sky-100"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold">
                    {sp.emoji} {sp.name}
                  </span>
                  <span className="text-xs text-slate-500">
                    第{obs.timeStep + 1}步 · 潮位{Math.round(obs.tideLevel * 100)}%
                  </span>
                </div>
                {obs.trampled && (
                  <p className="text-xs text-red-600 font-medium mb-1">⚠️ 被踩踏</p>
                )}
                {obs.note && <p className="text-xs text-slate-600 italic">"{obs.note}"</p>}
                {relatedNotes.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {relatedNotes.map((n) => (
                      <p key={n.id} className="text-xs text-slate-500 pl-2 border-l-2 border-sky-300">
                        📌 {n.content}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
