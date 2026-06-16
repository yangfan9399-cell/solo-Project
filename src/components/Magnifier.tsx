'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface MagnifierProps {
  active: boolean;
  onToggle: () => void;
}

export default function Magnifier({ active, onToggle }: MagnifierProps) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  const handleMove = useCallback((e: MouseEvent) => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setPos({ x: e.clientX, y: e.clientY });
    });
  }, []);

  useEffect(() => {
    if (active) {
      window.addEventListener('mousemove', handleMove);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [active, handleMove]);

  const lensSize = 160;
  const zoom = 2;

  return (
    <>
      <button
        onClick={onToggle}
        className={`px-3 py-1.5 text-sm font-semibold rounded border-2 transition-all duration-200 ${
          active
            ? 'bg-jade-600 border-jade-700 text-white'
            : 'bg-ancient-100 border-ancient-300 text-ancient-700 hover:bg-ancient-200'
        }`}
        title="放大镜"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 inline-block mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        放大镜
      </button>

      {active && (
        <div
          className="magnifier-overlay"
          style={{
            clipPath: `circle(${lensSize / 2}px at ${pos.x}px ${pos.y}px)`,
          }}
        >
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              transformOrigin: `${pos.x}px ${pos.y}px`,
              transform: `scale(${zoom})`,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                width: '100vw',
                height: '100vh',
                background: 'var(--ancient-bg)',
              }}
            />
          </div>
          <div
            style={{
              position: 'fixed',
              left: pos.x - lensSize / 2,
              top: pos.y - lensSize / 2,
              width: lensSize,
              height: lensSize,
              borderRadius: '50%',
              border: '3px solid #a34a21',
              boxShadow: '0 0 12px rgba(57,24,14,0.3)',
              pointerEvents: 'none',
            }}
          />
        </div>
      )}
    </>
  );
}
