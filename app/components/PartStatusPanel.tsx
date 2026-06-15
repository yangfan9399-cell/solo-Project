import type { PartName } from '~/types/game';
import { PART_NAME_CN, classWear } from '~/utils/format';

interface Props {
  partWears: Record<PartName, number>;
  onRepair?: (part: PartName) => void;
  canRepair?: boolean;
  alreadyRepaired?: Set<PartName>;
}

const PART_ORDER: PartName[] = ['pendulum', 'gearA', 'gearB', 'gearC', 'hammer', 'spring'];

export default function PartStatusPanel({ partWears, onRepair, canRepair, alreadyRepaired }: Props) {
  return (
    <div className="part-list">
      {PART_ORDER.map(part => {
        const wear = partWears[part] ?? 0;
        const cls = classWear(wear);
        const warn = wear > 70;
        const repaired = alreadyRepaired?.has(part);
        return (
          <div key={part} className="part-item" style={warn ? { borderColor: '#c84b4b' } : undefined}>
            <div className="part-item-header">
              <span className="part-name">{PART_NAME_CN[part] ?? part}</span>
              <span
                className={`part-wear-value ${cls === 'low' ? 'good' : cls === 'mid' ? 'warn' : 'bad'}`}
              >
                {wear.toFixed(1)}%
              </span>
            </div>
            <div className="wear-bar">
              <div
                className={`wear-bar-fill ${cls}`}
                style={{ width: `${Math.min(100, wear)}%` }}
              />
            </div>
            {canRepair && onRepair && (
              <div className="btn-row" style={{ marginTop: 8 }}>
                <button
                  className="btn btn-sm btn-primary"
                  disabled={repaired || wear < 30}
                  onClick={() => onRepair(part)}
                  title={repaired ? '今天已修复' : wear < 30 ? '无需修复(磨损<30%)' : '更换/修复该零件'}
                >
                  {repaired ? '已修复' : warn ? '紧急修复' : '维护'}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
