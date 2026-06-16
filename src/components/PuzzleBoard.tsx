'use client';

import { useState, useMemo } from 'react';
import type { PuzzlePiece, Crack, PlacedPieceState } from '@/lib/types';

interface PuzzleBoardProps {
  pieces: PuzzlePiece[];
  cracks: Crack[];
  gridRows: number;
  gridCols: number;
  placedPieces: Map<string, PlacedPieceState>;
  currentLayer: number;
  selectedPieceId: string | null;
  hintPieceId: string | null;
  onPlacePiece: (pieceId: string, row: number, col: number) => void;
  onRemovePiece: (pieceId: string) => void;
  onRotatePiece: (pieceId: string) => void;
  onSelectPiece: (pieceId: string | null) => void;
}

export default function PuzzleBoard({
  pieces,
  cracks,
  gridRows,
  gridCols,
  placedPieces,
  currentLayer,
  selectedPieceId,
  hintPieceId,
  onPlacePiece,
  onRemovePiece,
  onRotatePiece,
  onSelectPiece,
}: PuzzleBoardProps) {
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

  const cellSize = Math.min(
    Math.floor((typeof window !== 'undefined' ? window.innerWidth * 0.6 : 600) / gridCols),
    72
  );

  const piecesByPosition = useMemo(() => {
    const map = new Map<string, PuzzlePiece>();
    for (const p of pieces) {
      map.set(`${p.row}-${p.col}-${p.layer}`, p);
    }
    return map;
  }, [pieces]);

  const cellHasPlacedPiece = (row: number, col: number): PlacedPieceState | undefined => {
    for (const [, state] of placedPieces) {
      if (state.isPlaced && state.row === row && state.col === col && state.layer === currentLayer) {
        return state;
      }
    }
    return undefined;
  };

  const visibleCracks = useMemo(() => {
    const placedIds = new Set<string>();
    for (const [, state] of placedPieces) {
      if (state.isPlaced && state.layer === currentLayer) placedIds.add(state.pieceId);
    }
    return cracks.filter((c) => placedIds.has(c.pieceIdA) && placedIds.has(c.pieceIdB));
  }, [cracks, placedPieces, currentLayer]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, row: number, col: number) => {
    e.preventDefault();
    const pieceId = e.dataTransfer.getData('text/plain');
    if (pieceId) {
      onPlacePiece(pieceId, row, col);
    }
  };

  const handleCellClick = (row: number, col: number) => {
    if (!selectedPieceId) return;
    const existing = cellHasPlacedPiece(row, col);
    if (existing) return;
    onPlacePiece(selectedPieceId, row, col);
  };

  const getHintPosition = (pieceId: string) => {
    const piece = pieces.find((p) => p.id === pieceId);
    if (!piece) return null;
    return { row: piece.row, col: piece.col };
  };

  return (
    <div
      className="relative border-2 border-ancient-400 rounded-lg bg-ancient-200/30 scroll-shadow overflow-hidden"
      style={{
        width: gridCols * cellSize,
        height: gridRows * cellSize,
      }}
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${gridCols}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${gridRows}, ${cellSize}px)`,
        }}
      >
        {Array.from({ length: gridRows * gridCols }, (_, idx) => {
          const row = Math.floor(idx / gridCols);
          const col = idx % gridCols;
          const placed = cellHasPlacedPiece(row, col);
          const isHovered = hoveredCell?.row === row && hoveredCell?.col === col;
          const piece = placed
            ? pieces.find((p) => p.id === placed.pieceId)
            : piecesByPosition.get(`${row}-${col}-${currentLayer}`);
          const isHintTarget = hintPieceId
            ? (() => {
                const hintPos = getHintPosition(hintPieceId);
                return hintPos?.row === row && hintPos?.col === col;
              })()
            : false;

          return (
            <div
              key={idx}
              className={`relative border border-ancient-300/50 transition-colors duration-150 ${
                isHovered && selectedPieceId && !placed
                  ? 'bg-jade-100/60 border-jade-400'
                  : isHintTarget
                    ? 'bg-jade-200/70 border-jade-500 animate-pulse'
                    : 'bg-ancient-100/30'
              }`}
              style={{ width: cellSize, height: cellSize }}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, row, col)}
              onMouseEnter={() => setHoveredCell({ row, col })}
              onMouseLeave={() => setHoveredCell(null)}
              onClick={() => handleCellClick(row, col)}
            >
              {placed && piece && (
                <div
                  className="puzzle-piece placed absolute inset-1 rounded-sm overflow-hidden"
                  style={{
                    transform: `rotate(${placed.rotation}deg)`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRotatePiece(placed.pieceId);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemovePiece(placed.pieceId);
                  }}
                >
                  <div dangerouslySetInnerHTML={{ __html: piece.patternData }} />
                </div>
              )}
              {!placed && piece && !placedPieces.get(piece.id)?.isPlaced && (
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                  <div
                    className="w-3/4 h-3/4"
                    dangerouslySetInnerHTML={{ __html: piece.patternData }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <svg
        className="absolute inset-0 pointer-events-none"
        width={gridCols * cellSize}
        height={gridRows * cellSize}
        style={{ zIndex: 10 }}
      >
        {visibleCracks.map((crack) => {
          let points: { x: number; y: number }[] = [];
          try {
            points = JSON.parse(crack.points);
          } catch {
            return null;
          }
          if (points.length < 2) return null;
          return (
            <polyline
              key={crack.id}
              className="crack-line"
              points={points
                .map((p) => `${p.x * cellSize},${p.y * cellSize}`)
                .join(' ')}
              fill="none"
              stroke={crack.severity > 0.7 ? '#e03218' : crack.severity > 0.4 ? '#df9753' : '#a34a21'}
              strokeWidth={crack.severity > 0.7 ? 2.5 : 1.5}
              strokeDasharray={crack.type === 'diagonal' ? '4,3' : undefined}
            />
          );
        })}
      </svg>
    </div>
  );
}
