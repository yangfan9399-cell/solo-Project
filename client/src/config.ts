import type { GameMap, GamePhase } from './types';

const RESOURCE_LABELS: Record<string, string> = {
  candle: '烛芯',
  oil: '灯油',
  breeze: '风引',
  talisman: '镇符'
};

const RESOURCE_ICONS: Record<string, string> = {
  candle: '🕯️',
  oil: '🛢️',
  breeze: '🍃',
  talisman: '📜'
};

const MAPS: Record<GamePhase, GameMap> = {
  wu: {
    phase: 'wu',
    phaseName: '午局 · 潮光教学',
    width: 600,
    height: 420,
    background: 'linear-gradient(180deg, #f5deb3 0%, #deb887 60%, #b8860b 100%)',
    nodes: [
      { id: 'w-n1', x: 120, y: 100, name: '迎潮台', initialMeasurement: 60, type: 'beacon' },
      { id: 'w-n2', x: 300, y: 80, name: '中流塔', initialMeasurement: 55, type: 'tower' },
      { id: 'w-n3', x: 480, y: 120, name: '送舟门', initialMeasurement: 50, type: 'gate' },
      { id: 'w-n4', x: 200, y: 260, name: '浅湾浮', initialMeasurement: 40, type: 'buoy' },
      { id: 'w-n5', x: 400, y: 280, name: '归航标', initialMeasurement: 45, type: 'buoy' }
    ],
    slots: [
      { id: 'w-s1', name: '迎潮槽', capacity: 4, resourceType: 'candle', requiredForId: 'w-n1' },
      { id: 'w-s2', name: '中流槽', capacity: 3, resourceType: 'oil', requiredForId: 'w-n2' },
      { id: 'w-s3', name: '送舟槽', capacity: 3, resourceType: 'candle', requiredForId: 'w-n3' },
      { id: 'w-s4', name: '湾浮槽', capacity: 2, resourceType: 'breeze', requiredForId: 'w-n4' },
      { id: 'w-s5', name: '归航槽', capacity: 2, resourceType: 'breeze', requiredForId: 'w-n5' }
    ]
  },
  ding: {
    phase: 'ding',
    phaseName: '丁局 · 缺灯夜行',
    width: 640,
    height: 440,
    background: 'linear-gradient(180deg, #2c3e50 0%, #1a252f 60%, #0d1418 100%)',
    nodes: [
      { id: 'd-n1', x: 100, y: 90, name: '暗礁灯', initialMeasurement: 70, type: 'beacon' },
      { id: 'd-n2', x: 320, y: 70, name: '十字塔', initialMeasurement: 65, type: 'tower' },
      { id: 'd-n3', x: 540, y: 110, name: '孤门', initialMeasurement: 60, type: 'gate' },
      { id: 'd-n4', x: 180, y: 300, name: '雾中浮', initialMeasurement: 55, type: 'buoy' },
      { id: 'd-n5', x: 360, y: 320, name: '断链标', initialMeasurement: 50, type: 'buoy' },
      { id: 'd-n6', x: 520, y: 280, name: '险流标', initialMeasurement: 58, type: 'buoy' }
    ],
    slots: [
      { id: 'd-s1', name: '暗礁槽', capacity: 5, resourceType: 'oil', requiredForId: 'd-n1' },
      { id: 'd-s2', name: '十字槽', capacity: 4, resourceType: 'oil', requiredForId: 'd-n2' },
      { id: 'd-s3', name: '孤门槽', capacity: 4, resourceType: 'candle', requiredForId: 'd-n3' },
      { id: 'd-s4', name: '雾中槽', capacity: 3, resourceType: 'breeze', requiredForId: 'd-n4' },
      { id: 'd-s5', name: '断链槽', capacity: 3, resourceType: 'talisman', requiredForId: 'd-n5' },
      { id: 'd-s6', name: '险流槽', capacity: 3, resourceType: 'breeze', requiredForId: 'd-n6' }
    ]
  },
  ji: {
    phase: 'ji',
    phaseName: '己局 · 归墟谜光',
    width: 680,
    height: 460,
    background: 'linear-gradient(180deg, #483d8b 0%, #2f1f4a 60%, #1a0f2e 100%)',
    nodes: [
      { id: 'j-n1', x: 120, y: 80, name: '墟门', initialMeasurement: 80, type: 'gate' },
      { id: 'j-n2', x: 340, y: 60, name: '转心塔', initialMeasurement: 75, type: 'tower' },
      { id: 'j-n3', x: 560, y: 100, name: '冥渡台', initialMeasurement: 72, type: 'beacon' },
      { id: 'j-n4', x: 180, y: 260, name: '忘川浮', initialMeasurement: 68, type: 'buoy' },
      { id: 'j-n5', x: 360, y: 280, name: '三生标', initialMeasurement: 65, type: 'buoy' },
      { id: 'j-n6', x: 520, y: 300, name: '彼岸标', initialMeasurement: 70, type: 'buoy' },
      { id: 'j-n7', x: 340, y: 400, name: '归墟眼', initialMeasurement: 90, type: 'beacon' }
    ],
    slots: [
      { id: 'j-s1', name: '墟门槽', capacity: 6, resourceType: 'talisman', requiredForId: 'j-n1' },
      { id: 'j-s2', name: '转心槽', capacity: 5, resourceType: 'oil', requiredForId: 'j-n2' },
      { id: 'j-s3', name: '冥渡槽', capacity: 5, resourceType: 'candle', requiredForId: 'j-n3' },
      { id: 'j-s4', name: '忘川槽', capacity: 4, resourceType: 'breeze', requiredForId: 'j-n4' },
      { id: 'j-s5', name: '三生槽', capacity: 4, resourceType: 'talisman', requiredForId: 'j-n5' },
      { id: 'j-s6', name: '彼岸槽', capacity: 4, resourceType: 'breeze', requiredForId: 'j-n6' },
      { id: 'j-s7', name: '归墟槽', capacity: 8, resourceType: 'oil', requiredForId: 'j-n7' }
    ]
  }
};

const NODE_TYPE_ICONS: Record<string, string> = {
  beacon: '🏮',
  tower: '🗼',
  buoy: '🛟',
  gate: '⛩️'
};

export { MAPS, RESOURCE_LABELS, RESOURCE_ICONS, NODE_TYPE_ICONS };
