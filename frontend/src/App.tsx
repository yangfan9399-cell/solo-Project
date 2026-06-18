import { useState, useEffect, useCallback } from 'react';
import { Board } from './components/Board';
import { FieldDisplay } from './components/FieldDisplay';
import { EventBox } from './components/EventBox';
import { ReplayAxis } from './components/ReplayAxis';
import { SettlementBook } from './components/SettlementBook';
import { MazeMeta, DifficultyKey, MazeConfig, GameSession, Settlement } from './types';
import { listMazes, getMaze, createSession, getSession, makeMove, getSettlement } from './api';

const STORAGE_KEY = 'wax_seal_maze_session_v1';
const STORAGE_MAZE_KEY = 'wax_seal_maze_maze_v1';

export default function App() {
  const [mazes, setMazes] = useState<MazeMeta[]>([]);
  const [maze, setMaze] = useState<MazeConfig | null>(null);
  const [session, setSession] = useState<GameSession | null>(null);
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const restoreState = useCallback(async () => {
    try {
      const storedSessionId = localStorage.getItem(STORAGE_KEY);
      const storedMazeKey = localStorage.getItem(STORAGE_MAZE_KEY) as DifficultyKey | null;
      if (storedSessionId && storedMazeKey) {
        const [restoredMaze, restoredSession] = await Promise.all([
          getMaze(storedMazeKey),
          getSession(storedSessionId).catch(() => null),
        ]);
        if (restoredSession && restoredSession.status === 'playing') {
          setMaze(restoredMaze);
          setSession(restoredSession);
          return;
        }
      }
    } catch (_) { /* ignore */ }
    loadMazes();
  }, []);

  useEffect(() => {
    restoreState();
  }, [restoreState]);

  const loadMazes = async () => {
    const list = await listMazes();
    setMazes(list);
  };

  const startMaze = async (key: DifficultyKey) => {
    setLoading(true);
    setError(null);
    try {
      const [m, s] = await Promise.all([getMaze(key), createSession(key)]);
      setMaze(m);
      setSession(s);
      setSettlement(null);
      localStorage.setItem(STORAGE_KEY, s.id);
      localStorage.setItem(STORAGE_MAZE_KEY, key);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleMove = async (x: number, y: number) => {
    if (!session) return;
    try {
      const newSession = await makeMove(session.id, x, y);
      setSession(newSession);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleSettle = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const s = await getSettlement(session.id);
      setSettlement(s);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const resetGame = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_MAZE_KEY);
    setSession(null);
    setMaze(null);
    setSettlement(null);
    setError(null);
  };

  if (!maze || !session) {
    return (
      <div className="app">
        <header className="app-header">
          <h1 className="app-title">蜡封迷宫航线推演局</h1>
          <p className="app-subtitle">Wax Seal Maze · 点亮封蜡，推演航线</p>
        </header>
        <div className="mazes-menu">
          {mazes.map((m) => (
            <div key={m.key} className="maze-card" onClick={() => startMaze(m.key)}>
              <div className="maze-card-tag">局{m.key}</div>
              <h3 className="maze-card-name">{m.name}</h3>
              <p className="maze-card-desc">{m.description}</p>
              <button className="btn btn-primary">开始推演</button>
            </div>
          ))}
          {loading && <div className="loading">正在初始化推演局...</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">蜡封迷宫航线推演局</h1>
        <div className="header-actions">
          <span className="header-session">会话ID: {session.id.slice(0, 10)}...</span>
          <button className="btn btn-ghost" onClick={resetGame}>
            重新选择局
          </button>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="game-layout">
        <div className="col col-left">
          <Board maze={maze} session={session} onMove={handleMove} />
          <ReplayAxis steps={session.steps} />
        </div>

        <div className="col col-right">
          <FieldDisplay
            field={session.field}
            status={session.status}
            hiddenTriggered={session.hiddenTriggered}
            winCondition={maze.winCondition}
            loseCondition={maze.loseCondition}
          />
          <EventBox maze={maze} steps={session.steps} />
          <SettlementBook
            settlement={settlement}
            loading={loading}
            onCalculate={handleSettle}
          />
        </div>
      </div>

      <footer className="app-footer">
        点击相邻可通行格子进行移动 · 每步消耗1点亮值 · 刷新页面将自动恢复当前推演局
      </footer>
    </div>
  );
}
