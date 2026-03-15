export const EXAM_TYPES = {
  IELTS: {
    label: 'IELTS',
    description: 'Academic English',
    scoreLabel: 'Target Band Score',
    scoreOptions: ['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0', '8.5', '9.0'],
    icon: '🎓',
  },
  TOEFL: {
    label: 'TOEFL iBT',
    description: 'University Prep',
    scoreLabel: 'Target Score',
    scoreOptions: ['60', '70', '80', '90', '100', '110', '120'],
    icon: '📝',
  },
  JLPT: {
    label: 'JLPT',
    description: 'Japanese Proficiency',
    scoreLabel: 'Target Level',
    scoreOptions: ['N5', 'N4', 'N3', 'N2', 'N1'],
    icon: '🇯🇵',
  },
  SAT: {
    label: 'SAT',
    description: 'College Admission',
    scoreLabel: 'Target Score',
    scoreOptions: ['1000', '1100', '1200', '1300', '1400', '1500', '1600'],
    icon: '📐',
  },
} as const

export type ExamTypeKey = keyof typeof EXAM_TYPES
