import { model, Schema } from 'mongoose';

export interface IRoadmapPhase {
  title: string;
  duration: string;
  skills: string[];
  milestones: string[];
  resources: { title: string; type: 'course' | 'book' | 'docs' | 'project' | 'other' }[];
}

export interface IRoadmap {
  userId: string;
  targetRole: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  currentSkills: string[];
  summary: string;
  gapAnalysis: {
    matchingSkills: string[];
    missingSkills: string[];
    notes: string;
  };
  phases: IRoadmapPhase[];
  createdAt: Date;
}

const resourceSchema = new Schema(
  {
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ['course', 'book', 'docs', 'project', 'other'],
      default: 'other',
    },
  },
  { _id: false }
);

const phaseSchema = new Schema<IRoadmapPhase>(
  {
    title: { type: String, required: true },
    duration: { type: String, required: true },
    skills: { type: [String], default: [] },
    milestones: { type: [String], default: [] },
    resources: { type: [resourceSchema], default: [] },
  },
  { _id: false }
);

const roadmapSchema = new Schema<IRoadmap>(
  {
    userId: { type: String, required: true, index: true },
    targetRole: { type: String, required: true },
    experienceLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    currentSkills: { type: [String], default: [] },
    summary: { type: String, required: true },
    gapAnalysis: {
      matchingSkills: { type: [String], default: [] },
      missingSkills: { type: [String], default: [] },
      notes: { type: String, default: '' },
    },
    phases: { type: [phaseSchema], default: [] },
  },
  { timestamps: true }
);

roadmapSchema.set('toJSON', {
  transform(_doc, ret) {
    const plain = ret as unknown as Record<string, unknown>;
    plain.id = (ret._id as { toString(): string }).toString();
    delete plain._id;
    delete plain.__v;
    return plain;
  },
});

export const Roadmap = model<IRoadmap>('Roadmap', roadmapSchema);
