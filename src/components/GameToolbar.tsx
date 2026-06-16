'use client';

import GameTimer from './GameTimer';
import StabilityMeter from './StabilityMeter';
import LayerSwitcher from './LayerSwitcher';
import Magnifier from './Magnifier';

interface GameToolbarProps {
  timeLimit: number;
  onTimerExpire: () => void;
  stability: number;
  score: number;
  hintsUsed: number;
  onHint: () => void;
  undosUsed: number;
  onUndo: () => void;
  totalLayers: number;
  currentLayer: number;
  onLayerSwitch: (layer: number) => void;
  magnifierActive: boolean;
  onMagnifierToggle: () => void;
  onSubmit: () => void;
}

export default function GameToolbar({
  timeLimit,
  onTimerExpire,
  stability,
  score,
  hintsUsed,
  onHint,
  undosUsed,
  onUndo,
  totalLayers,
  currentLayer,
  onLayerSwitch,
  magnifierActive,
  onMagnifierToggle,
  onSubmit,
}: GameToolbarProps) {
  return (
    <div className="border-2 border-ancient-300 rounded-lg bg-ancient-100/70 scroll-shadow p-3">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <GameTimer timeLimit={timeLimit} onExpire={onTimerExpire} />
          <div className="w-px h-6 bg-ancient-300" />
          <StabilityMeter value={stability} />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-3 py-1.5 bg-ancient-200/60 rounded border border-ancient-300">
            <span className="text-xs text-ancient-600 font-semibold">得分</span>
            <span className="text-lg font-bold text-jade-700 tabular-nums">{score}</span>
          </div>

          <button
            onClick={onHint}
            className="px-3 py-1.5 text-sm font-semibold rounded border-2 bg-ancient-100 border-ancient-300 text-ancient-700 hover:bg-ancient-200 transition-colors"
            title="提示"
          >
            💡 提示 ({hintsUsed})
          </button>

          <button
            onClick={onUndo}
            className="px-3 py-1.5 text-sm font-semibold rounded border-2 bg-ancient-100 border-ancient-300 text-ancient-700 hover:bg-ancient-200 transition-colors"
            title="撤销"
          >
            ↩ 撤销 ({undosUsed})
          </button>

          <div className="w-px h-6 bg-ancient-300" />

          <Magnifier active={magnifierActive} onToggle={onMagnifierToggle} />

          {totalLayers > 1 && (
            <>
              <div className="w-px h-6 bg-ancient-300" />
              <LayerSwitcher
                totalLayers={totalLayers}
                currentLayer={currentLayer}
                onSwitch={onLayerSwitch}
              />
            </>
          )}
        </div>

        <button
          onClick={onSubmit}
          className="btn-primary px-5 py-2 text-sm tracking-wider"
        >
          提交修复
        </button>
      </div>
    </div>
  );
}
