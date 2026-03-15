export type StandardExamType = "IELTS" | "TOEFL" | "JLPT" | "SAT";
export type ExamType = StandardExamType | (string & {});
export type QuestionType =
  | "multiple_choice"
  | "fill_blank"
  | "true_false_ng"
  | "word_order"
  | "matching"
  | "essay"
  | "grid_in";
export type Difficulty = "easy" | "medium" | "hard";

export interface IBlank {
  index: number;
  answer: string;
  hint?: string;
}

export interface IMatchingPair {
  left: string;
  right: string;
}

export interface IQuestion {
  _id: string;
  examType: ExamType;
  section: string;
  questionType: QuestionType;
  difficulty: Difficulty;
  points: number;
  question: string;
  passage?: string;
  options?: string[];
  blanks?: IBlank[];
  words?: string[];
  correctAnswer?: string;
  correctOrder?: string[];
  matchingPairs?: IMatchingPair[];
  explanation: string;
  tags: string[];
  createdBy: string;
  isCustom: boolean;
  isDeleted: boolean;
  visibility: "public" | "private";
  createdAt: string;
  updatedAt: string;
}
