import * as React from 'react';
import { useEffect, useRef } from 'react';
import type { OperationRecord } from '@/types/game';

interface OperationTimelineProps {
  operations: OperationRecord[];
  historyIndex: number;
  visible?: boolean;
}

const typeIcons: Record<OperationRecord['type'], string> = {
  adjust: '🔧',
  reset: '🔄',
  evaluate: '✅',
};

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((v: number) => (v < 10 ? '0' + v : String(v)))
    .join(':');
}

const OperationTimeline: React.FC<OperationTimelineProps> = ({
  operations,
  historyIndex,
  visible = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [operations.length]);

  if (!visible) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      style={{
        maxHeight: 300,
        overflowY: 'auto',
        background: '#1a1a2e',
        padding: 12,
        borderRadius: 8,
        color: '#e0e0e0',
        fontFamily: 'monospace',
        fontSize: 13,
      }}
    >
      {operations.map((op: OperationRecord, index: number) => {
        const applied = index <= historyIndex;
        return (
          <div
            key={op.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 0',
              opacity: applied ? 1 : 0.4,
              textDecoration: applied ? 'none' : 'line-through',
              position: 'relative',
            }}
          >
            <span style={{ flexShrink: 0, color: '#888' }}>
              {formatTimestamp(op.timestamp)}
            </span>
            <span style={{ flexShrink: 0 }}>{typeIcons[op.type]}</span>
            <span style={{ flex: 1 }}>{op.description}</span>
            {index === historyIndex && (
              <span
                style={{
                  flexShrink: 0,
                  fontSize: 11,
                  color: '#00d4ff',
                  fontWeight: 'bold',
                }}
              >
                当前
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default OperationTimeline;
