// Quiz Types
export interface Quiz {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  pointsAvailable: number;
  estimatedTime: string;
  imageUrl?: string;
  status: string;
  createdAt: string;
}

export interface QuizQuestion {
  id: number;
  quizId: number;
  question: string;
  options: string[];
  order: number;
  points: number;
}

export interface UserQuiz {
  id: number;
  userId: number;
  quizId: number;
  status: string;
  score: number;
  maxScore: number;
  pointsEarned: number;
  completedAt?: string;
  answers?: Answer[];
}

export interface Answer {
  questionId: number;
  selectedOptionIndex: number;
}

export interface QuizQuestionResult {
  questionId: number;
  question: string;
  options: string[];
  selectedOptionIndex: number;
  correctOptionIndex: number;
  isCorrect: boolean;
  explanation: string;
  points: number;
}

export interface QuizResult {
  userQuizId: number;
  score: number;
  maxScore: number;
  pointsEarned: number;
  completedAt: string;
  results: QuizQuestionResult[];
}