import { Mountain, Layers, Microscope, Droplets } from 'lucide-react';
import type { ThresholdGroup, ThresholdDimension } from '@/types';
import { useStore } from '@/store/useStore';

const dimensions: {
  key: keyof ThresholdGroup;
  label: string;
  unit: string;
  icon: React.ElementType;
  min: number;
  max: number;
}[] = [
  { key: 'altitude', label: '采集海拔', unit: 'm', icon: Mountain, min: 0, max: 6000 },
  { key: 'substrate', label: '附着基质', unit: '编码', icon: Layers, min: 0, max: 100 },
  { key: 'sporeDensity', label: '孢子密度', unit: '个/mm²', icon: Microscope, min: 0, max: 500 },
  { key: 'humidityExposure', label: '湿度暴露', unit: '%', icon: Droplets, min: 0, max: 100 },
];

function DimensionSlider({
  label,
  value,
  onChange,
  min,
  max,
  color,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  color: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color }}>
          {label}
        </span>
        <span
          className="text-sm font-semibold tabular-nums px-2 py-0.5 rounded"
          style={{ background: `${color}20`, color }}
        >
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

export default function ThresholdCard({
  dimension,
  data,
  publishedData,
}: {
  dimension: (typeof dimensions)[number];
  data: ThresholdDimension;
  publishedData: ThresholdDimension;
}) {
  const updateDraftRule = useStore((s) => s.updateDraftRule);
  const currentDraftRule = useStore((s) => s.currentDraftRule);

  const isPassMaxChanged = data.passMax !== publishedData.passMax;
  const isWarnMaxChanged = data.warnMax !== publishedData.warnMax;

  const handleChange = (field: 'passMax' | 'warnMax', value: number) => {
    if (!currentDraftRule) return;
    const newThresholds = {
      ...currentDraftRule.thresholds,
      [dimension.key]: { ...data, [field]: value },
    };
    updateDraftRule(newThresholds);
  };

  const Icon = dimension.icon;

  return (
    <div
      className="rounded-xl p-5 border transition-default"
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--accent-green)20' }}
        >
          <Icon className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
        </div>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {dimension.label}
          </h3>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {dimension.unit}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <DimensionSlider
          label="通过上限 (passMax)"
          value={data.passMax}
          onChange={(v) => handleChange('passMax', v)}
          min={dimension.min}
          max={dimension.max}
          color={isPassMaxChanged ? 'var(--accent-amber)' : 'var(--accent-green)'}
        />
        <DimensionSlider
          label="警告上限 (warnMax)"
          value={data.warnMax}
          onChange={(v) => handleChange('warnMax', v)}
          min={dimension.min}
          max={dimension.max}
          color={isWarnMaxChanged ? 'var(--accent-amber)' : 'var(--accent-red)'}
        />
      </div>

      {(isPassMaxChanged || isWarnMaxChanged) && (
        <div
          className="mt-3 pt-3 border-t text-xs space-y-1"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          <p>
            已发布值: passMax={publishedData.passMax}, warnMax={publishedData.warnMax}
          </p>
        </div>
      )}
    </div>
  );
}
