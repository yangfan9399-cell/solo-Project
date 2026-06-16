'use client';

import { useRouter } from 'next/navigation';

interface GameOverOverlayProps {
  isTimeUp: boolean;
  score: number;
  stability: number;
  piecesPlaced: number;
  totalPieces: number;
  sessionId: string;
}

export default function GameOverOverlay({
  isTimeUp,
  score,
  stability,
  piecesPlaced,
  totalPieces,
  sessionId,
}: GameOverOverlayProps) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ancient-950/60 backdrop-blur-sm">
      <div className="bg-ancient-50 border-4 ornate-border scroll-shadow rounded-lg p-8 max-w-md w-full mx-4 text-center">
        <h2 className="text-3xl font-black text-ancient-900 tracking-widest mb-2">
          {isTimeUp ? '时间耗尽' : '修复完成'}
        </h2>
        <div className="flex justify-center gap-2 mb-6">
          <span className="block w-10 h-0.5 bg-ancient-300" />
          <span className="block w-2 h-2 rounded-full border-2 border-ancient-400 bg-ancient-100" />
          <span className="block w-10 h-0.5 bg-ancient-300" />
        </div>

        <div className="space-y-3 mb-8">
          <div className="flex justify-between items-center px-4 py-2 bg-ancient-100/60 rounded border border-ancient-200">
            <span className="text-ancient-600 font-semibold">得分</span>
            <span className="text-xl font-bold text-jade-700">{score}</span>
          </div>
          <div className="flex justify-between items-center px-4 py-2 bg-ancient-100/60 rounded border border-ancient-200">
            <span className="text-ancient-600 font-semibold">稳定度</span>
            <span className="text-xl font-bold text-ancient-800">{Math.round(stability)}%</span>
          </div>
          <div className="flex justify-between items-center px-4 py-2 bg-ancient-100/60 rounded border border-ancient-200">
            <span className="text-ancient-600 font-semibold">碎片放置</span>
            <span className="text-xl font-bold text-ancient-800">
              {piecesPlaced}/{totalPieces}
            </span>
          </div>
        </div>

        <button
          onClick={() => router.push(`/result/${sessionId}`)}
          className="btn-primary text-lg px-8 py-3 tracking-widest"
        >
          查看报告
        </button>
      </div>
    </div>
  );
}
