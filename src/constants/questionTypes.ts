import type { IMockQuestion } from "@/types/mockTest";

export const QUESTION_TYPES: { value: IMockQuestion["type"]; label: string }[] = [
  { value: "multiple-choice", label: "Multiple Choice" },
  { value: "fill-blank", label: "Fill in the Blank" },
  { value: "true-false", label: "True / False" },
  { value: "word-order", label: "Word Order" },
];

export const TEST_CONFIG = {
  IELTS: {
    full:    { questions: 40, timeMins: 180 },
    section: { questions: 13, timeMins: 60  },
    drill:   { questions: 10, timeMins: 20  },
    sections: ['Reading', 'Listening', 'Writing']
  },
  TOEFL: {
    full:    { questions: 54, timeMins: 210 },
    section: { questions: 18, timeMins: 70  },
    drill:   { questions: 10, timeMins: 20  },
    sections: ['Reading', 'Listening', 'Speaking', 'Writing']
  },
  JLPT: {
    full:    { questions: 55, timeMins: 150 },
    section: { questions: 20, timeMins: 50  },
    drill:   { questions: 10, timeMins: 20  },
    sections: ['Vocabulary', 'Grammar', 'Reading', 'Listening']
  },
  SAT: {
    full:    { questions: 54, timeMins: 180 },
    section: { questions: 27, timeMins: 70  },
    drill:   { questions: 10, timeMins: 20  },
    sections: ['Reading & Writing', 'Math']
  }
} as const;

export type ExamTypeKey = keyof typeof TEST_CONFIG;
export type TestMode = 'full' | 'section' | 'drill';

export const SCORE_SCALING = {
  IELTS: [
    { minPct: 0,  maxPct: 40, band: '4.0' },
    { minPct: 40, maxPct: 50, band: '5.0' },
    { minPct: 50, maxPct: 60, band: '5.5' },
    { minPct: 60, maxPct: 70, band: '6.0' },
    { minPct: 70, maxPct: 80, band: '6.5' },
    { minPct: 80, maxPct: 90, band: '7.0' },
    { minPct: 90, maxPct: 95, band: '7.5' },
    { minPct: 95, maxPct: 99, band: '8.0' },
    { minPct: 99, maxPct: 101, band: '9.0' },
  ]
};

// Exam Set configuration: how many questions per section per difficulty
export const EXAM_SET_CONFIG = {
  IELTS: {
    sections: ['Reading', 'Listening', 'Writing'],
    full:    { questions: 40, timeMins: 180 },
    section: { questions: 13, timeMins: 60  },
  },
  TOEFL: {
    sections: ['Reading', 'Listening', 'Speaking', 'Writing'],
    full:    { questions: 54, timeMins: 210 },
    section: { questions: 18, timeMins: 70  },
  },
  JLPT: {
    sections: ['Vocabulary', 'Grammar', 'Reading', 'Listening'],
    full:    { questions: 55, timeMins: 150 },
    section: { questions: 20, timeMins: 50  },
  },
  SAT: {
    sections: ['Reading & Writing', 'Math'],
    full:    { questions: 54, timeMins: 180 },
    section: { questions: 27, timeMins: 70  },
  },
} as const

// Which difficulty is used in which study week range (for plan generator)
export const DIFFICULTY_WEEK_MAP: { difficulty: 'easy' | 'medium' | 'hard'; weeksStart: number; weeksEnd: number }[] = [
  { difficulty: 'easy',   weeksStart: 1,  weeksEnd: 4  },
  { difficulty: 'medium', weeksStart: 5,  weeksEnd: 8  },
  { difficulty: 'hard',   weeksStart: 9,  weeksEnd: 13 },
]

export const WEAK_AREA_RECOMMENDATIONS: Record<string, string> = {
  'Reading':    'Practice skimming and scanning techniques daily',
  'Listening':  'Increase listening with native content 30 mins/day',
  'Writing':    'Focus on essay structure, coherence and cohesion',
  'Grammar':    'Review grammar rules with targeted drills',
  'Vocabulary': 'Use spaced repetition flashcards for new words',
  'Math':       'Practice timed problem sets and review formulas',
  'Speaking':   'Record and review your speaking responses daily',
};
