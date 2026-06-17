import type { Level } from '~/types'

export const levels: Level[] = [
  {
    id: 1,
    name: '入门篇',
    description: '一位数加减法，基础入门',
    difficulty: 'easy',
    requiredScore: 60,
    timeLimit: 180,
    questions: [
      { id: 101, type: 'addition', expression: '5 + 3', answer: 8, difficulty: 1 },
      { id: 102, type: 'addition', expression: '7 + 2', answer: 9, difficulty: 1 },
      { id: 103, type: 'addition', expression: '4 + 5', answer: 9, difficulty: 1 },
      { id: 104, type: 'subtraction', expression: '8 - 3', answer: 5, difficulty: 1 },
      { id: 105, type: 'subtraction', expression: '9 - 5', answer: 4, difficulty: 1 },
      { id: 106, type: 'subtraction', expression: '7 - 2', answer: 5, difficulty: 1 },
      { id: 107, type: 'addition', expression: '6 + 3', answer: 9, difficulty: 1 },
      { id: 108, type: 'subtraction', expression: '10 - 4', answer: 6, difficulty: 1 },
      { id: 109, type: 'addition', expression: '3 + 6', answer: 9, difficulty: 1 },
      { id: 110, type: 'subtraction', expression: '8 - 5', answer: 3, difficulty: 1 }
    ]
  },
  {
    id: 2,
    name: '初级篇',
    description: '两位数加减法，进位练习',
    difficulty: 'easy',
    requiredScore: 60,
    timeLimit: 180,
    questions: [
      { id: 201, type: 'addition', expression: '15 + 7', answer: 22, difficulty: 2 },
      { id: 202, type: 'addition', expression: '23 + 18', answer: 41, difficulty: 2 },
      { id: 203, type: 'addition', expression: '36 + 27', answer: 63, difficulty: 2 },
      { id: 204, type: 'subtraction', expression: '25 - 8', answer: 17, difficulty: 2 },
      { id: 205, type: 'subtraction', expression: '42 - 17', answer: 25, difficulty: 2 },
      { id: 206, type: 'subtraction', expression: '58 - 29', answer: 29, difficulty: 2 },
      { id: 207, type: 'addition', expression: '19 + 35', answer: 54, difficulty: 2 },
      { id: 208, type: 'subtraction', expression: '63 - 37', answer: 26, difficulty: 2 },
      { id: 209, type: 'addition', expression: '47 + 26', answer: 73, difficulty: 2 },
      { id: 210, type: 'subtraction', expression: '72 - 48', answer: 24, difficulty: 2 }
    ]
  },
  {
    id: 3,
    name: '进阶篇',
    description: '两位数加减法，复杂运算',
    difficulty: 'medium',
    requiredScore: 70,
    timeLimit: 150,
    questions: [
      { id: 301, type: 'addition', expression: '56 + 78', answer: 134, difficulty: 3 },
      { id: 302, type: 'addition', expression: '89 + 45', answer: 134, difficulty: 3 },
      { id: 303, type: 'addition', expression: '123 + 56', answer: 179, difficulty: 3 },
      { id: 304, type: 'subtraction', expression: '100 - 35', answer: 65, difficulty: 3 },
      { id: 305, type: 'subtraction', expression: '156 - 78', answer: 78, difficulty: 3 },
      { id: 306, type: 'subtraction', expression: '200 - 87', answer: 113, difficulty: 3 },
      { id: 307, type: 'addition', expression: '234 + 156', answer: 390, difficulty: 3 },
      { id: 308, type: 'subtraction', expression: '350 - 167', answer: 183, difficulty: 3 },
      { id: 309, type: 'addition', expression: '178 + 245', answer: 423, difficulty: 3 },
      { id: 310, type: 'subtraction', expression: '420 - 256', answer: 164, difficulty: 3 }
    ]
  },
  {
    id: 4,
    name: '乘法篇',
    description: '表内乘法，基础练习',
    difficulty: 'medium',
    requiredScore: 70,
    timeLimit: 120,
    questions: [
      { id: 401, type: 'multiplication', expression: '6 × 7', answer: 42, difficulty: 3 },
      { id: 402, type: 'multiplication', expression: '8 × 9', answer: 72, difficulty: 3 },
      { id: 403, type: 'multiplication', expression: '5 × 8', answer: 40, difficulty: 2 },
      { id: 404, type: 'multiplication', expression: '7 × 6', answer: 42, difficulty: 3 },
      { id: 405, type: 'multiplication', expression: '9 × 7', answer: 63, difficulty: 3 },
      { id: 406, type: 'multiplication', expression: '4 × 9', answer: 36, difficulty: 2 },
      { id: 407, type: 'multiplication', expression: '6 × 8', answer: 48, difficulty: 3 },
      { id: 408, type: 'multiplication', expression: '8 × 8', answer: 64, difficulty: 3 },
      { id: 409, type: 'multiplication', expression: '7 × 9', answer: 63, difficulty: 3 },
      { id: 410, type: 'multiplication', expression: '9 × 9', answer: 81, difficulty: 3 }
    ]
  },
  {
    id: 5,
    name: '除法篇',
    description: '表内除法，基础练习',
    difficulty: 'medium',
    requiredScore: 70,
    timeLimit: 120,
    questions: [
      { id: 501, type: 'division', expression: '42 ÷ 7', answer: 6, difficulty: 3 },
      { id: 502, type: 'division', expression: '72 ÷ 8', answer: 9, difficulty: 3 },
      { id: 503, type: 'division', expression: '40 ÷ 5', answer: 8, difficulty: 2 },
      { id: 504, type: 'division', expression: '36 ÷ 6', answer: 6, difficulty: 2 },
      { id: 505, type: 'division', expression: '63 ÷ 9', answer: 7, difficulty: 3 },
      { id: 506, type: 'division', expression: '28 ÷ 4', answer: 7, difficulty: 2 },
      { id: 507, type: 'division', expression: '48 ÷ 6', answer: 8, difficulty: 3 },
      { id: 508, type: 'division', expression: '64 ÷ 8', answer: 8, difficulty: 3 },
      { id: 509, type: 'division', expression: '56 ÷ 7', answer: 8, difficulty: 3 },
      { id: 510, type: 'division', expression: '81 ÷ 9', answer: 9, difficulty: 3 }
    ]
  },
  {
    id: 6,
    name: '混合篇',
    description: '加减乘除混合运算',
    difficulty: 'hard',
    requiredScore: 75,
    timeLimit: 150,
    questions: [
      { id: 601, type: 'mixed', expression: '25 + 18 × 2', answer: 61, difficulty: 4 },
      { id: 602, type: 'mixed', expression: '56 - 24 ÷ 3', answer: 48, difficulty: 4 },
      { id: 603, type: 'mixed', expression: '3 × (12 + 8)', answer: 60, difficulty: 4 },
      { id: 604, type: 'mixed', expression: '100 - 35 + 20', answer: 85, difficulty: 3 },
      { id: 605, type: 'mixed', expression: '45 ÷ 9 × 6', answer: 30, difficulty: 3 },
      { id: 606, type: 'mixed', expression: '7 × 8 - 30', answer: 26, difficulty: 4 },
      { id: 607, type: 'mixed', expression: '63 ÷ 7 + 25', answer: 34, difficulty: 3 },
      { id: 608, type: 'mixed', expression: '(48 - 18) ÷ 5', answer: 6, difficulty: 4 },
      { id: 609, type: 'mixed', expression: '15 × 4 + 28', answer: 88, difficulty: 4 },
      { id: 610, type: 'mixed', expression: '90 - 12 × 6', answer: 18, difficulty: 4 }
    ]
  },
  {
    id: 7,
    name: '高级篇',
    description: '三位数加减法，心算进阶',
    difficulty: 'hard',
    requiredScore: 80,
    timeLimit: 150,
    questions: [
      { id: 701, type: 'addition', expression: '345 + 678', answer: 1023, difficulty: 5 },
      { id: 702, type: 'addition', expression: '567 + 890', answer: 1457, difficulty: 5 },
      { id: 703, type: 'addition', expression: '789 + 234', answer: 1023, difficulty: 5 },
      { id: 704, type: 'subtraction', expression: '1000 - 345', answer: 655, difficulty: 5 },
      { id: 705, type: 'subtraction', expression: '1567 - 890', answer: 677, difficulty: 5 },
      { id: 706, type: 'subtraction', expression: '2000 - 1234', answer: 766, difficulty: 5 },
      { id: 707, type: 'addition', expression: '1234 + 567', answer: 1801, difficulty: 5 },
      { id: 708, type: 'subtraction', expression: '1800 - 756', answer: 1044, difficulty: 5 },
      { id: 709, type: 'addition', expression: '876 + 543', answer: 1419, difficulty: 5 },
      { id: 710, type: 'subtraction', expression: '1400 - 678', answer: 722, difficulty: 5 }
    ]
  },
  {
    id: 8,
    name: '专家篇',
    description: '多位数混合运算，终极挑战',
    difficulty: 'expert',
    requiredScore: 85,
    timeLimit: 120,
    questions: [
      { id: 801, type: 'mixed', expression: '123 × 4 + 567', answer: 1059, difficulty: 6 },
      { id: 802, type: 'mixed', expression: '890 - 456 ÷ 6', answer: 814, difficulty: 6 },
      { id: 803, type: 'mixed', expression: '56 × (78 - 45)', answer: 1848, difficulty: 6 },
      { id: 804, type: 'mixed', expression: '1234 + 567 - 890', answer: 911, difficulty: 5 },
      { id: 805, type: 'mixed', expression: '789 ÷ 3 × 12', answer: 3156, difficulty: 6 },
      { id: 806, type: 'mixed', expression: '234 × 5 - 678', answer: 492, difficulty: 6 },
      { id: 807, type: 'mixed', expression: '987 ÷ 7 + 654', answer: 795, difficulty: 6 },
      { id: 808, type: 'mixed', expression: '(567 + 890) ÷ 13', answer: 112.0769, difficulty: 6 },
      { id: 809, type: 'mixed', expression: '1234 × 2 + 5678', answer: 8146, difficulty: 6 },
      { id: 810, type: 'mixed', expression: '9999 - 1234 × 7', answer: 1481, difficulty: 6 }
    ]
  }
]

export function getLevelById(id: number): Level | undefined {
  return levels.find(l => l.id === id)
}

export function getUnlockedLevels(maxLevel: number): Level[] {
  return levels.filter(l => l.id <= maxLevel)
}
