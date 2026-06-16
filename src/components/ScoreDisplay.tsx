import type { ScoreResult } from '@/types/game';

interface ScoreDisplayProps {
  scoreResult: ScoreResult;
  visible: boolean;
}

const DIMENSION_NAMES: Record<string, string> = {
  brightness: '明亮度',
  warmth: '温暖度',
  resonance: '共鸣',
  sustain: '延音',
  projection: '穿透力',
  clarity: '清晰度',
};

const BREAKDOWN_ITEMS = [
  { key: 'toneMatchScore' as const, label: '音色匹配', weight: '40%' },
  { key: 'spectrumMatchScore' as const, label: '声谱匹配', weight: '25%' },
  { key: 'adjustmentPrecisionScore' as const, label: '调校精度', weight: '20%' },
  { key: 'efficiencyScore' as const, label: '操作效率', weight: '15%' },
];

function getScoreColor(score: number): string {
  if (score >= 70) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

function ScoreDisplay({ scoreResult, visible }: ScoreDisplayProps) {
  if (!visible) return null;

  const { totalScore, details } = scoreResult;

  return (
    <div
      style={{
        background: '#1a1a2e',
        borderRadius: 16,
        padding: 32,
        color: '#e2e8f0',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          marginBottom: 28,
        }}
      >
        <span
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: getScoreColor(totalScore),
            lineHeight: 1,
          }}
        >
          {totalScore}
        </span>
        <span style={{ fontSize: 18, color: '#94a3b8', alignSelf: 'flex-end', marginBottom: 8 }}>
          分
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
        {BREAKDOWN_ITEMS.map((item) => {
          const score = scoreResult[item.key];
          return (
            <div key={item.key}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 14, color: '#cbd5e1' }}>
                  {item.label}
                  <span style={{ fontSize: 12, color: '#64748b', marginLeft: 6 }}>
                    ({item.weight})
                  </span>
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: getScoreColor(score) }}>
                  {score}
                </span>
              </div>
              <div
                style={{
                  height: 8,
                  borderRadius: 4,
                  background: 'rgba(255, 255, 255, 0.08)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${score}%`,
                    borderRadius: 4,
                    background: getScoreColor(score),
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14, color: '#e2e8f0' }}>
          音色维度详情
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12,
          }}
        >
          {details.tone.map((dim) => (
            <div
              key={dim.dimension}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                borderRadius: 8,
                padding: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: getScoreColor(dim.score),
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
                  {DIMENSION_NAMES[dim.dimension] || dim.dimension}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                  目标 {dim.target} / 实际 {dim.actual}
                </div>
              </div>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: getScoreColor(dim.score),
                  flexShrink: 0,
                }}
              >
                {dim.score}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#f59e0b',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 20,
            padding: '4px 14px',
            letterSpacing: 0.5,
          }}
        >
          后端重新计算
        </span>
      </div>
    </div>
  );
}

export default ScoreDisplay;
