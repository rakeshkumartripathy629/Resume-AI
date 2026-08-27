import { z } from 'zod';

// ── Shared building blocks ────────────────────────────────────────────────

const personalInfoSchema = z.object({
  fullName: z.string().max(100).optional().default(''),
  email: z.string().max(150).optional().default(''),
  phone: z.string().max(30).optional().default(''),
  location: z.string().max(100).optional().default(''),
  linkedin: z.string().max(200).optional().default(''),
  portfolio: z.string().max(200).optional().default(''),
  summary: z.string().max(2000).optional().default(''),
});

const experienceItemSchema = z.object({
  company: z.string().max(100).optional().default(''),
  role: z.string().max(100).optional().default(''),
  startDate: z.string().max(20).optional().default(''),
  endDate: z.string().max(20).optional().default(''),
  current: z.boolean().optional().default(false),
  bullets: z.array(z.string().max(500)).optional().default([]),
});

const educationItemSchema = z.object({
  institution: z.string().max(150).optional().default(''),
  degree: z.string().max(100).optional().default(''),
  field: z.string().max(100).optional().default(''),
  startDate: z.string().max(20).optional().default(''),
  endDate: z.string().max(20).optional().default(''),
  grade: z.string().max(30).optional().default(''),
});

const projectItemSchema = z.object({
  name: z.string().max(100).optional().default(''),
  description: z.string().max(1000).optional().default(''),
  link: z.string().max(300).optional().default(''),
  tech: z.array(z.string().max(50)).optional().default([]),
});

const certificationItemSchema = z.object({
  name: z.string().max(150).optional().default(''),
  issuer: z.string().max(150).optional().default(''),
  date: z.string().max(20).optional().default(''),
});

export const resumeContentSchema = z
  .object({
    personalInfo: personalInfoSchema.optional().default({}),
    experience: z.array(experienceItemSchema).max(30).optional().default([]),
    education: z.array(educationItemSchema).max(10).optional().default([]),
    skills: z.array(z.string().max(50)).max(100).optional().default([]),
    projects: z.array(projectItemSchema).max(20).optional().default([]),
    certifications: z.array(certificationItemSchema).max(20).optional().default([]),
  })
  .strict();

// ── Resume CRUD schemas ──────────────────────────────────────────────────

export const createResumeSchema = z
  .object({
    title: z.string().max(200).optional(),
    content: resumeContentSchema.optional(),
  })
  .strict();

export const updateResumeSchema = z
  .object({
    title: z.string().max(200).optional(),
    status: z.enum(['draft', 'complete']).optional(),
    content: resumeContentSchema.optional(),
  })
  .strict();

// ── Agent action schemas ─────────────────────────────────────────────────

export const scoreRequestSchema = z
  .object({
    resumeText: z
      .string()
      .min(80, 'resumeText must be at least 80 characters')
      .max(100_000, 'resumeText must not exceed 100,000 characters'),
    jobDescription: z
      .string()
      .min(40, 'jobDescription must be at least 40 characters')
      .max(50_000, 'jobDescription must not exceed 50,000 characters'),
  })
  .strict();

export const tailorRequestSchema = z
  .object({
    resumeText: z
      .string()
      .min(80, 'resumeText must be at least 80 characters')
      .max(100_000, 'resumeText must not exceed 100,000 characters'),
    jobDescription: z
      .string()
      .min(40, 'jobDescription must be at least 40 characters')
      .max(50_000, 'jobDescription must not exceed 50,000 characters'),
  })
  .strict();

// ── PDF export schema ────────────────────────────────────────────────────

const pdfContactSchema = z
  .object({
    fullName: z.string().max(100).optional(),
    email: z.string().max(150).optional(),
    phone: z.string().max(30).optional(),
    location: z.string().max(100).optional(),
    linkedin: z.string().max(200).optional(),
    portfolio: z.string().max(200).optional(),
  })
  .strict()
  .optional();

const pdfExperienceSchema = z
  .object({
    company: z.string().max(100).optional().default(''),
    role: z.string().max(100).optional().default(''),
    startDate: z.string().max(20).optional().default(''),
    endDate: z.string().max(20).optional().default(''),
    current: z.boolean().optional().default(false),
    bullets: z.array(z.string().max(500)).optional().default([]),
  })
  .strict();

const pdfEducationSchema = z
  .object({
    institution: z.string().max(150).optional().default(''),
    degree: z.string().max(100).optional().default(''),
    field: z.string().max(100).optional().default(''),
    startDate: z.string().max(20).optional().default(''),
    endDate: z.string().max(20).optional().default(''),
    grade: z.string().max(30).optional().default(''),
  })
  .strict();

const pdfProjectSchema = z
  .object({
    name: z.string().max(100).optional().default(''),
    description: z.string().max(1000).optional().default(''),
    link: z.string().max(300).optional().default(''),
    tech: z.array(z.string().max(50)).optional().default([]),
  })
  .strict();

const pdfCertSchema = z
  .object({
    name: z.string().max(150).optional().default(''),
    issuer: z.string().max(150).optional().default(''),
    date: z.string().max(20).optional().default(''),
  })
  .strict();

export const generatePdfSchema = z
  .object({
    resume: z
      .object({
        contact: pdfContactSchema,
        summary: z.string().max(2000).optional(),
        skills: z.array(z.string().max(50)).max(100).optional(),
        experience: z.array(pdfExperienceSchema).max(30).optional(),
        education: z.array(pdfEducationSchema).max(10).optional(),
        projects: z.array(pdfProjectSchema).max(20).optional(),
        certifications: z.array(pdfCertSchema).max(20).optional(),
      })
      .strict(),
  })
  .strict();

// ── Pagination query schema ──────────────────────────────────────────────

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});
