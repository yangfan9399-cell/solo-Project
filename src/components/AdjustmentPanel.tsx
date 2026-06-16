import type { ChangeEvent, CSSProperties } from 'react';
import type { BoardAdjustments } from '@/types/game';

interface AdjustmentPanelProps {
  adjustments: BoardAdjustments;
  disabled: boolean;
  onChange: (field: keyof BoardAdjustments, value: number) => void;
  onReset: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const SLIDER_CONFIG: {
  field: keyof BoardAdjustments;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
}[] = [
  { field: 'woodThickness', label: '木材厚度', min: 1.5, max: 5.0, step: 0.1, unit: 'mm' },
  { field: 'beamPosition', label: '梁位', min: 10, max: 90, step: 1, unit: '%' },
  { field: 'lacquerLayer', label: '漆层', min: 0, max: 6, step: 1, unit: '层' },
  { field: 'soundHoleSize', label: '音孔尺寸', min: 50, max: 120, step: 1, unit: 'mm' },
  { field: 'braceAngle', label: '支撑角', min: 0, max: 45, step: 1, unit: '°' },
];

const styles: Record<string, CSSProperties> = {
  container: {
    backgroundColor: '#1a1a2e',
    padding: '20px',
    borderRadius: '12px',
    color: '#e0e0e0',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  sliderGroup: {
    marginBottom: '16px',
  },
  sliderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#c0c0c0',
  },
  value: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#f5a623',
    minWidth: '60px',
    textAlign: 'right' as const,
  },
  slider: {
    width: '100%',
    height: '6px',
    appearance: 'none' as never,
    WebkitAppearance: 'none',
    background: '#2a2a4a',
    borderRadius: '3px',
    outline: 'none',
    cursor: 'pointer',
  },
  buttonRow: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px',
  },
  button: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #f5a623',
    backgroundColor: 'transparent',
    color: '#f5a623',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s, color 0.2s',
  },
  buttonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
    borderColor: '#555',
    color: '#555',
  },
  buttonHover: {
    backgroundColor: '#f5a623',
    color: '#1a1a2e',
  },
  resetButton: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #e74c3c',
    backgroundColor: 'transparent',
    color: '#e74c3c',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s, color 0.2s',
  },
};

function AdjustmentPanel({
  adjustments,
  disabled,
  onChange,
  onReset,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: AdjustmentPanelProps) {
  return (
    <div style={styles.container}>
      {SLIDER_CONFIG.map(({ field, label, min, max, step, unit }) => (
        <div key={field} style={styles.sliderGroup}>
          <div style={styles.sliderHeader}>
            <span style={styles.label}>{label}</span>
            <span style={styles.value}>
              {adjustments[field]}{unit}
            </span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={adjustments[field]}
            disabled={disabled}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(field, parseFloat(e.target.value))}
            style={{
              ...styles.slider,
              ...(disabled ? { opacity: 0.4, cursor: 'not-allowed' } : {}),
            }}
          />
        </div>
      ))}
      <div style={styles.buttonRow}>
        <button
          onClick={onUndo}
          disabled={disabled || !canUndo}
          style={{
            ...styles.button,
            ...((disabled || !canUndo) ? styles.buttonDisabled : {}),
          }}
        >
          撤销
        </button>
        <button
          onClick={onRedo}
          disabled={disabled || !canRedo}
          style={{
            ...styles.button,
            ...((disabled || !canRedo) ? styles.buttonDisabled : {}),
          }}
        >
          重做
        </button>
        <button
          onClick={onReset}
          disabled={disabled}
          style={{
            ...styles.resetButton,
            ...(disabled ? styles.buttonDisabled : {}),
          }}
        >
          重置
        </button>
      </div>
    </div>
  );
}

export default AdjustmentPanel;
