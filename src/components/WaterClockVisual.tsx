import { component$ } from '@builder.io/qwik';
import type { WaterClockConfig, EnvironmentState } from '~/game/types';
import { calculateWaterFlowRate } from '~/game/engine';

interface WaterClockVisualProps {
  config: WaterClockConfig;
  environment: EnvironmentState;
  animating?: boolean;
  progress?: number;
}

export const WaterClockVisual = component$<WaterClockVisualProps>((props) => {
  const { config, environment, animating, progress = 0 } = props;
  const flowRate = calculateWaterFlowRate(config.holeDiameter, environment.temperature);
  const waterHeightPercent = Math.max(0, 100 - progress * 100);
  const drops = Math.min(20, Math.floor(config.holeDiameter * 10));

  return (
    <div class="water-clock-container">
      <svg viewBox="0 0 200 300" width="100%" style={{ maxWidth: '300px' }}>
        <defs>
          <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#8ab8d4" />
            <stop offset="100%" stop-color="#3d6a8a" />
          </linearGradient>
          <linearGradient id="potGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#5a4535" />
            <stop offset="50%" stop-color="#7a5e4a" />
            <stop offset="100%" stop-color="#5a4535" />
          </linearGradient>
          <clipPath id="potClip">
            <rect x="35" y="30" width="130" height="200" rx="8" />
          </clipPath>
        </defs>

        <rect x="30" y="25" width="140" height="210" rx="10" fill="url(#potGradient)" stroke="#3d2e24" stroke-width="3" />
        <rect x="35" y="30" width="130" height="200" rx="8" fill="#1a2a3a" opacity="0.5" />

        <g clip-path="url(#potClip)">
          <rect
            x="35"
            y={30 + 200 * (1 - waterHeightPercent / 100)}
            width="130"
            height={200 * (waterHeightPercent / 100)}
            fill="url(#waterGradient)"
          >
            {animating && (
              <animate
                attributeName="y"
                values={`${30 + 200 * (1 - waterHeightPercent / 100)};${230}`}
                dur="3s"
                fill="freeze"
              />
            )}
          </rect>
          {animating && (
            <g>
              {Array.from({ length: 5 }).map((_, i) => (
                <circle
                  key={i}
                  cx={50 + i * 25}
                  cy={30 + 200 * (1 - waterHeightPercent / 100) - 5}
                  r="3"
                  fill="#a8d0e8"
                  opacity="0.6"
                >
                  <animate
                    attributeName="cy"
                    values={`${30 + 200 * (1 - waterHeightPercent / 100) - 5};${30 + 200 * (1 - waterHeightPercent / 100) + 20}`}
                    dur={`${1 + i * 0.2}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.6;0"
                    dur={`${1 + i * 0.2}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              ))}
            </g>
          )}
        </g>

        {Array.from({ length: Math.round(config.scaleMarks / 10) }).map((_, i) => {
          const y = 40 + i * (180 / Math.max(1, Math.round(config.scaleMarks / 10) - 1));
          const isMajor = i % 2 === 0;
          return (
            <g key={i}>
              <line
                x1="165"
                x2={isMajor ? "175" : "172"}
                y1={y}
                y2={y}
                stroke="#d4a574"
                stroke-width={isMajor ? "2" : "1"}
              />
              {isMajor && (
                <text x="178" y={y + 4} fill="#a89880" font-size="9" font-family="monospace">
                  {Math.round(100 - (i * 100 / Math.max(1, Math.round(config.scaleMarks / 10) - 1)))}
                </text>
              )}
            </g>
          );
        })}

        <circle
          cx="100"
          cy="245"
          r={config.holeDiameter * 3}
          fill="#0a0a0a"
          stroke="#3d2e24"
          stroke-width="2"
        />

        {animating && (
          <g>
            {Array.from({ length: drops }).map((_, i) => (
              <circle
                key={i}
                cx={95 + (i % 5) * 2}
                cy="250"
                r="2"
                fill="#6ba3c4"
              >
                <animate
                  attributeName="cy"
                  values="250;290"
                  dur={`${0.5 + (i % 3) * 0.2}s`}
                  begin={`${i * 0.1}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="1;0"
                  dur={`${0.5 + (i % 3) * 0.2}s`}
                  begin={`${i * 0.1}s`}
                  repeatCount="indefinite"
                />
              </circle>
            ))}
          </g>
        )}

        <ellipse cx="100" cy="295" rx="40" ry="4" fill="#3d6a8a" opacity={animating ? "0.6" : "0.2"} />
      </svg>

      <div class="water-clock-info">
        <div class="stat">
          <span class="stat-label">漏孔直径</span>
          <span class="stat-value text-accent">{config.holeDiameter.toFixed(2)} cm</span>
        </div>
        <div class="stat">
          <span class="stat-label">浮标刻度</span>
          <span class="stat-value text-accent">{config.scaleMarks} 格</span>
        </div>
        <div class="stat">
          <span class="stat-label">当前水温</span>
          <span class="stat-value">{environment.temperature.toFixed(1)}°C</span>
        </div>
        <div class="stat">
          <span class="stat-label">理论流速</span>
          <span class="stat-value text-dim">{flowRate.toFixed(1)} ml/s</span>
        </div>
      </div>
    </div>
  );
});
