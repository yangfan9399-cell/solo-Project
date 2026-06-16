'use client';

import { useMemo } from 'react';
import type { PuzzlePiece, PlacedPieceState } from '@/lib/types';

interface PieceTrayProps {
  pieces: PuzzlePiece[];
  placedPieces: Map<string, PlacedPieceState>;
  selectedPieceId: string | null;
  onSelectPiece: (pieceId: string | null) => void;
  currentLayer: number;
}

export default function PieceTray({
  pieces,
  placedPieces,
  selectedPieceId,
  onSelectPiece,
  currentLayer,
}: PieceTrayProps) {
  const unplacedPieces = useMemo(
    () => pieces.filter((p) => {
      const state = placedPieces.get(p.id);
      return !state?.isPlaced && p.layer === currentLayer;
    }),
    [pieces, placedPieces, currentLayer]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, PuzzlePiece[]>();
    for (const piece of unplacedPieces) {
      const list = map.get(piece.groupId) ?? [];
      list.push(piece);
      map.set(piece.groupId, list);
    }
    return map;
  }, [unplacedPieces]);

  const placedCount = useMemo(
    () => pieces.filter((p) => placedPieces.get(p.id)?.isPlaced).length,
    [pieces, placedPieces]
  );

  const handleDragStart = (e: React.DragEvent, pieceId: string) => {
    e.dataTransfer.setData('text/plain', pieceId);
    e.dataTransfer.effectAllowed = 'move';
    onSelectPiece(pieceId);
  };

  return (
    <div className="border-2 border-ancient-300 rounded-lg bg-ancient-100/60 scroll-shadow p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-ancient-800 tracking-wider">碎片托盘</span>
        <span className="text-xs font-semibold text-ancient-600">
          已放置 {placedCount}/{pieces.length}
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {Array.from(grouped.entries()).map(([groupId, groupPieces]) => (
          <div key={groupId} className="flex-shrink-0">
            <div className="text-xs text-ancient-500 font-semibold mb-1 tracking-wide">
              {groupId}
            </div>
            <div className="flex gap-1.5">
              {groupPieces.map((piece) => {
                const isSelected = selectedPieceId === piece.id;
                return (
                  <div
                    key={piece.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, piece.id)}
                    onClick={() => onSelectPiece(isSelected ? null : piece.id)}
                    className={`puzzle-piece w-14 h-14 rounded-md border-2 flex items-center justify-center cursor-grab transition-all duration-150 ${
                      isSelected
                        ? 'border-jade-500 ring-2 ring-jade-400/50 scale-105'
                        : 'border-ancient-300 hover:border-ancient-400 hover:scale-105'
                    } bg-ancient-50`}
                  >
                    <div
                      className="w-10 h-10"
                      style={{ transform: `rotate(${piece.baseRotation}deg)` }}
                      dangerouslySetInnerHTML={{ __html: piece.patternData }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {unplacedPieces.length === 0 && (
          <div className="text-sm text-ancient-400 py-2 w-full text-center">
            当前层碎片已全部放置
          </div>
        )}
      </div>
    </div>
  );
}
