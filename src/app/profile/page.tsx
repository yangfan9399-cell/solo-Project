'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Player, GameSession, ScoreRecord, Level } from '@/lib/types';

interface SessionWithLevel extends GameSession {
  levelName?: string;
}

const rankColor: Record<string, string> = {
  S: 'text-amber-500',
  A: 'text-jade-600',
  B: 'text-ancient-500',
  C: 'text-cinnabar-500',
  D: 'text-cinnabar-900',
};

const rankBg: Record<string, string> = {
  S: 'bg-amber-50 border-amber-300',
  A: 'bg-jade-50 border-jade-300',
  B: 'bg-ancient-100 border-ancient-300',
  C: 'bg-cinnabar-50 border-cinnabar-300',
  D: 'bg-cinnabar-100 border-cinnabar-400',
};

export default function ProfilePage() {
  const router = useRouter();
  const [player, setPlayer] = useState<Player | null>(null);
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [sessions, setSessions] = useState<SessionWithLevel[]>([]);
  const [levelMap, setLevelMap] = useState<Record<number, Level>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (playerId: string) => {
    try {
      const [playerRes, scoresRes, sessionsRes, levelsRes] = await Promise.all([
        fetch(`/api/players/${playerId}`),
        fetch(`/api/players/${playerId}/scores`),
        fetch(`/api/sessions?playerId=${playerId}`),
        fetch('/api/levels'),
      ]);

      if (playerRes.ok) setPlayer(await playerRes.json());
      if (scoresRes.ok) setScores(await scoresRes.json());
      if (levelsRes.ok) {
        const levels: Level[] = await levelsRes.json();
        const map: Record<number, Level> = {};
        for (const l of levels) map[l.id] = l;
        setLevelMap(map);
      }
      if (sessionsRes.ok) {
        const sess: GameSession[] = await sessionsRes.json();
        setSessions(sess);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const playerId = localStorage.getItem('playerId');
    if (!playerId) {
      router.push('/');
      return;
    }
    load(playerId);
  }, [router, load]);

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="text-ancient-500 text-xl tracking-widest">加载中...</div>
      </main>
    );
  }

  if (!player) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="text-cinnabar-600 text-xl">玩家信息不存在</div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col px-4 py-6 sm:py-10 max-w-3xl mx-auto w-full">
      <header className="text-center mb-8">
        <div className="inline-block border-4 ornate-border px-8 sm:px-14 py-5 sm:py-7 bg-ancient-100/60 scroll-shadow">
          <h1 className="text-3xl sm:text-4xl font-black text-ancient-900 tracking-widest">
            匠人档案
          </h1>
        </div>
        <div className="mt-3 flex justify-center gap-2">
          <span className="block w-12 h-0.5 bg-ancient-300" />
          <span className="block w-3 h-3 rounded-full border-2 border-ancient-400 bg-ancient-100" />
          <span className="block w-12 h-0.5 bg-ancient-300" />
        </div>
      </header>

      <section className="mb-8">
        <div className="flex items-center gap-5 p-5 bg-ancient-100/60 border border-ancient-300 rounded-lg scroll-shadow">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-ancient-300 to-ancient-500 flex items-center justify-center text-2xl font-black text-ancient-50 border-2 border-ancient-400 shrink-0">
            {player.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-ancient-900 tracking-wider truncate">{player.name}</h2>
            <p className="text-sm text-ancient-500 mt-0.5">
              入行于 {new Date(player.createdAt).toLocaleDateString('zh-CN')}
            </p>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-ancient-900 tracking-wider mb-4 flex items-center gap-2">
          <span className="text-ancient-400">◆</span>
          修复成就
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 bg-ancient-100/60 border border-ancient-300 rounded-lg text-center scroll-shadow">
            <div className="text-2xl font-black text-jade-700">{player.totalScore}</div>
            <div className="text-xs text-ancient-600 mt-1 tracking-wider">总分</div>
          </div>
          <div className="p-4 bg-ancient-100/60 border border-ancient-300 rounded-lg text-center scroll-shadow">
            <div className="text-2xl font-black text-ancient-800">{player.levelsCompleted}</div>
            <div className="text-xs text-ancient-600 mt-1 tracking-wider">关卡完成</div>
          </div>
          <div className="p-4 bg-ancient-100/60 border border-ancient-300 rounded-lg text-center scroll-shadow">
            <div className="text-2xl font-black text-ancient-800">{player.totalPiecesPlaced}</div>
            <div className="text-xs text-ancient-600 mt-1 tracking-wider">碎片放置</div>
          </div>
          <div className="p-4 bg-ancient-100/60 border border-ancient-300 rounded-lg text-center scroll-shadow">
            <div className="text-2xl font-black text-amber-500">{player.perfectRepairs}</div>
            <div className="text-xs text-ancient-600 mt-1 tracking-wider">完美修复</div>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-ancient-900 tracking-wider mb-4 flex items-center gap-2">
          <span className="text-ancient-400">◆</span>
          近期记录
        </h2>
        <div className="space-y-2">
          {sessions.slice(0, 10).map((s) => {
            const levelName = levelMap[s.levelId]?.name ?? `关卡 ${s.levelId}`;
            const statusLabel = s.status === 'completed' ? '完成' : s.status === 'failed' ? '失败' : s.status === 'abandoned' ? '放弃' : '进行中';
            const statusColor = s.status === 'completed' ? 'text-jade-700 bg-jade-50 border-jade-300' : s.status === 'failed' ? 'text-cinnabar-600 bg-cinnabar-50 border-cinnabar-300' : 'text-ancient-600 bg-ancient-100 border-ancient-300';
            return (
              <div key={s.id} className="flex items-center justify-between p-3 bg-ancient-50 border border-ancient-200 rounded-lg hover:bg-ancient-100/60 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-ancient-900 truncate">{levelName}</div>
                  <div className="text-xs text-ancient-500 mt-0.5">
                    {new Date(s.startTime).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${statusColor}`}>
                    {statusLabel}
                  </span>
                  <span className="text-sm font-bold text-ancient-800">{s.currentScore}</span>
                </div>
              </div>
            );
          })}
          {sessions.length === 0 && (
            <div className="text-center py-8 text-ancient-400">暂无游戏记录</div>
          )}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-ancient-900 tracking-wider mb-4 flex items-center gap-2">
          <span className="text-ancient-400">◆</span>
          评分记录
        </h2>
        <div className="space-y-2">
          {scores.map((s) => {
            const levelName = levelMap[s.levelId]?.name ?? `关卡 ${s.levelId}`;
            return (
              <div key={s.id} className="flex items-center justify-between p-3 bg-ancient-50 border border-ancient-200 rounded-lg hover:bg-ancient-100/60 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-ancient-900 truncate">{levelName}</div>
                  <div className="text-xs text-ancient-500 mt-0.5">
                    {new Date(s.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full border-2 font-black text-sm ${rankBg[s.rank] ?? rankBg.D} ${rankColor[s.rank] ?? rankColor.D}`}>
                    {s.rank}
                  </span>
                  <span className="text-sm font-bold text-ancient-800">{s.finalScore}</span>
                </div>
              </div>
            );
          })}
          {scores.length === 0 && (
            <div className="text-center py-8 text-ancient-400">暂无评分记录</div>
          )}
        </div>
      </section>

      <div className="flex justify-center mb-8">
        <button
          onClick={() => router.push('/levels')}
          className="btn-ancient tracking-widest"
        >
          返回关卡
        </button>
      </div>

      <footer className="mt-auto pt-6 text-center text-ancient-400 text-sm tracking-wider">
        <div className="flex justify-center items-center gap-3 mb-2">
          <span className="w-8 h-px bg-ancient-300" />
          <span className="text-ancient-400">◆</span>
          <span className="w-8 h-px bg-ancient-300" />
        </div>
        <p>古城影壁 · 匠心修复</p>
      </footer>
    </main>
  );
}
