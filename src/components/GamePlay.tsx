import { useState } from 'react';
import { useGameSession } from '@/hooks/useGameSession';
import ToneRadar from '@/components/ToneRadar';
import SpectrumChart from '@/components/SpectrumChart';
import AdjustmentPanel from '@/components/AdjustmentPanel';
import OperationTimeline from '@/components/OperationTimeline';
import ScoreDisplay from '@/components/ScoreDisplay';
import FeedbackCard from '@/components/FeedbackCard';
import GameTimer from '@/components/GameTimer';
import { INITIAL_LEVELS, WOOD_TYPES } from '@/data/levels';
import type { ToneProfile, SoundSample } from '@/types/game';

interface GamePlayProps {
  levelId: string;
  playerId: string;
  resumeSessionId?: string;
}

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: '初级',
  intermediate: '中级',
  expert: '专家',
};

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: '#4caf50',
  intermediate: '#f5a623',
  expert: '#e94560',
};

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 60, height: 6, background: '#2a2a4a', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${(value / max) * 100}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 11, color: '#aaa' }}>{value}</span>
    </div>
  );
}

function GamePlay({ levelId, playerId, resumeSessionId }: GamePlayProps) {
  const level = INITIAL_LEVELS.find((l) => l.id === levelId);
  const {
    session,
    currentTone,
    currentSpectrum,
    scoreResult,
    feedback,
    gameStatus,
    selectedWood,
    timeSpent,
    startSession,
    resumeSession,
    adjustField,
    undo,
    redo,
    canUndo,
    canRedo,
    resetAdjustments,
    evaluate,
    selectWood,
  } = useGameSession({ levelId, playerId });

  const [hoveredWood, setHoveredWood] = useState('');

  useEffect(() => {
    if (resumeSessionId && gameStatus === 'idle') {
      resumeSession(resumeSessionId);
    }
  }, [resumeSessionId]);

  const availableWoods = level
    ? WOOD_TYPES.filter((w) => level.woodTypes.includes(w.id))
    : WOOD_TYPES;

  const targetTone: ToneProfile | null = level?.targetTone ?? null;
  const targetSpectrum: SoundSample[] = level?.targetSoundSpectrum ?? [];

  if (!level) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#e94560', fontSize: 18 }}>
        关卡未找到
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#1a1a2e', color: '#eee', fontFamily: 'system-ui, sans-serif' }}>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        background: '#0f3460',
        borderBottom: '1px solid #1a1a4a',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>{level.name}</span>
          <span style={{
            fontSize: 12,
            padding: '2px 10px',
            borderRadius: 10,
            background: DIFFICULTY_COLOR[level.difficulty] + '33',
            color: DIFFICULTY_COLOR[level.difficulty],
            border: `1px solid ${DIFFICULTY_COLOR[level.difficulty]}`,
          }}>
            {DIFFICULTY_LABEL[level.difficulty]}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <GameTimer timeLimit={level.timeLimit} timeSpent={timeSpent} status={gameStatus} />
          <a
            href="/"
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              background: '#e94560',
              color: '#fff',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            返回
          </a>
        </div>
      </div>

      {gameStatus === 'idle' && (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 style={{ fontSize: 24, margin: '0 0 8px', color: '#f5a623' }}>{level.name}</h2>
            <p style={{ color: '#aaa', fontSize: 15, margin: '0 0 8px' }}>{level.description}</p>
            <span style={{
              fontSize: 13,
              padding: '3px 12px',
              borderRadius: 10,
              background: DIFFICULTY_COLOR[level.difficulty] + '22',
              color: DIFFICULTY_COLOR[level.difficulty],
            }}>
              难度: {DIFFICULTY_LABEL[level.difficulty]}
            </span>
          </div>

          <h3 style={{ fontSize: 18, marginBottom: 16, color: '#ccc' }}>选择木材</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
            {availableWoods.map((wood) => (
              <div
                key={wood.id}
                onClick={() => selectWood(wood.id)}
                onMouseEnter={() => setHoveredWood(wood.id)}
                onMouseLeave={() => setHoveredWood('')}
                style={{
                  padding: 16,
                  borderRadius: 10,
                  background: selectedWood === wood.id ? '#0f3460' : hoveredWood === wood.id ? '#1a1a4a' : '#16163a',
                  border: selectedWood === wood.id ? '2px solid #e94560' : '2px solid #2a2a4a',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: selectedWood === wood.id ? '#e94560' : '#eee' }}>
                  {wood.name}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#888', width: 40 }}>共鸣</span>
                    <MiniBar value={wood.resonance} max={100} color="#e94560" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#888', width: 40 }}>温暖</span>
                    <MiniBar value={wood.warmth} max={100} color="#f5a623" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#888', width: 40 }}>明亮</span>
                    <MiniBar value={wood.brightness} max={100} color="#4fc3f7" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              disabled={!selectedWood}
              onClick={() => selectedWood && startSession(selectedWood)}
              style={{
                padding: '12px 40px',
                fontSize: 18,
                fontWeight: 700,
                borderRadius: 8,
                border: 'none',
                cursor: selectedWood ? 'pointer' : 'not-allowed',
                background: selectedWood ? '#e94560' : '#333',
                color: selectedWood ? '#fff' : '#666',
                transition: 'all 0.2s',
              }}
            >
              开始制琴
            </button>
          </div>
        </div>
      )}

      {gameStatus === 'playing' && session && (
        <div style={{ display: 'flex', gap: 16, padding: 16, height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
          <div style={{ flex: '0 0 60%', display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto' }}>
            <div style={{ background: '#16163a', borderRadius: 10, padding: 16, border: '1px solid #2a2a4a' }}>
              <ToneRadar current={currentTone} target={targetTone} />
            </div>
            <div style={{ background: '#16163a', borderRadius: 10, padding: 16, border: '1px solid #2a2a4a' }}>
              <SpectrumChart current={currentSpectrum} target={targetSpectrum} />
            </div>
            <div style={{ background: '#16163a', borderRadius: 10, padding: 16, border: '1px solid #2a2a4a' }}>
              <AdjustmentPanel
                adjustments={session.adjustments}
                disabled={false}
                onChange={adjustField}
                onReset={resetAdjustments}
                onUndo={undo}
                onRedo={redo}
                canUndo={canUndo}
                canRedo={canRedo}
              />
            </div>
          </div>

          <div style={{ flex: '0 0 40%', display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto' }}>
            <div style={{ background: '#16163a', borderRadius: 10, padding: 16, border: '1px solid #2a2a4a', flex: 1, overflow: 'auto' }}>
              <OperationTimeline operations={session.operationHistory} historyIndex={session.historyIndex} />
            </div>

            <div style={{ background: '#16163a', borderRadius: 10, padding: 16, border: '1px solid #2a2a4a' }}>
              <label style={{ display: 'block', fontSize: 13, color: '#aaa', marginBottom: 8 }}>木材类型</label>
              <select
                value={selectedWood}
                onChange={(e) => selectWood(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 6,
                  background: '#0f3460',
                  color: '#eee',
                  border: '1px solid #2a2a4a',
                  fontSize: 14,
                  outline: 'none',
                }}
              >
                {availableWoods.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={evaluate}
              style={{
                padding: '14px 24px',
                fontSize: 16,
                fontWeight: 700,
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                background: '#f5a623',
                color: '#1a1a2e',
                transition: 'all 0.2s',
              }}
            >
              提交评估
            </button>
          </div>
        </div>
      )}

      {gameStatus === 'evaluating' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: 'calc(100vh - 56px)',
          gap: 20,
        }}>
          <div style={{
            width: 48,
            height: 48,
            border: '4px solid #2a2a4a',
            borderTopColor: '#e94560',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <span style={{ fontSize: 18, color: '#aaa' }}>正在评估...</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {(gameStatus === 'won' || gameStatus === 'lost') && scoreResult && feedback && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
        }}>
          <div style={{
            background: '#16163a',
            borderRadius: 16,
            padding: 32,
            maxWidth: 520,
            width: '90%',
            border: `2px solid ${gameStatus === 'won' ? '#f5a623' : '#e94560'}`,
            textAlign: 'center',
          }}>
            <h2 style={{
              fontSize: 28,
              fontWeight: 700,
              margin: '0 0 24px',
              color: gameStatus === 'won' ? '#f5a623' : '#e94560',
            }}>
              {gameStatus === 'won' ? '🎉 恭喜通关!' : '😔 评估未通过'}
            </h2>

            <ScoreDisplay scoreResult={scoreResult} visible={true} />

            <div style={{ marginTop: 20 }}>
              <FeedbackCard feedback={feedback} visible={true} />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28 }}>
              {gameStatus === 'lost' && (
                <button
                  onClick={() => startSession(selectedWood)}
                  style={{
                    padding: '10px 24px',
                    fontSize: 15,
                    fontWeight: 600,
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    background: '#e94560',
                    color: '#fff',
                  }}
                >
                  重新调校
                </button>
              )}
              <a
                href="/"
                style={{
                  padding: '10px 24px',
                  fontSize: 15,
                  fontWeight: 600,
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  background: '#0f3460',
                  color: '#eee',
                  textDecoration: 'none',
                }}
              >
                返回关卡选择
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GamePlay;
