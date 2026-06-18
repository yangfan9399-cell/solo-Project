import { GameLevelId } from './types';

export const levelInfo: Record<GameLevelId, { name: string; description: string; difficulty: string }> = {
  wu: {
    name: '琉璃温室双人机关局 · 戊局',
    description: '教学关卡。熟悉双人协作、琉璃晶收集、开关与门的基础机制。',
    difficulty: '入门'
  },
  ding: {
    name: '琉璃温室双人机关局 · 丁局',
    description: '资源短缺。量测槽吃紧，每一步都需精打细算，考验资源管理。',
    difficulty: '进阶'
  },
  wei: {
    name: '琉璃温室双人机关局 · 未局',
    description: '隐藏条件。失败因子累积，寻找隐秘晶与隐开关触发隐藏结局。',
    difficulty: '挑战'
  }
};
