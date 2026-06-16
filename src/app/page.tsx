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

export default function HomePage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayers = useCallback(async () => {
    try {
      const res = await fetch('/api/players');
      if (!res.ok) throw new Error();
      const data: Player[] = await res.json();
      setPlayers(data);
    } catch {
      setError('获取玩家列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('playerId');
    if (saved) setSelectedPlayerId(saved);
    fetchPlayers();
  }, [fetchPlayers]);

  const handleSelectPlayer = (id: string) => {
    setSelectedPlayerId(id);
    localStorage.setItem('playerId', id);
  };

  const handleCreatePlayer = async () => {
    if (!newPlayerName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPlayerName.trim() }),
      });
      if (!res.ok) throw new Error();
      const player: Player = await res.json();
      setNewPlayerName('');
      await fetchPlayers();
      handleSelectPlayer(player.id);
    } catch {
      setError('创建玩家失败');
    } finally {
      setCreating(false);
    }
  };

  const handleEnterGame = () => {
    if (selectedPlayerId) {
      router.push('/levels');
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-8 sm:py-12">
      <header className="text-center mb-10 sm:mb-14">
        <div className="inline-block border-4 ornate-border px-8 sm:px-14 py-6 sm:py-8 bg-ancient-100/60 scroll-shadow">
          <h1 className="text-3xl sm:text-5xl font-black text-ancient-900 tracking-widest leading-tight">
            古城影壁拼图修复游戏
          </h1>
        </div>
        <p className="mt-5 text-lg sm:text-xl text-ancient-700 tracking-[0.3em] font-medium">
          修复千年影壁，重现古韵光华
        </p>
        <div className="mt-3 flex justify-center gap-2">
          <span className="block w-12 h-0.5 bg-ancient-300" />
          <span className="block w-3 h-3 rounded-full border-2 border-ancient-400 bg-ancient-100" />
          <span className="block w-12 h-0.5 bg-ancient-300" />
        </div>
      </header>

      <section className="w-full max-w-2xl mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-ancient-800 mb-4 text-center tracking-wider">
          选择修复匠人
        </h2>

        {loading ? (
          <div className="text-center py-10 text-ancient-500 text-lg">加载中...</div>
        ) : error && players.length === 0 ? (
          <div className="text-center py-10 text-cinnabar-600">{error}</div>
        ) : players.length === 0 ? (
          <div className="text-center py-10 text-ancient-400 text-lg">
            尚无匠人记录，请创建新匠人
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4">
            {players.map((player) => {
              const isSelected = selectedPlayerId === player.id;
              return (
                <button
                  key={player.id}
                  onClick={() => handleSelectPlayer(player.id)}
                  className={`w-full text-left p-4 sm:p-5 rounded-lg border-2 transition-all duration-200 scroll-shadow ${
                    isSelected
                      ? 'bg-ancient-200/70 border-ancient-500 ring-2 ring-ancient-400/40 scale-[1.01]'
                      : 'bg-ancient-100/50 border-ancient-300 hover:bg-ancient-200/50 hover:border-ancient-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                          isSelected
                            ? 'bg-jade-600 text-white'
                            : 'bg-ancient-300 text-ancient-800'
                        }`}
                      >
                        {player.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-ancient-900">{player.name}</div>
                        <div className="text-sm text-ancient-600 mt-0.5">
                          {player.levelsCompleted} 关已过 · {player.perfectRepairs} 次完美修复
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-jade-700">{player.totalScore}</div>
                      <div className="text-xs text-ancient-500">总分</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="w-full max-w-2xl mb-8">
        <div className="border-2 border-ancient-300 rounded-lg p-5 bg-ancient-100/40 scroll-shadow">
          <h3 className="text-lg font-semibold text-ancient-800 mb-3 tracking-wider">
            创建新匠人
          </h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="输入匠人名号"
              maxLength={20}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreatePlayer(); }}
              className="flex-1 px-4 py-2.5 rounded-lg border-2 border-ancient-300 bg-ancient-50 text-ancient-900 placeholder:text-ancient-400 focus:outline-none focus:border-ancient-500 focus:ring-1 focus:ring-ancient-400 transition-colors font-serif-cn"
            />
            <button
              type="button"
              onClick={handleCreatePlayer}
              disabled={creating || !newPlayerName.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {creating ? '创建中...' : '创建'}
            </button>
          </div>
          {error && !loading && players.length > 0 && (
            <p className="text-cinnabar-600 text-sm mt-2">{error}</p>
          )}
        </div>
      </section>

      {selectedPlayerId && (
        <div className="mt-2 mb-8">
          <button
            onClick={handleEnterGame}
            className="btn-ancient text-lg px-10 py-3 tracking-widest animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-ancient-100 via-ancient-200 to-ancient-100"
          >
            进入游戏
          </button>
        </div>
      )}

      <footer className="mt-auto pt-8 text-center text-ancient-400 text-sm tracking-wider">
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
