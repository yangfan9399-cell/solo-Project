import type { Species, PoolLocation, TidePhase } from "./types";

export const SPECIES: Species[] = [
  {
    id: "crab-red",
    type: "crab",
    name: "红螯相手蟹",
    emoji: "🦀",
    description: "常见于低潮带的岩缝中，胆子较大，喜欢在退潮后觅食。",
    preferredTide: ["low", "falling"],
    minTideLevel: 0.1,
    maxTideLevel: 0.45,
    rarity: "common",
  },
  {
    id: "crab-hermit",
    type: "crab",
    name: "寄居蟹",
    emoji: "🐚",
    description: "背着螺壳四处游荡，在中低潮位的水洼中最为活跃。",
    preferredTide: ["low", "rising"],
    minTideLevel: 0.15,
    maxTideLevel: 0.55,
    rarity: "common",
  },
  {
    id: "crab-sally",
    type: "crab",
    name: "莎莉轻脚蟹",
    emoji: "🦂",
    description: "非常敏捷的稀有蟹类，只有在大潮低潮时才会现身。",
    preferredTide: ["low"],
    minTideLevel: 0.05,
    maxTideLevel: 0.3,
    rarity: "rare",
  },
  {
    id: "anemone-green",
    type: "anemone",
    name: "绿海葵",
    emoji: "🌿",
    description: "附着在岩石上，潮位没过半时触手伸展捕食。",
    preferredTide: ["rising", "high", "falling"],
    minTideLevel: 0.3,
    maxTideLevel: 0.9,
    rarity: "common",
  },
  {
    id: "anemone-pink",
    type: "anemone",
    name: "粉红海葵",
    emoji: "🌸",
    description: "美丽的海葵，只在高潮前后短暂盛开。",
    preferredTide: ["high"],
    minTideLevel: 0.7,
    maxTideLevel: 0.95,
    rarity: "uncommon",
  },
  {
    id: "anemone-blue",
    type: "anemone",
    name: "蓝环海葵",
    emoji: "💎",
    description: "极其罕见的深海葵，需要在满潮且水洼平静时出现。",
    preferredTide: ["high"],
    minTideLevel: 0.85,
    maxTideLevel: 1.0,
    rarity: "rare",
  },
  {
    id: "fish-tidepool",
    type: "fish",
    name: "潮池鳚",
    emoji: "🐟",
    description: "小型鳚类，退潮后留在水洼中，能短暂离水呼吸。",
    preferredTide: ["low", "falling"],
    minTideLevel: 0.1,
    maxTideLevel: 0.5,
    rarity: "common",
  },
  {
    id: "fish-clown",
    type: "fish",
    name: "小丑雀鲷",
    emoji: "🐠",
    description: "色彩艳丽的小型鱼类，潮位较高时游入浅池。",
    preferredTide: ["rising", "high"],
    minTideLevel: 0.5,
    maxTideLevel: 0.95,
    rarity: "uncommon",
  },
  {
    id: "fish-seahorse",
    type: "fish",
    name: "迷你海马",
    emoji: "🦑",
    description: "传说中的稀有生物，仅在特定潮汐组合下出现。",
    preferredTide: ["rising", "falling"],
    minTideLevel: 0.4,
    maxTideLevel: 0.7,
    rarity: "rare",
  },
];

export const POOL_LOCATIONS: PoolLocation[] = [
  {
    id: "pool-north",
    name: "北岩潮池",
    emoji: "🏔️",
    description: "背风的岩池，生物种类丰富，但岩石湿滑。",
    speciesIds: ["crab-red", "anemone-green", "fish-tidepool", "crab-hermit"],
    ecoSensitivity: 2,
  },
  {
    id: "pool-south",
    name: "南沙水洼",
    emoji: "🏖️",
    description: "沙质与岩质混合的水洼，常有寄居蟹出没。",
    speciesIds: ["crab-hermit", "fish-clown", "anemone-pink", "crab-red"],
    ecoSensitivity: 3,
  },
  {
    id: "pool-east",
    name: "东礁深渊",
    emoji: "🪨",
    description: "较深的岩池，高潮时才有机会看到稀客。",
    speciesIds: ["anemone-blue", "fish-seahorse", "anemone-pink", "fish-clown"],
    ecoSensitivity: 4,
  },
  {
    id: "pool-west",
    name: "西礁秘境",
    emoji: "🌊",
    description: "隐秘的礁石区，莎莉轻脚蟹的栖息地。",
    speciesIds: ["crab-sally", "fish-seahorse", "anemone-green", "crab-red"],
    ecoSensitivity: 5,
  },
];

export const TOTAL_STEPS = 8;

export function getTideLevelAtStep(step: number, total: number): number {
  const ratio = step / total;
  return Math.sin(ratio * Math.PI) * 0.95 + 0.05;
}

export function getTidePhaseAtStep(step: number, total: number): TidePhase {
  const ratio = step / total;
  if (ratio < 0.25) return "falling";
  if (ratio < 0.5) return "low";
  if (ratio < 0.75) return "rising";
  return "high";
}

export function getStepLabel(step: number, total: number): string {
  const phase = getTidePhaseAtStep(step, total);
  const labels: Record<TidePhase, string> = {
    falling: "退潮中",
    low: "低潮",
    rising: "涨潮中",
    high: "高潮",
  };
  return labels[phase];
}
