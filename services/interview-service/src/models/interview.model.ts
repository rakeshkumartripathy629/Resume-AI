import { model, Schema } from 'mongoose';

export type QuestionType = 'technical' | 'behavioral' | 'situational';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type InterviewStatus = 'in_progress' | 'completed';

export interface IQuestion {
  text: string;
  type: QuestionType;
}

export interface IEvaluation {
  score: number;
  strengths: string[];
  gaps: string[];
  modelAnswerHint: string;
}

export interface IInterview {
  userId: string;
  role: string;
  difficulty: Difficulty;
  jdText: string;
  status: InterviewStatus;
  questions: IQuestion[];
  answers: { questionIndex: number; text: string; submittedAt: Date }[];
  evaluations: (IEvaluation | null)[];
  currentQuestionIndex: number;
  report: IReport | null;
  createdAt: Date;
  completedAt?: Date;
}

export interface ICompetencyScores {
  technical: number;
  communication: number;
  problemSolving: number;
  confidence: number;
}

export interface IReport {
  overallScore: number;
  band: 'excellent' | 'good' | 'average' | 'needs_improvement';
  summary: string;
  competencyScores: ICompetencyScores;
  strengths: string[];
  improvements: string[];
}

const questionSchema = new Schema<IQuestion>(
  { text: { type: String, required: true }, type: { type: String, required: true } },
  { _id: false }
);

const evaluationSchema = new Schema<IEvaluation>(
  {
    score: { type: Number, required: true },
    strengths: { type: [String], default: [] },
    gaps: { type: [String], default: [] },
    modelAnswerHint: { type: String, default: '' },
  },
  { _id: false }
);

const reportSchema = new Schema<IReport>(
  {
    overallScore: { type: Number, required: true },
    band: {
      type: String,
      enum: ['excellent', 'good', 'average', 'needs_improvement'],
      required: true,
    },
    summary: { type: String, required: true },
    competencyScores: {
      technical: { type: Number, required: true },
      communication: { type: Number, required: true },
      problemSolving: { type: Number, required: true },
      confidence: { type: Number, required: true },
    },
    strengths: { type: [String], default: [] },
    improvements: { type: [String], default: [] },
  },
  { _id: false }
);

const interviewSchema = new Schema<IInterview>(
  {
    userId: { type: String, required: true, index: true },
    role: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    jdText: { type: String, default: '' },
    status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
    questions: { type: [questionSchema], default: [] },
    answers: {
      type: [
        new Schema(
          {
            questionIndex: { type: Number, required: true },
            text: { type: String, required: true },
            submittedAt: { type: Date, default: Date.now },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    evaluations: { type: [evaluationSchema], default: [] },
    currentQuestionIndex: { type: Number, default: 0 },
    report: { type: reportSchema, default: null },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

interviewSchema.set('toJSON', {
  transform(_doc, ret) {
    const plain = ret as unknown as Record<string, unknown>;
    plain.id = (ret._id as { toString(): string }).toString();
    delete plain._id;
    delete plain.__v;
    return plain;
  },
});

export const Interview = model<IInterview>('Interview', interviewSchema);
