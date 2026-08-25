import mongoose, { Schema, type Document } from 'mongoose';

export interface ITailoredResume extends Document {
  userId: string;
  originalResumeText: string;
  jobDescription: string;
  jobTitle: string;
  company: string;
  tailoredResume: Record<string, unknown>;
  atsScore: number;
  atsBreakdown: Record<string, number>;
  matchedKeywords: string[];
  aiModel: string;
  createdAt: Date;
}

const tailoredResumeSchema = new Schema<ITailoredResume>(
  {
    userId: { type: String, required: true, index: true },
    originalResumeText: { type: String, required: true },
    jobDescription: { type: String, required: true },
    jobTitle: { type: String, default: '' },
    company: { type: String, default: '' },
    tailoredResume: { type: Schema.Types.Mixed, required: true },
    atsScore: { type: Number, required: true },
    atsBreakdown: { type: Schema.Types.Mixed, required: true },
    matchedKeywords: [{ type: String }],
    aiModel: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

tailoredResumeSchema.set('toJSON', {
  transform(_doc, ret) {
    ret.id = ret._id?.toString?.() ?? '';
    return ret;
  },
});

export const TailoredResumeModel =
  mongoose.models.TailoredResume ||
  mongoose.model<ITailoredResume>('TailoredResume', tailoredResumeSchema);
