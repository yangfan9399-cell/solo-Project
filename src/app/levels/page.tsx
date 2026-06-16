'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Player {
  id: string;
  name: string;
  avatar?: string;
  totalScore: number;
  levelsCompleted: number;
  totalPiecesPlaced: number;
  perfectRepairs: number;
  createdAt: number;
  updatedAt: number;
}

interface Level {
  id: number;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'master';
  gridRows: number;
  gridCols: number;
  layers: number;
  timeLimit: number;
  baseScore: number;
  era: string;
  location: string;
  patternType: string;
}

const difficultyConfig: Record<Level['difficulty'], { label: string; className: string }> = {
  easy: { label: '初学', className: 'bg-jade-100 text-jade-700 border-jade-300' },
  medium: { label: '进阶', className: 'bg-ancient-100 text-ancient-500 border-ancient-300' },
  hard: { label: '挑战', className: 'bg-cinnabar-100 text-cinnabar-700 border-cinnabar-300' },
  master: { label: '宗师', className: 'bg-ancient-950 text-ancient-100 border-ancient-800' },
};

export default function LevelsPage() {
  const router = useRouter();
  const [levels, setLevels] = useState<Level[]>([]);
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPlayer = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/players/${id}`);
      if (!res.ok) return;
      const data: Player = await res.json();
      setPlayer(data);
    } catch {}
  }, []);

  useEffect(() => {
    const playerId = localStorage.getItem('playerId');
    if (!playerId) {
      router.push('/');
      return;
    }

    const load = async () => {
      try {
        const [levelsRes, playerRes] = await Promise.all([
          fetch('/api/levels'),
          fetch(`/api/players/${playerId}`),
        ]);
        if (levelsRes.ok) {
          const data: Level[] = await levelsRes.json();
          setLevels(data);
        }
        if (playerRes.ok) {
          const data: Player = await playerRes.json();
          setPlayer(data);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router, fetchPlayer]);

  const handleLevelClick = (levelId: number) => {
    router.push(`/game/${levelId}`);
  };

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="text-ancient-500 text-xl tracking-widest">加载中...</div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col px-4 py-6 sm:py-10 max-w-4xl mx-auto w-full">
      <header className="text-center mb-8 sm:mb-10">
        <div className="inline-block border-4 ornate-border px-8 sm:px-14 py-5 sm:py-7 bg-ancient-100/60 scroll-shadow">
          <h1 className="text-3xl sm:text-4xl font-black text-ancient-900 tracking-widest">
            选择关卡
          </h1>
        </div>
        {player && (
          <div className="mt-4 flex items-center justify-center gap-4 text-ancient-700">
            <span className="text-lg font-semibold tracking-wider">{player.name}</span>
            <span className="w-1 h-1 rounded-full bg-ancient-400" />
            <span>总分 <strong className="text-jade-700">{player.totalScore}</strong></span>
            <span className="w-1 h-1 rounded-full bg-ancient-400" />
            <span>已过 <strong className="text-ancient-800">{player.levelsCompleted}</strong> 关</span>
          </div>
        )}
        <div className="mt-3 flex justify-center gap-2">
          <span className="block w-12 h-0.5 bg-ancient-300" />
          <span className="block w-3 h-3 rounded-full border-2 border-ancient-400 bg-ancient-100" />
          <span className="block w-12 h-0.5 bg-ancient-300" />
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mb-8">
        {levels.map((level) => {
          const diff = difficultyConfig[level.difficulty];
          return (
            <button
              key={level.id}
              onClick={() => handleLevelClick(level.id)}
              className="text-left p-5 sm:p-6 bg-ancient-100 border-2 border-ancient-300 rounded-lg scroll-shadow transition-all duration-200 hover:ornate-border hover:border-ancient-500 hover:bg-ancient-200/60 hover:shadow-lg active:scale-[0.99]"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg sm:text-xl font-bold text-ancient-900 tracking-wide leading-snug">
                  {level.name}
                </h3>
                <span className={`shrink-0 ml-2 px-2.5 py-0.5 text-xs font-semibold rounded border ${diff.className}`}>
                  {diff.label}
                </span>
              </div>

              <p className="text-sm text-ancient-700 mb-3 leading-relaxed">
                {level.description}
              </p>

              <div className="space-y-1 text-sm text-ancient-600">
                <div className="flex items-center gap-2">
                  <span className="text-ancient-500">◆</span>
                  <span>{level.era} · {level.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-ancient-500">◆</span>
                  <span>{level.patternType}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-ancient-500">◆</span>
                  <span>{level.gridCols}×{level.gridRows} · {level.layers}层</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-ancient-500">◆</span>
                  <span>{level.timeLimit}分钟</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-ancient-500">◆</span>
                  <span>基础分 <strong className="text-ancient-800">{level.baseScore}</strong></span>
                </div>
              </div>
            </button>
          );
        })}
      </section>

      <div className="flex justify-center mb-8">
        <button
          onClick={() => router.push('/')}
          className="btn-ancient tracking-widest"
        >
          返回
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
