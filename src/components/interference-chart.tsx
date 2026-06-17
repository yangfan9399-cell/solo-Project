import { component$ } from '@builder.io/qwik';

interface InterferenceChartProps {
  birefringence?: number;
  thickness?: number;
  color?: string;
  order?: number;
  showMarker?: boolean;
  interferenceColors?: any[];
  sectionThickness?: number;
}

export const InterferenceChart = component$<InterferenceChartProps>(({
  birefringence,
  thickness = 30,
  color,
  order,
  showMarker = true,
  interferenceColors = [],
  sectionThickness,
}) => {
  const effectiveBirefringence = birefringence ?? (interferenceColors.length > 0 ? interferenceColors[0].estimatedBirefringence : undefined);
  const effectiveThickness = sectionThickness ?? thickness;
  const orders = [
    { name: '一级', start: 0, end: 550, colors: ['#000000', '#808080', '#ffffff', '#ffe4c4', '#ffd700', '#ffa500', '#ff6347', '#ff0000'] },
    { name: '二级', start: 550, end: 1100, colors: ['#8b008b', '#4b0082', '#0000cd', '#00bfff', '#00ff7f', '#9acd32', '#ffff00', '#ffa500'] },
    { name: '三级', start: 1100, end: 1650, colors: ['#ff4500', '#c71585', '#9400d3', '#4169e1', '#00ced1', '#20b2aa', '#3cb371', '#90ee90'] },
    { name: '四级', start: 1650, end: 2200, colors: ['#f0e68c', '#eee8aa', '#ffe4b5', '#ffdab9', '#ffc0cb', '#ffb6c1', '#db7093', '#c8a2c8'] },
    { name: '五级以上', start: 2200, end: 2800, colors: ['#dcdcdc', '#f5f5f5', '#ffffff', '#f5f5f5', '#dcdcdc', '#c0c0c0', '#a9a9a9', '#ffffff'] },
  ];

  const pathDifference = effectiveBirefringence ? effectiveBirefringence * effectiveThickness * 1000 : 0;
  const markerPosition = Math.min(Math.max(pathDifference / 2800 * 100, 0), 100);

  return (
    <div class="space-y-2">
      <div class="relative h-8 rounded overflow-hidden">
        <div class="absolute inset-0 interference-color-strip"></div>
        {showMarker && effectiveBirefringence && (
          <div
            class="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg shadow-white/50 z-10 transition-all duration-300"
            style={{ left: `${markerPosition}%` }}
          >
            <div class="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white"></div>
            <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-white font-mono whitespace-nowrap">
              {pathDifference.toFixed(0)} nm
            </div>
          </div>
        )}
      </div>
      
      <div class="flex justify-between text-xs text-mineral-400 font-mono">
        {orders.map((o, i) => (
          <div key={i} class="text-center" style={{ width: `${(o.end - o.start) / 2800 * 100}%` }}>
            {o.name}
          </div>
        ))}
      </div>
      
      <div class="flex justify-between text-[10px] text-mineral-500 font-mono">
        <span>0</span>
        <span>550</span>
        <span>1100</span>
        <span>1650</span>
        <span>2200</span>
        <span>2800 nm</span>
      </div>

      {color && order && (
        <div class="flex items-center gap-2 mt-3">
          <div 
            class="w-6 h-6 rounded border border-mineral-500"
            style={{ backgroundColor: color }}
          ></div>
          <span class="text-sm text-mineral-200">{order}级 {color}</span>
          {effectiveBirefringence && (
            <span class="text-sm text-mineral-400 font-mono">δ = {effectiveBirefringence.toFixed(3)}</span>
          )}
        </div>
      )}
    </div>
  );
});

interface MichelLevyChartProps {
  height?: number;
  highlightBirefringence?: number;
  highlightThickness?: number;
  interferenceColors?: any[];
}

export const MichelLevyChart = component$<MichelLevyChartProps>(({
  height = 200,
  highlightBirefringence,
  highlightThickness,
  interferenceColors = [],
}) => {
  const thicknessMarkers = [10, 20, 30, 40, 50, 60];
  const birefringenceMarkers = [0.005, 0.01, 0.02, 0.04, 0.08, 0.16, 0.32];

  return (
    <div class="card p-4">
      <h4 class="text-sm font-semibold text-mineral-200 mb-3">米歇尔-列维干涉色图</h4>
      <div class={`relative bg-mineral-800 rounded-lg overflow-hidden`} style={{ height: `${height}px` }}>
        <div class="absolute inset-0 interference-color-strip opacity-80"></div>
        
        <div class="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-mineral-900 to-transparent flex flex-col justify-between py-2">
          {thicknessMarkers.map((t, i) => (
            <div key={i} class="text-[10px] text-mineral-300 font-mono pl-2">
              {t} μm
            </div>
          ))}
        </div>
        
        <div class="absolute bottom-0 left-16 right-0 h-8 bg-gradient-to-t from-mineral-900 to-transparent flex justify-around items-end pb-1">
          {birefringenceMarkers.map((b, i) => (
            <div key={i} class="text-[10px] text-mineral-300 font-mono">
              {b.toFixed(3)}
            </div>
          ))}
        </div>

        <div class="absolute top-2 right-2 text-[10px] text-mineral-300">
          <div>光程差 R = d × δ</div>
          <div>d: 厚度, δ: 双折射率</div>
        </div>
      </div>
    </div>
  );
});
