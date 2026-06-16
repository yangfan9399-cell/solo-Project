import type { Level, Relic } from "~/types/game";

const relicsData: Omit<Relic, "position" | "orientation" | "discovered">[] = [
  {
    id: "relic-1",
    name: "青铜鼎",
    description: "商代青铜鼎，器身饰有饕餮纹，是古代祭祀的重要礼器。",
    photoUrl: "bronze-ding",
    era: "商代",
    points: 500,
    size: 3
  },
  {
    id: "relic-2",
    name: "青花瓷瓶",
    description: "明代青花瓷瓶，釉色温润，绘有山水人物图案。",
    photoUrl: "blue-white-vase",
    era: "明代",
    points: 350,
    size: 2
  },
  {
    id: "relic-3",
    name: "金币套装",
    description: "清代金币一套，共十二枚，铸有龙纹图案。",
    photoUrl: "gold-coins",
    era: "清代",
    points: 400,
    size: 2
  },
  {
    id: "relic-4",
    name: "玉璧",
    description: "汉代玉璧，和田青玉雕琢，玉质温润通透。",
    photoUrl: "jade-bi",
    era: "汉代",
    points: 450,
    size: 2
  },
  {
    id: "relic-5",
    name: "铜佛像",
    description: "唐代铜佛像，造型端庄，面部慈祥，刻工精湛。",
    photoUrl: "bronze-buddha",
    era: "唐代",
    points: 600,
    size: 3
  },
  {
    id: "relic-6",
    name: "陶罐",
    description: "新石器时代彩陶陶罐，绘有几何纹样。",
    photoUrl: "pottery-jar",
    era: "新石器时代",
    points: 300,
    size: 2
  },
  {
    id: "relic-7",
    name: "宝剑",
    description: "战国青铜剑，剑身仍锋利，剑格饰有兽面纹。",
    photoUrl: "bronze-sword",
    era: "战国",
    points: 550,
    size: 3
  },
  {
    id: "relic-8",
    name: "印章",
    description: "汉代玉印，印文为小篆，印钮为螭虎造型。",
    photoUrl: "jade-seal",
    era: "汉代",
    points: 250,
    size: 1
  }
];

function createRelic(
  base: Omit<Relic, "position" | "orientation" | "discovered">,
  row: number,
  col: number,
  orientation: "horizontal" | "vertical"
): Relic {
  return {
    ...base,
    position: { row, col },
    orientation,
    discovered: false
  };
}

export const levels: Level[] = [
  {
    id: "level-1",
    name: "初探沉船湾",
    description: "入门关卡，清澈的海水让声呐探测变得简单。",
    gridSize: 8,
    turbidity: 20,
    maxDives: 5,
    sonarPerDive: 10,
    requiredRelics: 2,
    backgroundStory:
      "你是一名水下考古学家，在南海发现了一处疑似古代沉船的遗址。清澈的海水为你的探索提供了良好条件。使用声呐探测网格，定位并发掘珍贵的文物！",
    relics: [
      createRelic(relicsData[0], 2, 3, "horizontal"),
      createRelic(relicsData[1], 5, 1, "vertical"),
      createRelic(relicsData[5], 4, 5, "horizontal")
    ]
  },
  {
    id: "level-2",
    name: "迷雾深礁",
    description: "中度浑浊的水域，需要更多的声呐扫描来精确定位。",
    gridSize: 10,
    turbidity: 45,
    maxDives: 6,
    sonarPerDive: 12,
    requiredRelics: 3,
    backgroundStory:
      "深入迷雾笼罩的暗礁区域，这里的能见度大幅降低。传说中有一艘满载宝物的商船在此沉没。仔细规划你的每一次下潜，运用声呐编织出一张探测之网。",
    relics: [
      createRelic(relicsData[2], 1, 2, "vertical"),
      createRelic(relicsData[3], 4, 4, "horizontal"),
      createRelic(relicsData[6], 7, 3, "horizontal"),
      createRelic(relicsData[7], 6, 8, "vertical")
    ]
  },
  {
    id: "level-3",
    name: "幽冥深渊",
    description: "高难度关卡，浑浊的海水考验你的探测技巧。",
    gridSize: 12,
    turbidity: 70,
    maxDives: 7,
    sonarPerDive: 14,
    requiredRelics: 4,
    backgroundStory:
      "传说中的幽冥深渊，浑浊的海水中隐藏着最珍贵的宝藏。这里曾是古代海上丝绸之路的必经之地，无数商船在此折戟沉沙。只有最出色的考古学家才能在这里满载而归。",
    relics: [
      createRelic(relicsData[0], 2, 5, "vertical"),
      createRelic(relicsData[4], 5, 2, "horizontal"),
      createRelic(relicsData[6], 8, 7, "vertical"),
      createRelic(relicsData[1], 3, 9, "horizontal"),
      createRelic(relicsData[7], 10, 4, "vertical"),
      createRelic(relicsData[5], 7, 10, "horizontal")
    ]
  }
];

export function getLevelById(id: string): Level | undefined {
  return levels.find((l) => l.id === id);
}
