import {
  GameLevel,
  GameLevelId,
  TileType,
  WinFormula,
  GameField,
  GameEvent,
  GameMap,
  MapTile
} from "@cbcp/shared";

const T = (type: TileType, id: string, label?: string, note?: string): MapTile => ({
  type,
  id,
  label,
  note
});

const siInitialField: GameField = {
  trackSwitchValue: 0,
  translationSlot: 3,
  overwriteMark: 2,
  siRisk: 0,
  shenReward: 0,
  wuFailFactor: 1
};

const shenInitialField: GameField = {
  trackSwitchValue: 0,
  translationSlot: 0,
  overwriteMark: 0,
  siRisk: 0,
  shenReward: 0,
  wuFailFactor: 1
};

const wuInitialField: GameField = {
  trackSwitchValue: 0,
  translationSlot: 2,
  overwriteMark: 1,
  siRisk: 0,
  shenReward: 0,
  wuFailFactor: 2
};

const buildSiMap = (): GameMap => {
  const S = TileType.START;
  const E = TileType.END;
  const P = TileType.PATH;
  const O = TileType.OBSTACLE;
  const H = TileType.HAZARD;
  const R = TileType.REWARD;
  const C = TileType.CORAL_BELL;

  const layout: TileType[][] = [
    [P, P, P, P, E],
    [O, O, O, O, P],
    [H, P, R, O, P],
    [P, O, C, O, P],
    [S, P, P, P, P]
  ];

  const labels: Record<string, string> = {
    "0-4": "巳起",
    "4-0": "巳终",
    "2-2": "珊",
    "0-2": "险",
    "2-2-reward": "奖"
  };

  const width = 5;
  const height = 5;
  const tiles: MapTile[][] = [];
  for (let y = 0; y < height; y++) {
    const row: MapTile[] = [];
    for (let x = 0; x < width; x++) {
      const type = layout[y][x];
      const key = `${x}-${y}`;
      const label = labels[key] || (type === S ? "起" : type === E ? "终" : type === C ? "珊" : type === H ? "险" : type === R ? "奖" : undefined);
      row.push(T(type, `si-${x}-${y}`, label));
    }
    tiles.push(row);
  }

  return {
    id: "si-map",
    name: "巳局·启蒙回廊",
    width,
    height,
    tiles,
    start: { x: 0, y: 4 },
    end: { x: 4, y: 0 },
    description: "巳局启蒙回廊：L形通道，含一处珊瑚钟、一处奖励、一处风险。学习基本操作与格位效应。"
  };
};

const buildShenMap = (): GameMap => {
  const S = TileType.START;
  const E = TileType.END;
  const P = TileType.PATH;
  const O = TileType.OBSTACLE;
  const H = TileType.HAZARD;
  const R = TileType.REWARD;
  const TR = TileType.TRANSLATE;
  const OV = TileType.OVERWRITE;

  const layout: TileType[][] = [
    [P, H, P, R, P, E],
    [P, O, O, O, O, P],
    [P, TR, P, P, H, P],
    [P, O, O, OV, O, P],
    [S, P, R, P, P, P]
  ];

  const width = 6;
  const height = 5;
  const tiles: MapTile[][] = [];
  for (let y = 0; y < height; y++) {
    const row: MapTile[] = [];
    for (let x = 0; x < width; x++) {
      const type = layout[y][x];
      let label: string | undefined;
      if (type === S) label = "申起";
      else if (type === E) label = "申终";
      else if (type === TR) label = "译";
      else if (type === OV) label = "覆";
      else if (type === R) label = "奖";
      else if (type === H) label = "险";
      row.push(T(type, `shen-${x}-${y}`, label));
    }
    tiles.push(row);
  }

  return {
    id: "shen-map",
    name: "申局·吝啬之厅",
    width,
    height,
    tiles,
    start: { x: 0, y: 4 },
    end: { x: 5, y: 0 },
    description: "申局吝啬之厅：初始转译槽与复写痕均为0。须先踏译/覆格解锁资源，再取奖励方达阈值。"
  };
};

const buildWuMap = (): GameMap => {
  const S = TileType.START;
  const E = TileType.END;
  const P = TileType.PATH;
  const O = TileType.OBSTACLE;
  const H = TileType.HAZARD;
  const R = TileType.REWARD;
  const C = TileType.CORAL_BELL;
  const SW = TileType.SWITCH;
  const TR = TileType.TRANSLATE;

  const layout: TileType[][] = [
    [P, P, H, P, P, E],
    [P, O, O, O, C, P],
    [P, SW, P, TR, O, P],
    [H, O, O, P, O, P],
    [P, P, R, P, SW, P],
    [S, O, P, H, P, P]
  ];

  const width = 6;
  const height = 6;
  const tiles: MapTile[][] = [];
  for (let y = 0; y < height; y++) {
    const row: MapTile[] = [];
    for (let x = 0; x < width; x++) {
      const type = layout[y][x];
      let label: string | undefined;
      if (type === S) label = "午起";
      else if (type === E) label = "午终";
      else if (type === C) label = "珊";
      else if (type === SW) label = "换";
      else if (type === TR) label = "译";
      else if (type === R) label = "奖";
      else if (type === H) label = "险";
      row.push(T(type, `wu-${x}-${y}`, label));
    }
    tiles.push(row);
  }

  return {
    id: "wu-map",
    name: "午局·密印之间",
    width,
    height,
    tiles,
    start: { x: 0, y: 5 },
    end: { x: 5, y: 0 },
    description: "午局密印之间：须依次踏过两换轨开关，再触珊瑚钟，激活隐藏密印后方抵终点。"
  };
};

const siEvents: GameEvent[] = [
  {
    id: "si-risk-hazard-0-2",
    type: "risk",
    trigger: { type: "position", position: { x: 0, y: 2 } },
    effect: { field: "siRisk", delta: 1 },
    message: "踩入巳号风险格：险雾升腾，siRisk +1（本局若 siRisk > 0 则败局）",
    scope: "si"
  },
  {
    id: "si-reward-r-2-2",
    type: "reward",
    trigger: { type: "position", position: { x: 2, y: 2 } },
    effect: { field: "shenReward", delta: 2 },
    message: "拾取珊瑚瑰宝：shenReward +2",
    scope: "si"
  },
  {
    id: "si-coral-bell-2-3",
    type: "translate",
    trigger: { type: "position", position: { x: 2, y: 3 } },
    effect: { field: "translationSlot", delta: 1 },
    message: "珊瑚钟振鸣：转译槽 translationSlot +1（可用于穿越特殊格）",
    scope: "si"
  },
  {
    id: "si-step-3-encourage",
    type: "reward",
    trigger: { type: "step", step: 3 },
    effect: { field: "shenReward", delta: 1 },
    message: "教学鼓励：已行3步，shenReward +1",
    scope: "si"
  },
  {
    id: "si-tutorial-end-hint",
    type: "reward",
    trigger: { type: "value", value: { field: "trackSwitchValue", operator: ">=", threshold: 6 } },
    effect: { field: "overwriteMark", delta: 1 },
    message: "换轨值达6：珊瑚钟室回声提示，复写痕 overwriteMark +1",
    scope: "si"
  }
];

const shenEvents: GameEvent[] = [
  {
    id: "shen-translate-slot-1-2",
    type: "translate",
    trigger: { type: "position", position: { x: 1, y: 2 } },
    effect: { field: "translationSlot", delta: 2 },
    message: "踏中转译槽符文：translationSlot +2（吝啬之厅初显恩泽）",
    scope: "shen"
  },
  {
    id: "shen-overwrite-mark-3-3",
    type: "overwrite",
    trigger: { type: "position", position: { x: 3, y: 3 } },
    effect: { field: "overwriteMark", delta: 1 },
    message: "覆写之痕激活：overwriteMark +1（资源已现，取舍得当）",
    scope: "shen"
  },
  {
    id: "shen-reward-r-2-4",
    type: "reward",
    trigger: { type: "position", position: { x: 2, y: 4 } },
    effect: { field: "shenReward", delta: 1 },
    message: "拾得浅滩珊瑚珠：shenReward +1",
    scope: "shen"
  },
  {
    id: "shen-reward-r-3-0",
    type: "reward",
    trigger: { type: "position", position: { x: 3, y: 0 } },
    effect: { field: "shenReward", delta: 2 },
    message: "拾得深海珊瑚枝：shenReward +2",
    scope: "shen"
  },
  {
    id: "shen-risk-hazard-1-0",
    type: "risk",
    trigger: { type: "position", position: { x: 1, y: 0 } },
    effect: { field: "siRisk", delta: 2 },
    message: "误入申号险涡：siRisk +2",
    scope: "shen"
  },
  {
    id: "shen-risk-hazard-4-2",
    type: "risk",
    trigger: { type: "position", position: { x: 4, y: 2 } },
    effect: { field: "siRisk", delta: 1 },
    message: "擦过珊瑚礁石：siRisk +1",
    scope: "shen"
  },
  {
    id: "shen-bonus-translate-used",
    type: "reward",
    trigger: { type: "value", value: { field: "translationSlot", operator: ">=", threshold: 2 } },
    effect: { field: "shenReward", delta: 1 },
    message: "转译槽充盈：额外 shenReward +1",
    scope: "shen"
  },
  {
    id: "shen-step-penalty-8",
    type: "risk",
    trigger: { type: "step", step: 8 },
    effect: { field: "siRisk", delta: 1 },
    message: "迟疑太久（第8步）：siRisk +1，吝啬之厅不等人",
    scope: "shen"
  }
];

const wuEvents: GameEvent[] = [
  {
    id: "wu-switch-1-2",
    type: "overwrite",
    trigger: { type: "position", position: { x: 1, y: 2 } },
    effect: { field: "overwriteMark", delta: 1 },
    message: "启·换轨开关1激活：overwriteMark +1",
    scope: "wu"
  },
  {
    id: "wu-switch-4-4",
    type: "overwrite",
    trigger: { type: "position", position: { x: 4, y: 4 } },
    effect: { field: "overwriteMark", delta: 1 },
    message: "承·换轨开关2激活：overwriteMark +1",
    scope: "wu"
  },
  {
    id: "wu-coral-bell-4-1",
    type: "translate",
    trigger: { type: "position", position: { x: 4, y: 1 } },
    effect: { field: "translationSlot", delta: 2 },
    message: "珊瑚钟共鸣：translationSlot +2",
    scope: "wu"
  },
  {
    id: "wu-hidden-seal",
    type: "hidden",
    trigger: { type: "value", value: { field: "overwriteMark", operator: ">=", threshold: 3 } },
    effect: { field: "shenReward", delta: 5, customLogic: "SEAL_ACTIVATED" },
    message: "???（密印条件）",
    scope: "wu"
  },
  {
    id: "wu-reward-r-2-4",
    type: "reward",
    trigger: { type: "position", position: { x: 2, y: 4 } },
    effect: { field: "shenReward", delta: 1 },
    message: "拾得珊瑚碎片：shenReward +1",
    scope: "wu"
  },
  {
    id: "wu-risk-hazard-2-0",
    type: "risk",
    trigger: { type: "position", position: { x: 2, y: 0 } },
    effect: { field: "siRisk", delta: 2 },
    message: "午号焚风刮过：siRisk +2，失败因子生效中",
    scope: "wu"
  },
  {
    id: "wu-risk-hazard-0-3",
    type: "risk",
    trigger: { type: "position", position: { x: 0, y: 3 } },
    effect: { field: "siRisk", delta: 1 },
    message: "侧边暗流：siRisk +1",
    scope: "wu"
  },
  {
    id: "wu-risk-hazard-3-5",
    type: "risk",
    trigger: { type: "position", position: { x: 3, y: 5 } },
    effect: { field: "siRisk", delta: 1 },
    message: "入门险礁：siRisk +1",
    scope: "wu"
  },
  {
    id: "wu-translate-3-2",
    type: "translate",
    trigger: { type: "position", position: { x: 3, y: 2 } },
    effect: { field: "translationSlot", delta: 1 },
    message: "译门轻启：translationSlot +1",
    scope: "wu"
  },
  {
    id: "wu-step-12-penalty",
    type: "risk",
    trigger: { type: "step", step: 12 },
    effect: { field: "wuFailFactor", delta: 1 },
    message: "时辰将过（第12步）：午号失败因子 wuFailFactor +1",
    scope: "wu"
  }
];

export const LEVELS: GameLevel[] = [
  {
    id: "si",
    name: "巳局·教学",
    map: buildSiMap(),
    initialField: siInitialField,
    events: siEvents,
    winFormula: WinFormula.NO_RISK_AND_REACH,
    winFormulaParams: {
      maxRisk: 0
    },
    description: "巳局·教学：启蒙回廊，教学关卡。踏路径前行，避风险格，抵达终点且巳号风险 siRisk ≤ 0 即胜。",
    tutorial: "【巳局教学指引】\n① 起点在左下(0,4)，终点在右上(4,0)。\n② 每走一步换轨值 trackSwitchValue 自动 +1。\n③ 险(HAZARD)格会增加 siRisk，本关若 siRisk>0 则败。\n④ 奖(REWARD)格增加 shenReward，珊(CORAL_BELL)格给转译槽。\n⑤ 可走上下左右四向，不能穿过障碍(OBSTACLE)。\n⑥ 每步自动保存至回放轴，刷新页面可继续当前局。"
  },
  {
    id: "shen",
    name: "申局·资源短缺",
    map: buildShenMap(),
    initialField: shenInitialField,
    events: shenEvents,
    winFormula: WinFormula.REACH_END_WITH_REWARD,
    winFormulaParams: {
      minReward: 5
    },
    description: "申局·资源短缺：吝啬之厅。初始转译槽=0，复写痕=0。须先激活译/覆格解锁资源，累积申号奖励 shenReward ≥ 5 且抵达终点方胜。",
    tutorial: "【申局指引】\n① 转译槽(译格)与复写痕(覆格)初始均为 0。\n② 途中仅 2 处奖励格，需触发译槽充盈事件拿额外奖励。\n③ 捷径有险(SHEN HAZARD)，远路费脚会触发步数惩罚。\n④ 目标：到达终点时 shenReward ≥ 5。"
  },
  {
    id: "wu",
    name: "午局·隐藏条件",
    map: buildWuMap(),
    initialField: wuInitialField,
    events: wuEvents,
    winFormula: WinFormula.HIDDEN_TRIGGERED_AND_END,
    winFormulaParams: {
      requiredHiddenEventIds: ["wu-hidden-seal"]
    },
    description: "午局·隐藏条件：密印之间。初始失败因子=2。须依次触达两个换轨开关，激活珊瑚钟，触发隐藏密印(wu-hidden-seal)后，再抵达终点方胜。",
    tutorial: "【午局指引】\n① 存在两个换(换轨开关)格，需全部踏过；再到珊(珊瑚钟)格共鸣。\n② 当 overwriteMark ≥ 3 时会触发隐藏密印 wu-hidden-seal。\n③ 密印触发后，到达终点才可通关。\n④ 步数过 12 步会使 wuFailFactor 上升，放大风险惩罚。\n⑤ 初始 wuFailFactor=2，计算总分时 siRisk 被双倍扣除。"
  }
];

export const getLevelById = (id: GameLevelId): GameLevel | undefined => {
  return LEVELS.find((l) => l.id === id);
};

export const stripHiddenHints = (level: GameLevel): GameLevel => {
  const filteredEvents = level.events.map((e) => {
    if (e.type === "hidden") {
      return {
        ...e,
        message: "???（隐藏密印，条件未显形）"
      };
    }
    return e;
  });
  return { ...level, events: filteredEvents };
};
