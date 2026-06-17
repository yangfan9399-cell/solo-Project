import type { PracticePack, Question } from '~/types'

const additionQuestions: Question[] = [
  { id: 1, type: 'addition', expression: '12 + 34', answer: 46, difficulty: 2 },
  { id: 2, type: 'addition', expression: '56 + 78', answer: 134, difficulty: 3 },
  { id: 3, type: 'addition', expression: '90 + 23', answer: 113, difficulty: 2 },
  { id: 4, type: 'addition', expression: '123 + 456', answer: 579, difficulty: 4 },
  { id: 5, type: 'addition', expression: '789 + 101', answer: 890, difficulty: 4 },
  { id: 6, type: 'addition', expression: '25 + 75', answer: 100, difficulty: 2 },
  { id: 7, type: 'addition', expression: '156 + 345', answer: 501, difficulty: 4 },
  { id: 8, type: 'addition', expression: '678 + 234', answer: 912, difficulty: 4 },
  { id: 9, type: 'addition', expression: '45 + 55', answer: 100, difficulty: 2 },
  { id: 10, type: 'addition', expression: '890 + 123', answer: 1013, difficulty: 5 }
]

const subtractionQuestions: Question[] = [
  { id: 11, type: 'subtraction', expression: '56 - 23', answer: 33, difficulty: 2 },
  { id: 12, type: 'subtraction', expression: '123 - 45', answer: 78, difficulty: 3 },
  { id: 13, type: 'subtraction', expression: '200 - 87', answer: 113, difficulty: 3 },
  { id: 14, type: 'subtraction', expression: '456 - 123', answer: 333, difficulty: 4 },
  { id: 15, type: 'subtraction', expression: '789 - 345', answer: 444, difficulty: 4 },
  { id: 16, type: 'subtraction', expression: '100 - 25', answer: 75, difficulty: 2 },
  { id: 17, type: 'subtraction', expression: '500 - 167', answer: 333, difficulty: 4 },
  { id: 18, type: 'subtraction', expression: '800 - 456', answer: 344, difficulty: 4 },
  { id: 19, type: 'subtraction', expression: '67 - 38', answer: 29, difficulty: 2 },
  { id: 20, type: 'subtraction', expression: '1000 - 567', answer: 433, difficulty: 5 }
]

const multiplicationQuestions: Question[] = [
  { id: 21, type: 'multiplication', expression: '12 × 5', answer: 60, difficulty: 2 },
  { id: 22, type: 'multiplication', expression: '15 × 8', answer: 120, difficulty: 3 },
  { id: 23, type: 'multiplication', expression: '25 × 4', answer: 100, difficulty: 3 },
  { id: 24, type: 'multiplication', expression: '36 × 3', answer: 108, difficulty: 3 },
  { id: 25, type: 'multiplication', expression: '45 × 6', answer: 270, difficulty: 4 },
  { id: 26, type: 'multiplication', expression: '12 × 12', answer: 144, difficulty: 4 },
  { id: 27, type: 'multiplication', expression: '18 × 15', answer: 270, difficulty: 4 },
  { id: 28, type: 'multiplication', expression: '24 × 20', answer: 480, difficulty: 4 },
  { id: 29, type: 'multiplication', expression: '35 × 12', answer: 420, difficulty: 5 },
  { id: 30, type: 'multiplication', expression: '48 × 15', answer: 720, difficulty: 5 }
]

const divisionQuestions: Question[] = [
  { id: 31, type: 'division', expression: '60 ÷ 5', answer: 12, difficulty: 2 },
  { id: 32, type: 'division', expression: '120 ÷ 8', answer: 15, difficulty: 3 },
  { id: 33, type: 'division', expression: '100 ÷ 4', answer: 25, difficulty: 3 },
  { id: 34, type: 'division', expression: '108 ÷ 3', answer: 36, difficulty: 3 },
  { id: 35, type: 'division', expression: '270 ÷ 6', answer: 45, difficulty: 4 },
  { id: 36, type: 'division', expression: '144 ÷ 12', answer: 12, difficulty: 4 },
  { id: 37, type: 'division', expression: '270 ÷ 15', answer: 18, difficulty: 4 },
  { id: 38, type: 'division', expression: '480 ÷ 20', answer: 24, difficulty: 4 },
  { id: 39, type: 'division', expression: '420 ÷ 12', answer: 35, difficulty: 5 },
  { id: 40, type: 'division', expression: '720 ÷ 15', answer: 48, difficulty: 5 }
]

const mixedQuestions: Question[] = [
  { id: 41, type: 'mixed', expression: '12 + 34 × 2', answer: 80, difficulty: 4 },
  { id: 42, type: 'mixed', expression: '56 - 24 ÷ 3', answer: 48, difficulty: 4 },
  { id: 43, type: 'mixed', expression: '100 - 35 + 20', answer: 85, difficulty: 3 },
  { id: 44, type: 'mixed', expression: '45 × 2 - 30', answer: 60, difficulty: 4 },
  { id: 45, type: 'mixed', expression: '78 ÷ 3 + 25', answer: 51, difficulty: 4 },
  { id: 46, type: 'mixed', expression: '(56 + 44) ÷ 10', answer: 10, difficulty: 4 },
  { id: 47, type: 'mixed', expression: '12 × 5 + 35', answer: 95, difficulty: 4 },
  { id: 48, type: 'mixed', expression: '200 - 45 × 4', answer: 20, difficulty: 5 },
  { id: 49, type: 'mixed', expression: '67 + 89 - 56', answer: 100, difficulty: 3 },
  { id: 50, type: 'mixed', expression: '123 × 2 - 45', answer: 201, difficulty: 5 }
]

export const practicePacks: PracticePack[] = [
  {
    id: 'add-1',
    name: '加法特训',
    description: '专注练习加法运算，提升心算速度',
    questions: additionQuestions,
    category: 'addition'
  },
  {
    id: 'sub-1',
    name: '减法特训',
    description: '专注练习减法运算，强化借位技巧',
    questions: subtractionQuestions,
    category: 'subtraction'
  },
  {
    id: 'mul-1',
    name: '乘法特训',
    description: '专注练习乘法运算，巩固乘法口诀',
    questions: multiplicationQuestions,
    category: 'multiplication'
  },
  {
    id: 'div-1',
    name: '除法特训',
    description: '专注练习除法运算，掌握除法技巧',
    questions: divisionQuestions,
    category: 'division'
  },
  {
    id: 'mix-1',
    name: '混合运算',
    description: '综合练习加减乘除，提升综合能力',
    questions: mixedQuestions,
    category: 'mixed'
  }
]

export function getPracticePackById(id: string): PracticePack | undefined {
  return practicePacks.find(p => p.id === id)
}

export function getPracticePacksByCategory(category: PracticePack['category']): PracticePack[] {
  return practicePacks.filter(p => p.category === category)
}
