import { model, Schema, Types } from 'mongoose';

export interface IResume {
  userId: string;
  title: string;
  status: 'draft' | 'complete';
  content: ResumeContent;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExperienceItem {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

export interface EducationItem {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  grade: string;
}

export interface ProjectItem {
  name: string;
  description: string;
  link: string;
  tech: string[];
}

export interface CertificationItem {
  name: string;
  issuer: string;
  date: string;
}

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  portfolio: string;
  summary: string;
}

export interface ResumeContent {
  personalInfo: PersonalInfo;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: string[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
}

const personalInfoSchema = new Schema<PersonalInfo>(
  {
    fullName: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    portfolio: { type: String, default: '' },
    summary: { type: String, default: '' },
  },
  { _id: false }
);

const experienceSchema = new Schema<ExperienceItem>(
  {
    company: { type: String, default: '' },
    role: { type: String, default: '' },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    current: { type: Boolean, default: false },
    bullets: { type: [String], default: [] },
  },
  { _id: false }
);

const educationSchema = new Schema<EducationItem>(
  {
    institution: { type: String, default: '' },
    degree: { type: String, default: '' },
    field: { type: String, default: '' },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    grade: { type: String, default: '' },
  },
  { _id: false }
);

const projectSchema = new Schema<ProjectItem>(
  {
    name: { type: String, default: '' },
    description: { type: String, default: '' },
    link: { type: String, default: '' },
    tech: { type: [String], default: [] },
  },
  { _id: false }
);

const certificationSchema = new Schema<CertificationItem>(
  {
    name: { type: String, default: '' },
    issuer: { type: String, default: '' },
    date: { type: String, default: '' },
  },
  { _id: false }
)

const resumeSchema = new Schema<IResume>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, default: 'Untitled resume' },
    status: { type: String, enum: ['draft', 'complete'], default: 'draft' },
    content: {
      personalInfo: { type: personalInfoSchema, default: () => ({}) },
      experience: { type: [experienceSchema], default: [] },
      education: { type: [educationSchema], default: [] },
      skills: { type: [String], default: [] },
      projects: { type: [projectSchema], default: [] },
      certifications: { type: [certificationSchema], default: [] },
    },
  },
  { timestamps: true }
);

resumeSchema.set('toJSON', {
  transform(_doc, ret) {
    const plain = ret as unknown as Record<string, unknown>;
    plain.id = (ret._id as Types.ObjectId).toString();
    delete plain._id;
    delete plain.__v;
    return plain;
  },
});

export const Resume = model<IResume>('Resume', resumeSchema);
