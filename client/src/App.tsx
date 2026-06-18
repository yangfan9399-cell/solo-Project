import React, { useEffect, useMemo, useState } from 'react';
import { api } from './api';
import type { GameState, LevelId, LevelInfo, Settlement } from './types';
import { LevelSelect } from './components/LevelSelect';
import { GameBoard } from './components/GameBoard';
import { EventBox } from './components/EventBox';
import { ReplayTimeline } from './components/ReplayTimeline';
import { SettlementBook } from './components/SettlementBook';

const STORAGE_KEY = 'microlamp_coop_save_v1';

interface PersistedSave {
  sessionId: string;
  levelId: LevelId;
  steps: GameState['steps'];
}

function generateSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const App: React.FC = () => {
  const [levels, setLevels] = useState<LevelInfo[]>([]);
  const [currentLevel, setCurrentLevel] = useState<LevelInfo | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [settlement, setSettlement] = useState<Settlement | null>(null);

  const [loadingStart, setLoadingStart] = useState(false);
  const [loadingStep, setLoadingStep] = useState(false);
  const [loadingRollback, setLoadingRollback] = useState(false);
  const [loadingSettlement, setLoadingSettlement] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    api.listLevels().then(r => setLevels(r.levels));
  }, []);

  useEffect(() => {
    if (!levels.length) return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const save = JSON.parse(raw) as PersistedSave;
      const lv = levels.find(l => l.id === save.levelId);
      if (!lv) return;
      setLoadingStart(true);
      api.resume(save.sessionId, save.steps, save.levelId)
        .then(r => {
          setCurrentLevel(lv);
          setSessionId(r.sessionId);
          setGameState(r.state);
        })
        .catch(e => setError(e.message))
        .finally(() => setLoadingStart(false));
    } catch {
      /* ignore */
    }
  }, [levels]);

  useEffect(() => {
    if (gameState && sessionId && currentLevel) {
      const save: PersistedSave = {
        sessionId,
        levelId: gameState.levelId,
        steps: gameState.steps,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    }
  }, [gameState, sessionId, currentLevel]);

  const currentLevelData = useMemo(() => {
    if (!currentLevel && gameState) {
      return levels.find(l => l.id === gameState.levelId) || null;
    }
    return currentLevel;
  }, [currentLevel, gameState, levels]);

  const handleSelectLevel = (id: LevelId) => {
    const lv = levels.find(l => l.id === id);
    if (!lv) return;
    const sid = generateSessionId();
    setLoadingStart(true);
    setError('');
    setSettlement(null);
    api.start(id, sid)
      .then(r => {
        setCurrentLevel(lv);
        setSessionId(r.sessionId);
        setGameState(r.state);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoadingStart(false));
  };

  const handleExecute = (eventId: string) => {
    if (!sessionId || !gameState) return;
    setLoadingStep(true);
    setSettlement(null);
    api.applyStep(sessionId, eventId)
      .then(r => setGameState(r.state))
      .catch(e => setError(e.message))
      .finally(() => setLoadingStep(false));
  };

  const handleRollback = (stepIndex: number) => {
    if (!sessionId) return;
    setLoadingRollback(true);
    setSettlement(null);
    api.rollback(sessionId, stepIndex)
      .then(r => setGameState(r.state))
      .catch(e => setError(e.message))
      .finally(() => setLoadingRollback(false));
  };

  const handleSettlement = () => {
    if (!sessionId) return;
    setLoadingSettlement(true);
    api.settlement(sessionId)
      .then(r => setSettlement(r.settlement))
      .catch(e => setError(e.message))
      .finally(() => setLoadingSettlement(false));
  };

  const handleBackToMenu = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCurrentLevel(null);
    setGameState(null);
    setSessionId('');
    setSettlement(null);
    setError('');
  };

  if (loadingStart && !gameState) {
    return (
      <div style={{ padding: 80, textAlign: 'center', color: '#6b7280' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⛏️💡</div>
        <div>正在恢复回放轴或初始化局况...</div>
      </div>
    );
  }

  if (!currentLevelData || !gameState) {
    return (
      <div style={{ background: '#fafafa', minHeight: '100vh' }}>
        <LevelSelect levels={levels} onSelect={handleSelectLevel} />
      </div>
    );
  }

  return (
    <div style={{ background: '#f3f4f6', minHeight: '100vh', padding: '20px 24px 40px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}>
          <div>
            <div style={{
              fontSize: 11, color: '#6b7280', fontWeight: 600,
              letterSpacing: 1, textTransform: 'uppercase',
            }}>
              MICROLAMP COOP GAME
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>
              💡 云母矿灯协作闯关游戏
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleBackToMenu}
              style={{
                padding: '8px 16px',
                background: '#ffffff',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                color: '#374151',
                cursor: 'pointer',
              }}
            >🏠 返回关卡选择</button>
            <button
              onClick={() => handleSelectLevel(gameState.levelId)}
              style={{
                padding: '8px 16px',
                background: '#fef3c7',
                border: '1px solid #fbbf24',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                color: '#92400e',
                cursor: 'pointer',
              }}
            >🔁 重开本局</button>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', background: '#fee2e2',
            border: '1px solid #fca5a5', color: '#991b1b',
            borderRadius: 8, marginBottom: 14, fontSize: 13,
          }}>
            ⚠️ {error}
            <button
              onClick={() => setError('')}
              style={{ marginLeft: 12, background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer' }}
            >✕</button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <GameBoard level={currentLevelData} state={gameState} />
            <ReplayTimeline
              level={currentLevelData}
              state={gameState}
              onRollback={handleRollback}
              rollingBack={loadingRollback}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <EventBox
              level={currentLevelData}
              state={gameState}
              onExecute={handleExecute}
              loading={loadingStep}
            />
            <SettlementBook
              settlement={settlement}
              loading={loadingSettlement}
              level={currentLevelData}
              onRequest={handleSettlement}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
