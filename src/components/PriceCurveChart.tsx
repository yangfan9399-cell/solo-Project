import { component$ } from '@builder.io/qwik';
import type { PricePoint } from '~/types/game';

interface PriceCurveChartProps {
  pricePoints: PricePoint[];
  playerPrice?: number | null;
  marketPrice?: number | null;
  actualValue?: number | null;
}

export const PriceCurveChart = component$<PriceCurveChartProps>(({ 
  pricePoints, 
  playerPrice, 
  marketPrice,
  actualValue 
}) => {
  if (pricePoints.length === 0) return null;
  
  const maxPrice = Math.max(...pricePoints.map(p => p.price)) * 1.1;
  const minPrice = Math.min(...pricePoints.map(p => p.price)) * 0.9;
  const chartHeight = 200;
  const chartWidth = 500;
  const padding = 40;
  
  const xScale = (price: number) => 
    padding + ((price - minPrice) / (maxPrice - minPrice)) * (chartWidth - padding * 2);
  
  const yScale = (demand: number) => 
    chartHeight - padding - demand * (chartHeight - padding * 2);
  
  const pathD = pricePoints
    .map((p, i) => {
      const x = xScale(p.price);
      const y = yScale(p.demand);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
  
  return (
    <div class="bg-white rounded-xl shadow-lg p-6 border-2 border-amber-200">
      <h3 class="text-lg font-bold text-book-brown mb-4">📈 价格需求曲线</h3>
      
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} class="w-full h-auto">
        <defs>
          <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#DAA520" stop-opacity="0.3" />
            <stop offset="100%" stop-color="#DAA520" stop-opacity="0" />
          </linearGradient>
        </defs>
        
        {[0.25, 0.5, 0.75].map(d => (
          <line
            key={`h-${d}`}
            x1={padding}
            y1={yScale(d)}
            x2={chartWidth - padding}
            y2={yScale(d)}
            stroke="#E5E7EB"
            stroke-dasharray="4,4"
          />
        ))}
        
        {[0, 0.25, 0.5, 0.75, 1].map(d => (
          <text
            key={`hy-${d}`}
            x={padding - 8}
            y={yScale(d) + 4}
            text-anchor="end"
            class="text-xs fill-gray-500"
          >
            {(d * 100).toFixed(0)}%
          </text>
        ))}
        
        <path
          d={`${pathD} L ${xScale(maxPrice)} ${chartHeight - padding} L ${xScale(minPrice)} ${chartHeight - padding} Z`}
          fill="url(#curveGradient)"
        />
        
        <path
          d={pathD}
          stroke="#DAA520"
          stroke-width="3"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        
        {pricePoints.map((p, i) => (
          <g key={`point-${i}`}>
            <circle
              cx={xScale(p.price)}
              cy={yScale(p.demand)}
              r="5"
              fill="#8B4513"
              stroke="#FFF"
              stroke-width="2"
            />
            <title>价格: ¥{p.price.toFixed(2)}, 需求: {(p.demand * 100).toFixed(0)}%</title>
          </g>
        ))}
        
        {marketPrice && (
          <g>
            <line
              x1={xScale(marketPrice)}
              y1={padding}
              x2={xScale(marketPrice)}
              y2={chartHeight - padding}
              stroke="#3B82F6"
              stroke-width="2"
              stroke-dasharray="6,3"
            />
            <text
              x={xScale(marketPrice)}
              y={padding - 8}
              text-anchor="middle"
              class="text-xs fill-blue-600 font-bold"
            >
              市场建议价: ¥{marketPrice.toFixed(0)}
            </text>
          </g>
        )}
        
        {playerPrice && (
          <g>
            <line
              x1={xScale(playerPrice)}
              y1={padding}
              x2={xScale(playerPrice)}
              y2={chartHeight - padding}
              stroke="#EF4444"
              stroke-width="2"
              stroke-dasharray="6,3"
            />
            <text
              x={xScale(playerPrice)}
              y={chartHeight - padding + 20}
              text-anchor="middle"
              class="text-xs fill-red-600 font-bold"
            >
              你的定价: ¥{playerPrice.toFixed(0)}
            </text>
          </g>
        )}
        
        {actualValue && (
          <g>
            <line
              x1={xScale(actualValue)}
              y1={padding}
              x2={xScale(actualValue)}
              y2={chartHeight - padding}
              stroke="#10B981"
              stroke-width="2"
              stroke-dasharray="6,3"
            />
            <text
              x={xScale(actualValue)}
              y={chartHeight - padding + 40}
              text-anchor="middle"
              class="text-xs fill-green-600 font-bold"
            >
              实际价值: ¥{actualValue.toFixed(0)}
            </text>
          </g>
        )}
        
        <text
          x={chartWidth / 2}
          y={chartHeight - 5}
          text-anchor="middle"
          class="text-xs fill-gray-500"
        >
          价格 (¥)
        </text>
        
        <text
          x={15}
          y={chartHeight / 2}
          text-anchor="middle"
          transform={`rotate(-90, 15, ${chartHeight / 2})`}
          class="text-xs fill-gray-500"
        >
          需求概率
        </text>
      </svg>
      
      <div class="mt-4 flex flex-wrap gap-4 justify-center text-sm">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>市场建议价</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-red-500"></div>
          <span>你的定价</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-green-500"></div>
          <span>实际价值</span>
        </div>
      </div>
    </div>
  );
});
