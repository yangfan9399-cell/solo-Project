import type { Dye, Level, Order } from '~/types/game'

export const dyes: Dye[] = [
  {
    id: 'indigo',
    name: '靛蓝',
    color: { r: 75, g: 0, b: 130 },
    basePrice: 15,
    description: '由蓝草提炼的深蓝色染料'
  },
  {
    id: 'crimson',
    name: '茜红',
    color: { r: 220, g: 20, b: 60 },
    basePrice: 20,
    description: '由茜草根提取的红色染料'
  },
  {
    id: 'gamboge',
    name: '藤黄',
    color: { r: 228, g: 208, b: 10 },
    basePrice: 12,
    description: '由藤黄树脂制成的黄色染料'
  },
  {
    id: 'madder',
    name: '茜素',
    color: { r: 178, g: 34, b: 34 },
    basePrice: 18,
    description: '较为沉稳的红色染料'
  },
  {
    id: 'woad',
    name: '菘蓝',
    color: { r: 30, g: 144, b: 255 },
    basePrice: 14,
    description: '较为明亮的蓝色染料'
  },
  {
    id: 'saffron',
    name: '藏花',
    color: { r: 255, g: 153, b: 0 },
    basePrice: 25,
    description: '珍贵的橙黄色染料'
  },
  {
    id: 'green-indigo',
    name: '青黛',
    color: { r: 72, g: 118, b: 255 },
    basePrice: 22,
    description: '青中带蓝的特殊染料'
  },
  {
    id: 'mulberry',
    name: '桑紫',
    color: { r: 128, g: 0, b: 128 },
    basePrice: 28,
    description: '由桑椹提炼的紫色染料'
  },
  {
    id: 'cinnabar',
    name: '朱砂',
    color: { r: 255, g: 80, b: 0 },
    basePrice: 30,
    description: '色泽鲜艳的朱红色染料'
  }
]

const createOrder = (
  id: string,
  name: string,
  customer: string,
  rgb: [number, number, number],
  reward: number,
  difficulty: 'easy' | 'medium' | 'hard',
  description: string
): Order => ({
  id,
  name,
  customer,
  targetColor: { r: rgb[0], g: rgb[1], b: rgb[2] },
  reward,
  deadline: 300,
  difficulty,
  description
})

export const levels: Level[] = [
  {
    id: 1,
    name: '初入染坊',
    description: '学习基础的染色技艺，完成三笔简单订单',
    initialGold: 100,
    initialInventory: [
      { dyeId: 'indigo', quantity: 10 },
      { dyeId: 'crimson', quantity: 10 },
      { dyeId: 'gamboge', quantity: 10 }
    ],
    orders: [
      createOrder('l1-01', '素蓝布', '张记布庄', [75, 0, 130], 30, 'easy', '一匹普通的蓝色布料'),
      createOrder('l1-02', '朱红巾', '李府', [220, 20, 60], 35, 'easy', '一条红色的头巾'),
      createOrder('l1-03', '鹅黄裳', '王裁缝', [228, 208, 10], 30, 'easy', '一件浅黄色的衣裳')
    ],
    targetOrders: 3,
    timeLimit: 600,
    unlockRequirement: 0
  },
  {
    id: 2,
    name: '渐入佳境',
    description: '尝试调配间色，完成更多订单',
    initialGold: 150,
    initialInventory: [
      { dyeId: 'indigo', quantity: 8 },
      { dyeId: 'crimson', quantity: 8 },
      { dyeId: 'gamboge', quantity: 8 },
      { dyeId: 'madder', quantity: 5 },
      { dyeId: 'woad', quantity: 5 }
    ],
    orders: [
      createOrder('l2-01', '翠绿缎', '绸缎庄', [34, 139, 34], 50, 'medium', '一匹翠绿色的绸缎'),
      createOrder('l2-02', '橘红绫', '城东布行', [255, 140, 0], 55, 'medium', '一匹橘红色的绫罗'),
      createOrder('l2-03', '藕荷裙', '苏小姐', [224, 176, 255], 60, 'medium', '一条藕荷色的裙子'),
      createOrder('l2-04', '藏青袍', '陈员外', [24, 50, 80], 50, 'medium', '一件藏青色的长袍'),
      createOrder('l2-05', '杏黄衫', '赵掌柜', [255, 175, 30], 45, 'easy', '一件杏黄色的短衫')
    ],
    targetOrders: 4,
    timeLimit: 900,
    unlockRequirement: 60
  },
  {
    id: 3,
    name: '名染初成',
    description: '挑战复杂的配色，成为城中名染',
    initialGold: 200,
    initialInventory: [
      { dyeId: 'indigo', quantity: 10 },
      { dyeId: 'crimson', quantity: 10 },
      { dyeId: 'gamboge', quantity: 10 },
      { dyeId: 'madder', quantity: 8 },
      { dyeId: 'woad', quantity: 8 },
      { dyeId: 'saffron', quantity: 5 },
      { dyeId: 'mulberry', quantity: 5 }
    ],
    orders: [
      createOrder('l3-01', '胭脂粉', '醉仙楼', [255, 105, 180], 80, 'medium', '胭脂粉色的帷幕'),
      createOrder('l3-02', '天青釉', '官窑', [128, 191, 223], 75, 'medium', '仿天青釉色的布料'),
      createOrder('l3-03', '秋香色', '秋香阁', [138, 125, 50], 70, 'medium', '秋香色的帘帐'),
      createOrder('l3-04', '赤金霞', '云霞观', [255, 120, 70], 85, 'hard', '赤金霞光般的道袍'),
      createOrder('l3-05', '月白兰', '望月楼', [200, 220, 240], 65, 'easy', '月白色的兰花裙'),
      createOrder('l3-06', '黛螺青', '书院', [72, 60, 100], 75, 'medium', '黛螺青色的书院制服')
    ],
    targetOrders: 5,
    timeLimit: 1200,
    unlockRequirement: 180
  },
  {
    id: 4,
    name: '染坊大师',
    description: '调配最难的颜色，名震四方',
    initialGold: 300,
    initialInventory: [
      { dyeId: 'indigo', quantity: 12 },
      { dyeId: 'crimson', quantity: 12 },
      { dyeId: 'gamboge', quantity: 12 },
      { dyeId: 'madder', quantity: 10 },
      { dyeId: 'woad', quantity: 10 },
      { dyeId: 'saffron', quantity: 8 },
      { dyeId: 'green-indigo', quantity: 6 },
      { dyeId: 'mulberry', quantity: 6 },
      { dyeId: 'cinnabar', quantity: 5 }
    ],
    orders: [
      createOrder('l4-01', '朱砂痣', '状元府', [255, 80, 0], 120, 'hard', '状元红的喜袍'),
      createOrder('l4-02', '祖母绿', '翡翠阁', [0, 120, 80], 110, 'hard', '祖母绿色的帷幔'),
      createOrder('l4-03', '紫檀木', '木坊', [90, 50, 30], 100, 'hard', '紫檀木色的家具布'),
      createOrder('l4-04', '琉璃翠', '琉璃厂', [0, 180, 150], 115, 'hard', '琉璃翠色的装饰布'),
      createOrder('l4-05', '樱花粉', '樱花园', [255, 183, 197], 90, 'medium', '樱花粉色的和服'),
      createOrder('l4-06', '玄铁色', '铸剑坊', [60, 60, 70], 95, 'medium', '玄铁色的剑穗'),
      createOrder('l4-07', '琥珀光', '珠宝行', [255, 140, 0], 100, 'medium', '琥珀色的珠宝盒衬布')
    ],
    targetOrders: 6,
    timeLimit: 1500,
    unlockRequirement: 350
  }
]

export const getDyeById = (id: string): Dye | undefined => {
  return dyes.find(d => d.id === id)
}

export const getLevelById = (id: number): Level | undefined => {
  return levels.find(l => l.id === id)
}
