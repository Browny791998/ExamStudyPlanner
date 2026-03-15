export interface IMockQuestion {
  _id: string;
  mockTestId: string;
  type: "multiple-choice" | "fill-blank" | "true-false" | "word-order";
  prompt: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
  order: number;
}

export interface IMockTestQuestion {
  questionId: string;
  order: number;
  userAnswer: string | string[] | null;
  isCorrect: boolean | null;
  pointsEarned: number;
  timeSpentSecs: number;
  flagged: boolean;
}

export interface IMockTest {
  _id: string;
  userId: string;
  planId: string;
  taskId?: string;
  examType: 'IELTS' | 'TOEFL' | 'JLPT' | 'SAT';
  testMode: 'full' | 'section' | 'drill';
  section?: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  questions: IMockTestQuestion[];
  startedAt: string;
  completedAt: string | null;
  timeLimitMins: number;
  timeRemainingMins: number;
  totalPoints: number;
  earnedPoints: number;
  examSetId: string | null;
  examSetName: string | null;
  isScheduled: boolean;
  isRetake: boolean;
  createdAt: string;
  // populated
  populatedQuestions?: IQuestionFull[];
}

export interface IQuestionFull {
  _id: string;
  examType: string;
  section: string;
  questionType: string;
  difficulty: string;
  points: number;
  question: string;
  passage?: string;
  options?: string[];
  blanks?: { index: number; answer: string; hint?: string }[];
  words?: string[];
  correctAnswer?: string;
  correctOrder?: string[];
  matchingPairs?: { left: string; right: string }[];
  explanation: string;
  tags: string[];
}

export interface ISectionScore {
  section: string;
  score: number;
  maxScore: number;
  percentage: number;
  weakAreas: string[];
}

export interface IMockResult {
  _id: string;
  userId: string;
  planId: string;
  testId: string;
  examType: 'IELTS' | 'TOEFL' | 'JLPT' | 'SAT';
  testMode: 'full' | 'section' | 'drill';
  totalScore: number;
  scaledScore: string;
  sectionScores: ISectionScore[];
  totalQuestions: number;
  correctAnswers: number;
  timeTakenMins: number;
  weakAreas: string[];
  strongAreas: string[];
  recommendations: string[];
  createdAt: string;
}

export interface IMilestone {
  _id: string;
  planId: string;
  userId: string;
  title: string;
  description: string;
  weekNumber: number;
  targetDate: string;
  achieved: boolean;
  achievedAt: string | null;
  createdAt: string;
}
