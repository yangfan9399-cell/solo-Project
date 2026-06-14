import type { SeedType, TapeDefect } from './types';

export interface TapeSeedConfig {
  index: number;
  label: string;
  defects: TapeDefect[];
  seed: number;
}

export interface SessionSeed {
  id: string;
  label: string;
  description: string;
  seedType: SeedType;
  tapes: TapeSeedConfig[];
  hint: string;
  expectedActions: string[];
}

export const SEED_SESSIONS: SessionSeed[] = [
  {
    id: 'seed-normal',
    label: '样本批次 #1985-A',
    description: '1985年新闻采访录音带，轻微霉斑和一处断裂，正常修复即可完成',
    seedType: 'normal_splice',
    tapes: [
      { index: 0, label: '采访带 A面-01', defects: ['mold', 'breakage'], seed: 7 },
      { index: 1, label: '采访带 A面-02', defects: ['breakage'], seed: 12 },
    ],
    hint: '提示：波形可见断点位于位置50-90之间，在准确位置点击拼接即可',
    expectedActions: ['register_tape', 'select_cleaning', 'splice_break', 'complete_repair'],
  },
  {
    id: 'seed-abnormal',
    label: '样本批次 #1992-C',
    description: '1992年音乐母带，转速漂移严重且底噪大，过度调节将触发异常',
    seedType: 'abnormal_settings',
    tapes: [
      { index: 0, label: '母带 第一乐章', defects: ['speed_drift', 'noise', 'mold'], seed: 5 },
      { index: 1, label: '母带 第二乐章', defects: ['speed_drift', 'noise'], seed: 9 },
    ],
    hint: '警告：降噪强度超过0.7将损失人声细节！速度偏离1.0超过0.15将失真！',
    expectedActions: ['register_tape', 'select_cleaning', 'adjust_speed', 'apply_noise_reduction', 'complete_repair'],
  },
  {
    id: 'seed-rollback',
    label: '样本批次 #1978-D',
    description: '1978年口述历史磁带，多处断裂和转速漂移，每一步操作都记录并可回滚重算',
    seedType: 'rollback_required',
    tapes: [
      { index: 0, label: '口述带 卷一', defects: ['breakage', 'speed_drift', 'noise', 'mold'], seed: 3 },
    ],
    hint: '系统记录每一步操作，可随时查看历史并回滚到任意状态，然后重算结果',
    expectedActions: ['register_tape', 'select_cleaning', 'splice_break', 'adjust_speed', 'apply_noise_reduction', 'rollback', 'recalculate', 'complete_repair'],
  },
];

export function getSeedById(id: string): SessionSeed | undefined {
  return SEED_SESSIONS.find((s) => s.id === id);
}

export function getAllSeeds(): SessionSeed[] {
  return SEED_SESSIONS;
}
