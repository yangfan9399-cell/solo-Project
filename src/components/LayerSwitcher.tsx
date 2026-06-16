'use client';

interface LayerSwitcherProps {
  totalLayers: number;
  currentLayer: number;
  onSwitch: (layer: number) => void;
}

const LAYER_NAMES = ['底层', '中层', '顶层', '第四层', '第五层'];

export default function LayerSwitcher({ totalLayers, currentLayer, onSwitch }: LayerSwitcherProps) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: totalLayers }, (_, i) => {
        const isActive = i === currentLayer;
        return (
          <button
            key={i}
            onClick={() => onSwitch(i)}
            className={`px-3 py-1 text-sm font-semibold rounded border-2 transition-all duration-200 ${
              isActive
                ? 'bg-ancient-800 border-ancient-900 text-ancient-50'
                : 'bg-ancient-100 border-ancient-300 text-ancient-700 hover:bg-ancient-200'
            }`}
          >
            {LAYER_NAMES[i] ?? `第${i + 1}层`}
          </button>
        );
      })}
    </div>
  );
}
