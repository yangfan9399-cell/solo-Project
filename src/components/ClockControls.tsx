import { component$, $ } from '@builder.io/qwik';
import type { WaterClockConfig } from '~/game/types';

interface ClockControlsProps {
  config: WaterClockConfig;
  onHoleChange$: (value: number) => void;
  onScaleChange$: (value: number) => void;
  onWaterLevelChange$?: (value: number) => void;
  disabled?: boolean;
}

export const ClockControls = component$<ClockControlsProps>((props) => {
  const { config, onHoleChange$, onScaleChange$, disabled } = props;

  const handleHoleInput = $((e: Event) => {
    const target = e.target as HTMLInputElement;
    onHoleChange$(parseFloat(target.value));
  });

  const handleScaleInput = $((e: Event) => {
    const target = e.target as HTMLInputElement;
    onScaleChange$(parseInt(target.value, 10));
  });

  return (
    <div class="panel">
      <h3 class="panel-title">水钟调校</h3>

      <div class="input-group">
        <label>
          漏孔直径: <span class="text-accent">{config.holeDiameter.toFixed(2)} cm</span>
        </label>
        <input
          type="range"
          min="0.2"
          max="2.0"
          step="0.05"
          value={config.holeDiameter}
          onInput$={handleHoleInput}
          disabled={disabled}
          class="slider"
        />
        <div class="row" style={{ gap: '0.5rem' }}>
          <button
            class="btn btn-secondary"
            onClick$={() => onHoleChange$(Math.max(0.2, config.holeDiameter - 0.05))}
            disabled={disabled}
          >
            -0.05
          </button>
          <button
            class="btn btn-secondary"
            onClick$={() => onHoleChange$(Math.min(2.0, config.holeDiameter + 0.05))}
            disabled={disabled}
          >
            +0.05
          </button>
        </div>
        <small class="text-dim">孔越大流速越快，计时越短</small>
      </div>

      <div class="input-group">
        <label>
          浮标刻度: <span class="text-accent">{config.scaleMarks} 格</span>
        </label>
        <input
          type="range"
          min="50"
          max="200"
          step="5"
          value={config.scaleMarks}
          onInput$={handleScaleInput}
          disabled={disabled}
          class="slider"
        />
        <div class="row" style={{ gap: '0.5rem' }}>
          <button
            class="btn btn-secondary"
            onClick$={() => onScaleChange$(Math.max(50, config.scaleMarks - 5))}
            disabled={disabled}
          >
            -5
          </button>
          <button
            class="btn btn-secondary"
            onClick$={() => onScaleChange$(Math.min(200, config.scaleMarks + 5))}
            disabled={disabled}
          >
            +5
          </button>
        </div>
        <small class="text-dim">刻度越多，每格代表时间越短</small>
      </div>
    </div>
  );
});
