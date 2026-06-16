'use client';

import { use, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Level, PuzzlePiece, Crack, PlacedPieceState, Operation } from '@/lib/types';
import { calculateStability } from '@/lib/scoring';
import PuzzleBoard from '@/components/PuzzleBoard';
import PieceTray from '@/components/PieceTray';
import GameToolbar from '@/components/GameToolbar';
import GameOverOverlay from '@/components/GameOverOverlay';

interface LevelData extends Level {
  pieces: PuzzlePiece[];
  cracks: Crack[];
}

export default function GamePage({ params }: { params: Promise<{ levelId: string }> }) {
  const { levelId } = use(params);
  const router = useRouter();

  const [levelData, setLevelData] = useState<LevelData | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [placedPieces, setPlacedPieces] = useState<Map<string, PlacedPieceState>>(new Map());
  const [currentLayer, setCurrentLayer] = useState(0);
  const [stability, setStability] = useState(0);
  const [score, setScore] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [undosUsed, setUndosUsed] = useState(0);
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [magnifierActive, setMagnifierActive] = useState(false);
  const [hintPieceId, setHintPieceId] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);

  const operationsRef = useRef<Operation[]>([]);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const playerId = localStorage.getItem('playerId');
    if (!playerId) {
      router.push('/');
      return;
    }

    let sid: string | null = null;

    (async () => {
      try {
        const levelRes = await fetch(`/api/levels/${levelId}`);
        if (!levelRes.ok) throw new Error('关卡加载失败');
        const data: LevelData = await levelRes.json();
        setLevelData(data);

        const sessionRes = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId, levelId: Number(levelId) }),
        });
        if (!sessionRes.ok) throw new Error('创建会话失败');
        const session = await sessionRes.json();
        sid = session.id;
        setSessionId(sid);
      } catch (e) {
        setError(e instanceof Error ? e.message : '加载失败');
      } finally {
        setLoading(false);
      }
    })();
  }, [levelId, router]);

  const updateStability = useCallback(
    (placed: Map<string, PlacedPieceState>) => {
      if (!levelData) return;
      const states = Array.from(placed.values());
      const s = calculateStability(levelData.pieces, states, levelData.cracks);
      setStability(s);
    },
    [levelData]
  );

  const updateSessionProgress = useCallback(
    async (placed: Map<string, PlacedPieceState>, hUsed: number, uUsed: number) => {
      if (!sessionId) return;
      const placedCount = Array.from(placed.values()).filter((s) => s.isPlaced).length;
      try {
        await fetch(`/api/sessions/${sessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            score,
            stability,
            piecesPlaced: placedCount,
            hintsUsed: hUsed,
            undosUsed: uUsed,
          }),
        });
      } catch {}
    },
    [sessionId, score, stability]
  );

  const handlePlacePiece = useCallback(
    async (pieceId: string, row: number, col: number) => {
      if (!sessionId || !levelData) return;

      const piece = levelData.pieces.find((p) => p.id === pieceId);
      if (!piece) return;

      const beforeState: PlacedPieceState = {
        pieceId,
        row: -1,
        col: -1,
        layer: piece.layer,
        rotation: 0,
        groupId: piece.groupId,
        isPlaced: false,
      };
      const afterState: PlacedPieceState = {
        pieceId,
        row,
        col,
        layer: piece.layer,
        rotation: piece.baseRotation,
        groupId: piece.groupId,
        isPlaced: true,
        placedAt: Date.now(),
      };

      try {
        const res = await fetch('/api/operations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            type: 'place',
            pieceId,
            beforeState: JSON.stringify(beforeState),
            afterState: JSON.stringify(afterState),
          }),
        });
        if (res.ok) {
          const op: Operation = await res.json();
          operationsRef.current.push(op);
        }
      } catch {}

      setPlacedPieces((prev) => {
        const next = new Map(prev);
        next.set(pieceId, afterState);
        updateStability(next);
        const h = hintsUsed;
        const u = undosUsed;
        setTimeout(() => updateSessionProgress(next, h, u), 0);
        return next;
      });

      setSelectedPieceId(null);

      const totalPlaced = Array.from(placedPieces.values()).filter((s) => s.isPlaced).length + 1;
      setScore(levelData.baseScore + totalPlaced * 10);
    },
    [sessionId, levelData, hintsUsed, undosUsed, placedPieces, updateStability, updateSessionProgress]
  );

  const handleRemovePiece = useCallback(
    async (pieceId: string) => {
      if (!sessionId) return;

      const currentState = placedPieces.get(pieceId);
      if (!currentState?.isPlaced) return;

      const beforeState = { ...currentState };
      const afterState: PlacedPieceState = {
        pieceId,
        row: -1,
        col: -1,
        layer: currentState.layer,
        rotation: 0,
        groupId: currentState.groupId,
        isPlaced: false,
      };

      try {
        const res = await fetch('/api/operations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            type: 'remove',
            pieceId,
            beforeState: JSON.stringify(beforeState),
            afterState: JSON.stringify(afterState),
          }),
        });
        if (res.ok) {
          const op: Operation = await res.json();
          operationsRef.current.push(op);
        }
      } catch {}

      setPlacedPieces((prev) => {
        const next = new Map(prev);
        next.set(pieceId, afterState);
        updateStability(next);
        return next;
      });
    },
    [sessionId, placedPieces, updateStability]
  );

  const handleRotatePiece = useCallback(
    async (pieceId: string) => {
      if (!sessionId) return;

      const currentState = placedPieces.get(pieceId);
      if (!currentState?.isPlaced) return;

      const beforeState = { ...currentState };
      const afterState: PlacedPieceState = {
        ...currentState,
        rotation: (currentState.rotation + 90) % 360,
      };

      try {
        const res = await fetch('/api/operations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            type: 'rotate',
            pieceId,
            beforeState: JSON.stringify(beforeState),
            afterState: JSON.stringify(afterState),
          }),
        });
        if (res.ok) {
          const op: Operation = await res.json();
          operationsRef.current.push(op);
        }
      } catch {}

      setPlacedPieces((prev) => {
        const next = new Map(prev);
        next.set(pieceId, afterState);
        updateStability(next);
        return next;
      });
    },
    [sessionId, placedPieces, updateStability]
  );

  const handleUndo = useCallback(async () => {
    if (!sessionId || operationsRef.current.length === 0) return;

    try {
      const res = await fetch(`/api/operations?sessionId=${sessionId}`);
      if (!res.ok) return;
      const ops: Operation[] = await res.json();
      if (ops.length === 0) return;

      const lastOp = ops[ops.length - 1];
      let beforeState: PlacedPieceState;
      try {
        beforeState = JSON.parse(lastOp.beforeState);
      } catch {
        return;
      }

      const reverseType =
        lastOp.type === 'place' ? 'remove' : lastOp.type === 'remove' ? 'place' : lastOp.type;

      const afterState: PlacedPieceState =
        reverseType === 'remove'
          ? { ...beforeState, isPlaced: false, row: -1, col: -1 }
          : beforeState;

      await fetch('/api/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          type: reverseType,
          pieceId: lastOp.pieceId,
          beforeState: lastOp.afterState,
          afterState: JSON.stringify(afterState),
        }),
      });

      operationsRef.current = ops.slice(0, -1);

      setPlacedPieces((prev) => {
        const next = new Map(prev);
        next.set(lastOp.pieceId, afterState);
        updateStability(next);
        return next;
      });

      const newUndos = undosUsed + 1;
      setUndosUsed(newUndos);
      updateSessionProgress(placedPieces, hintsUsed, newUndos);
    } catch {}
  }, [sessionId, undosUsed, hintsUsed, placedPieces, updateStability, updateSessionProgress]);

  const handleHint = useCallback(() => {
    if (!levelData) return;

    const unplaced = levelData.pieces.filter((p) => {
      const state = placedPieces.get(p.id);
      return !state?.isPlaced;
    });

    if (unplaced.length === 0) return;

    const target = unplaced[Math.floor(Math.random() * unplaced.length)];
    setHintPieceId(target.id);

    const newHints = hintsUsed + 1;
    setHintsUsed(newHints);

    setTimeout(() => setHintPieceId(null), 2000);

    updateSessionProgress(placedPieces, newHints, undosUsed);
  }, [levelData, placedPieces, hintsUsed, undosUsed, updateSessionProgress]);

  const handleTimerExpire = useCallback(() => {
    setIsTimeUp(true);
    setGameOver(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!sessionId || gameOver) return;
    setGameOver(true);
    setIsTimeUp(false);

    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score,
          stability,
          piecesPlaced: Array.from(placedPieces.values()).filter((s) => s.isPlaced).length,
          hintsUsed,
          undosUsed,
        }),
      });

      await fetch(`/api/sessions/${sessionId}/complete`, { method: 'POST' });
    } catch {}
  }, [sessionId, gameOver, score, stability, placedPieces, hintsUsed, undosUsed]);

  const piecesPlacedCount = Array.from(placedPieces.values()).filter((s) => s.isPlaced).length;

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="text-xl text-ancient-600 tracking-widest">加载中...</div>
      </main>
    );
  }

  if (error || !levelData) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="text-xl text-cinnabar-600">{error ?? '加载失败'}</div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col p-3 gap-3 max-w-7xl mx-auto w-full">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-ancient-900 tracking-wider">{levelData.name}</h1>
          <p className="text-sm text-ancient-600">{levelData.era} · {levelData.location} · {levelData.patternType}</p>
        </div>
        <span
          className={`px-3 py-1 text-xs font-bold rounded-full border-2 ${
            levelData.difficulty === 'easy'
              ? 'bg-jade-100 border-jade-400 text-jade-700'
              : levelData.difficulty === 'medium'
                ? 'bg-ancient-200 border-ancient-400 text-ancient-800'
                : levelData.difficulty === 'hard'
                  ? 'bg-cinnabar-100 border-cinnabar-400 text-cinnabar-700'
                  : 'bg-cinnabar-200 border-cinnabar-600 text-cinnabar-900'
          }`}
        >
          {levelData.difficulty === 'easy'
            ? '简单'
            : levelData.difficulty === 'medium'
              ? '中等'
              : levelData.difficulty === 'hard'
                ? '困难'
                : '大师'}
        </span>
      </header>

      <GameToolbar
        timeLimit={levelData.timeLimit}
        onTimerExpire={handleTimerExpire}
        stability={stability}
        score={score}
        hintsUsed={hintsUsed}
        onHint={handleHint}
        undosUsed={undosUsed}
        onUndo={handleUndo}
        totalLayers={levelData.layers}
        currentLayer={currentLayer}
        onLayerSwitch={setCurrentLayer}
        magnifierActive={magnifierActive}
        onMagnifierToggle={() => setMagnifierActive((v) => !v)}
        onSubmit={handleSubmit}
      />

      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 flex items-start justify-center overflow-auto py-2">
          <PuzzleBoard
            pieces={levelData.pieces}
            cracks={levelData.cracks}
            gridRows={levelData.gridRows}
            gridCols={levelData.gridCols}
            placedPieces={placedPieces}
            currentLayer={currentLayer}
            selectedPieceId={selectedPieceId}
            hintPieceId={hintPieceId}
            onPlacePiece={handlePlacePiece}
            onRemovePiece={handleRemovePiece}
            onRotatePiece={handleRotatePiece}
            onSelectPiece={setSelectedPieceId}
          />
        </div>
      </div>

      <PieceTray
        pieces={levelData.pieces}
        placedPieces={placedPieces}
        selectedPieceId={selectedPieceId}
        onSelectPiece={setSelectedPieceId}
        currentLayer={currentLayer}
      />

      {gameOver && sessionId && (
        <GameOverOverlay
          isTimeUp={isTimeUp}
          score={score}
          stability={stability}
          piecesPlaced={piecesPlacedCount}
          totalPieces={levelData.pieces.length}
          sessionId={sessionId}
        />
      )}
    </main>
  );
}
