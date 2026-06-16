import { useState, useEffect } from 'react';
import type { FinishedInstrument } from '@/types/game';
import { listInstrumentsByPlayer } from '@/utils/storage';
import { INITIAL_LEVELS } from '@/data/levels';

interface InstrumentArchiveProps {
  playerId: string;
}

function InstrumentArchive({ playerId }: InstrumentArchiveProps) {
  const [instruments, setInstruments] = useState<FinishedInstrument[]>([]);

  useEffect(() => {
    if (playerId && playerId !== 'guest') {
      setInstruments(listInstrumentsByPlayer(playerId));
    }
  }, [playerId]);

  if (playerId === 'guest') {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>
        请先在首页选择玩家档案
      </div>
    );
  }

  if (instruments.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>
        还没有完成的作品，快去制琴吧！
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, color: '#f5a623' }}>
        成品档案
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {instruments.map((inst) => {
          const level = INITIAL_LEVELS.find((l) => l.id === inst.levelId);
          return (
            <div
              key={inst.id}
              style={{
                background: '#1a1a2e',
                border: '1px solid #2a2a4a',
                borderRadius: 12,
                padding: 20,
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                {inst.name}
              </div>
              {level && (
                <div style={{ fontSize: 13, color: '#aaa', marginBottom: 12 }}>
                  {level.name}
                </div>
              )}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: '#f5a623' }}>得分: {inst.score}</span>
                <span style={{ fontSize: 13, color: '#4caf50' }}>满意度: {inst.customerFeedback.satisfaction}%</span>
              </div>
              <div style={{ fontSize: 13, color: '#aaa', fontStyle: 'italic' }}>
                {inst.customerFeedback.comment}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default InstrumentArchive;
