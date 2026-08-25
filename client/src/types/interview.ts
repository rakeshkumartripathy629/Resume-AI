export type QuestionType = 'technical' | 'behavioral' | 'situational'
export type Difficulty = 'easy' | 'medium' | 'hard'

export interface InterviewQuestion {
  text: string
  type: QuestionType
  targetSkill: string
}

export interface AnswerEvaluation {
  score: number
  strengths: string[]
  gaps: string[]
  modelAnswerHint: string
}

export interface SubmittedAnswer {
  questionIndex: number
  text: string
  submittedAt: string
}

export interface CompetencyScores {
  technical: number
  communication: number
  problemSolving: number
  confidence: number
}

export interface InterviewReport {
  overallScore: number
  band: 'excellent' | 'good' | 'average' | 'needs_improvement'
  summary: string
  competencyScores: CompetencyScores
  skillProficiencies: Record<string, number>
  strengths: string[]
  improvements: string[]
}

export interface Interview {
  id: string
  role: string
  difficulty: Difficulty
  status: 'in_progress' | 'completed'
  roadmapId: string | null
  missingSkills: string[]
  questionCount: number
  currentQuestionIndex: number
  questions: InterviewQuestion[]
  answers: SubmittedAnswer[]
  evaluations: (AnswerEvaluation | null)[]
  report: InterviewReport | null
  createdAt: string
  completedAt?: string | null
}

export const DIFFICULTY_META: Record<
  Difficulty,
  { label: string; description: string; icon: string }
> = {
  easy: { label: 'Easy', description: 'Fundamentals & core concepts', icon: '🌱' },
  medium: { label: 'Medium', description: 'Practical depth & tradeoffs', icon: '⚡' },
  hard: { label: 'Hard', description: 'System design & edge cases', icon: '🔥' },
}

export const QUESTION_TYPE_META: Record<QuestionType, { label: string; className: string }> = {
  technical: { label: 'Technical', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  behavioral: { label: 'Behavioral', className: 'bg-violet-50 text-violet-700 border-violet-200' },
  situational: { label: 'Situational', className: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' },
}
