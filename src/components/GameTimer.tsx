import { useEffect, useState } from 'react';

interface GameTimerProps {
  timeLimit: number | undefined;
  timeSpent: number;
  status: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${s}s`;
}

export default function GameTimer({ timeLimit, timeSpent, status }: GameTimerProps) {
  const [elapsed, setElapsed] = useState(timeSpent);

  useEffect(() => {
    setElapsed(timeSpent);
  }, [timeSpent]);

  useEffect(() => {
    if (status !== 'playing') return;

    const id = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(id);
  }, [status]);

  const remaining = timeLimit !== undefined ? Math.max(0, timeLimit - elapsed) : undefined;
  const isTimeUp = remaining !== undefined && remaining <= 0;
  const isCritical = remaining !== undefined && remaining < 10;
  const isWarning = remaining !== undefined && remaining < 30 && remaining >= 10;

  const baseStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '8px 16px',
    borderRadius: '8px',
    backgroundColor: '#1e1e2e',
    color: '#cdd6f4',
    fontFamily: 'monospace',
    fontSize: '16px',
    fontWeight: 'bold',
    userSelect: 'none',
  };

  const warningStyle: React.CSSProperties = {
    color: '#f38ba8',
    animation: 'blink 1s ease-in-out infinite',
  };

  const criticalStyle: React.CSSProperties = {
    color: '#f38ba8',
    fontSize: '22px',
  };

  const timeUpStyle: React.CSSProperties = {
    color: '#f38ba8',
    fontSize: '22px',
    fontWeight: 'bold',
  };

  let style = baseStyle;
  let displayText: string;

  if (isTimeUp) {
    style = { ...baseStyle, ...timeUpStyle };
    displayText = '时间到!';
  } else if (remaining !== undefined) {
    if (isCritical) {
      style = { ...baseStyle, ...criticalStyle };
    } else if (isWarning) {
      style = { ...baseStyle, ...warningStyle };
    }
    displayText = `剩余: ${formatTime(remaining)}`;
  } else {
    displayText = `已用时: ${formatTime(elapsed)}`;
  }

  const blinkKeyframes = `
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
  `;

  return (
    <>
      {isWarning && !isCritical && !isTimeUp && (
        <style>{blinkKeyframes}</style>
      )}
      <div style={style}>{displayText}</div>
    </>
  );
}
