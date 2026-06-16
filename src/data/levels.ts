import type { Level } from '@/types/game';

export const WOOD_TYPES = [
  { id: 'spruce', name: '云杉木', resonance: 85, warmth: 60, brightness: 90 },
  { id: 'cedar', name: '红雪松', resonance: 80, warmth: 85, brightness: 70 },
  { id: 'mahogany', name: '桃花心木', resonance: 70, warmth: 90, brightness: 65 },
  { id: 'maple', name: '枫木', resonance: 75, warmth: 70, brightness: 85 },
  { id: 'rosewood', name: '玫瑰木', resonance: 65, warmth: 95, brightness: 55 }
];

function generateSpectrum(baseFreq: number, harmonics: number): { frequency: number; amplitude: number }[] {
  const samples: { frequency: number; amplitude: number }[] = [];
  for (let i = 1; i <= harmonics; i++) {
    samples.push({
      frequency: baseFreq * i,
      amplitude: Math.exp(-i * 0.3) * (0.8 + Math.random() * 0.2)
    });
  }
  return samples;
}

export const INITIAL_LEVELS: Level[] = [
  {
    id: 'level-1',
    name: '新手工坊：古典吉他入门',
    description: '你的第一张订单来自一位初学者，他需要一把温暖柔和的入门古典吉他。调整木材厚度和梁位，达到目标音色。',
    difficulty: 'beginner',
    targetTone: {
      brightness: 45,
      warmth: 80,
      resonance: 65,
      sustain: 55,
      projection: 40,
      clarity: 60
    },
    targetSoundSpectrum: generateSpectrum(196, 12),
    idealAdjustments: {
      woodThickness: 3.2,
      beamPosition: 45,
      lacquerLayer: 2,
      soundHoleSize: 85,
      braceAngle: 15
    },
    woodTypes: ['spruce', 'cedar'],
    unlockRequirement: 0
  },
  {
    id: 'level-2',
    name: '民谣之声：指弹演奏款',
    description: '一位指弹演奏家需要一把音色明亮、穿透力强的民谣吉他。重点调整漆层和音孔尺寸。',
    difficulty: 'intermediate',
    targetTone: {
      brightness: 80,
      warmth: 50,
      resonance: 70,
      sustain: 65,
      projection: 85,
      clarity: 90
    },
    targetSoundSpectrum: generateSpectrum(329, 14),
    idealAdjustments: {
      woodThickness: 2.6,
      beamPosition: 55,
      lacquerLayer: 1,
      soundHoleSize: 95,
      braceAngle: 25
    },
    woodTypes: ['spruce', 'maple'],
    unlockRequirement: 60
  },
  {
    id: 'level-3',
    name: '爵士韵味：温暖饱满的空心琴',
    description: '爵士吉他手的定制单：需要极致温暖、延音悠长的音色。这是对制琴师功力的考验。',
    difficulty: 'intermediate',
    targetTone: {
      brightness: 35,
      warmth: 95,
      resonance: 90,
      sustain: 90,
      projection: 50,
      clarity: 55
    },
    targetSoundSpectrum: generateSpectrum(146, 10),
    idealAdjustments: {
      woodThickness: 3.8,
      beamPosition: 35,
      lacquerLayer: 4,
      soundHoleSize: 75,
      braceAngle: 10
    },
    woodTypes: ['mahogany', 'rosewood', 'cedar'],
    unlockRequirement: 130
  },
  {
    id: 'level-4',
    name: '大师之作：音乐厅古典吉他',
    description: '一位即将在音乐厅演出的演奏家定制了这把琴。要求各维度完美平衡，容不得半点马虎。',
    difficulty: 'expert',
    targetTone: {
      brightness: 65,
      warmth: 75,
      resonance: 85,
      sustain: 80,
      projection: 75,
      clarity: 80
    },
    targetSoundSpectrum: generateSpectrum(196, 16),
    idealAdjustments: {
      woodThickness: 2.9,
      beamPosition: 48,
      lacquerLayer: 2,
      soundHoleSize: 88,
      braceAngle: 18
    },
    woodTypes: ['spruce', 'cedar', 'maple'],
    timeLimit: 300,
    unlockRequirement: 220
  },
  {
    id: 'level-5',
    name: '传奇收藏：百年老琴复刻',
    description: '博物馆委托复刻一把1920年代的传奇吉他。极其苛刻的要求，只有真正的大师才能完成。',
    difficulty: 'expert',
    targetTone: {
      brightness: 55,
      warmth: 88,
      resonance: 95,
      sustain: 95,
      projection: 60,
      clarity: 70
    },
    targetSoundSpectrum: generateSpectrum(164, 18),
    idealAdjustments: {
      woodThickness: 3.5,
      beamPosition: 42,
      lacquerLayer: 3,
      soundHoleSize: 80,
      braceAngle: 12
    },
    woodTypes: ['spruce', 'rosewood', 'mahogany'],
    timeLimit: 240,
    unlockRequirement: 350
  }
];
