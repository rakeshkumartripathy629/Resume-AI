import { model, Schema, Types } from 'mongoose';

export interface IScoreResult {
  userId: string;
  jobTitle: string;
  company: string;
  resumeExcerpt: string;
  result: {
    overallScore: number;
    categoryScores: {
      keywordMatch: number;
      skillsRelevance: number;
      experienceImpact: number;
      formattingClarity: number;
    };
    summary: string;
    strengths: string[];
    improvements: string[];
    missingKeywords: string[];
    verdict: 'strong_match' | 'good' | 'needs_work' | 'poor';
  };
  resumeRef?: Types.ObjectId;
  model: string;
  createdAt: Date;
}

const scoreResultSchema = new Schema<IScoreResult>(
  {
    userId: { type: String, required: true, index: true },
    jobTitle: { type: String, default: '' },
    company: { type: String, default: '' },
    resumeExcerpt: { type: String, default: '' },
    result: {
      overallScore: { type: Number, required: true },
      categoryScores: {
        keywordMatch: { type: Number, required: true },
        skillsRelevance: { type: Number, required: true },
        experienceImpact: { type: Number, required: true },
        formattingClarity: { type: Number, required: true },
      },
      summary: { type: String, default: '' },
      strengths: { type: [String], default: [] },
      improvements: { type: [String], default: [] },
      missingKeywords: { type: [String], default: [] },
      verdict: {
        type: String,
        enum: ['strong_match', 'good', 'needs_work', 'poor'],
        required: true,
      },
    },
    resumeRef: { type: Schema.Types.ObjectId, ref: 'Resume', default: null },
    model: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ScoreResultModel = model<IScoreResult>('ScoreResult', scoreResultSchema);
