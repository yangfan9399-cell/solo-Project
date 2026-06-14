'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SeedData {
  id: string;
  label: string;
  description: string;
  seedType: string;
  tapes: { label: string; defects: string[] }[];
  hint: string;
}

interface SessionData {
  id: string;
  label: string;
  status: string;
  startedAt: number;
  tapeCount: number;
  finalScore: number;
  grade: string;
}

export default function HomeClient() {
  const [seeds, setSeeds] = useState<SeedData[]>([]);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSeed, setSelectedSeed] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [seedsRes, sessionsRes] = await Promise.all([
        fetch('/api/seeds'),
        fetch('/api/sessions'),
      ]);
      const seedsData = await seedsRes.json();
      const sessionsData = await sessionsRes.json();
      setSeeds(seedsData.seeds || []);
      setSessions(sessionsData.sessions || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '加载失败');
    }
  }

  async function createSession() {
    if (!selectedSeed) {
      setError('请先选择一个样本批次');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seedId: selectedSeed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '创建失败');
      window.location.href = `/session/${data.session.id}`;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '创建失败');
    } finally {
      setLoading(false);
    }
  }

  const seedTypeLabels: Record<string, { label: string; color: string }> = {
    normal_splice: { label: '样本1：正常拼接', color: 'bg-tape-success' },
    abnormal_settings: { label: '样本2：异常设置', color: 'bg-tape-danger' },
    rollback_required: { label: '样本3：回滚重算', color: 'bg-tape-accent' },
  };

  const defectLabels: Record<string, string> = {
    mold: '霉斑',
    breakage: '断裂',
    speed_drift: '转速漂移',
    noise: '底噪',
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="mb-10 text-center border-b border-tape-border pb-6">
        <div className="flex items-center justify-center gap-4 mb-3">
          <div className="w-12 h-12 rounded-full bg-tape-panel border-2 border-tape-accent flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-tape-accent tape-reel" />
          </div>
          <h1 className="text-3xl font-bold text-tape-accent tracking-wider">
            磁带档案倒带修复游戏
          </h1>
          <div className="w-12 h-12 rounded-full bg-tape-panel border-2 border-tape-accent flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-tape-accent tape-reel" />
          </div>
        </div>
        <p className="text-tape-muted text-sm">
          TAPE ARCHIVE REWIND &amp; REPAIR WORKSTATION v1.0
        </p>
      </header>

      {error && (
        <div className="bg-tape-danger/20 border border-tape-danger text-tape-danger px-4 py-3 rounded mb-6">
          ⚠ {error}
        </div>
      )}

      <section className="mb-10">
        <h2 className="text-xl text-tape-accent mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-tape-accent animate-pulse" />
          选择样本批次开始修复
        </h2>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {seeds.map((seed) => {
            const typeInfo = seedTypeLabels[seed.seedType];
            const isSelected = selectedSeed === seed.id;
            return (
              <div
                key={seed.id}
                onClick={() => setSelectedSeed(seed.id)}
                className={`p-5 rounded-lg border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-tape-accent bg-tape-accent/10 shadow-lg shadow-tape-accent/20'
                    : 'border-tape-border bg-tape-panel hover:border-tape-muted'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded text-black font-bold ${typeInfo?.color}`}
                  >
                    {typeInfo?.label}
                  </span>
                  {isSelected && (
                    <span className="text-tape-accent text-lg">✓</span>
                  )}
                </div>
                <h3 className="font-bold text-tape-text mb-2">{seed.label}</h3>
                <p className="text-tape-muted text-sm mb-4">{seed.description}</p>
                <div className="space-y-2 mb-4">
                  {seed.tapes.map((tape, i) => (
                    <div key={i} className="text-xs">
                      <span className="text-tape-muted">📼 磁带{i + 1}: </span>
                      <span className="text-tape-text">{tape.label}</span>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {tape.defects.map((d) => (
                          <span
                            key={d}
                            className="px-1.5 py-0.5 bg-tape-danger/30 text-tape-danger rounded text-[10px]"
                          >
                            {defectLabels[d]}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-[11px] text-tape-accent/80 border-t border-tape-border pt-2">
                  💡 {seed.hint}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={createSession}
          disabled={loading || !selectedSeed}
          className="w-full md:w-auto px-8 py-3 bg-tape-accent text-black font-bold rounded hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {loading ? '初始化局次中...' : '▶ 开始修复作业'}
        </button>
      </section>

      {sessions.length > 0 && (
        <section>
          <h2 className="text-xl text-tape-accent mb-4">📋 历史局次记录</h2>
          <div className="bg-tape-panel border border-tape-border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-tape-bg text-tape-muted text-xs">
                <tr>
                  <th className="text-left p-3">局次ID</th>
                  <th className="text-left p-3">批次名称</th>
                  <th className="text-left p-3">磁带数</th>
                  <th className="text-left p-3">状态</th>
                  <th className="text-left p-3">开始时间</th>
                  <th className="text-left p-3">分数/评级</th>
                  <th className="text-left p-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id} className="border-t border-tape-border">
                    <td className="p-3 font-mono text-tape-muted text-xs">
                      {s.id.slice(0, 8)}...
                    </td>
                    <td className="p-3 text-tape-text">{s.label}</td>
                    <td className="p-3">{s.tapeCount}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          s.status === 'completed'
                            ? 'bg-tape-success/30 text-tape-success'
                            : 'bg-tape-accent/30 text-tape-accent'
                        }`}
                      >
                        {s.status === 'completed' ? '已完成' : '进行中'}
                      </span>
                    </td>
                    <td className="p-3 text-tape-muted text-xs">
                      {new Date(s.startedAt).toLocaleString('zh-CN')}
                    </td>
                    <td className="p-3">
                      {s.status === 'completed' ? (
                        <span className="text-tape-accent font-bold">
                          {s.finalScore.toFixed(1)} / {s.grade}
                        </span>
                      ) : (
                        <span className="text-tape-muted">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      <Link
                        href={
                          s.status === 'completed'
                            ? `/session/${s.id}/result`
                            : `/session/${s.id}`
                        }
                        className="text-tape-accent hover:underline text-xs"
                      >
                        {s.status === 'completed' ? '查看结算' : '继续修复'} →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <footer className="mt-16 pt-6 border-t border-tape-border text-center text-tape-muted text-xs">
        <p>数据存储：本地 SQLite | 操作自动入库 | 局次状态可恢复</p>
      </footer>
    </div>
  );
}
