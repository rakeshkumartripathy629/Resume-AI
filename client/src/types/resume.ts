import type { ScoreResult } from './scoring'

export interface PersonalInfo {
  fullName: string
  email: string
  phone: string
  location: string
  linkedin: string
  portfolio: string
  summary: string
}

export interface ExperienceItem {
  company: string
  role: string
  startDate: string
  endDate: string
  current: boolean
  bullets: string[]
}

export interface EducationItem {
  institution: string
  degree: string
  field: string
  startDate: string
  endDate: string
  grade: string
}

export interface ProjectItem {
  name: string
  description: string
  link: string
  tech: string[]
}

export interface CertificationItem {
  name: string
  issuer: string
  date: string
}

export interface ResumeContent {
  personalInfo: PersonalInfo
  experience: ExperienceItem[]
  education: EducationItem[]
  skills: string[]
  projects: ProjectItem[]
  certifications: CertificationItem[]
}

export interface ResumeDocument {
  id: string
  title: string
  status: 'draft' | 'complete'
  content?: ResumeContent
  createdAt?: string
  updatedAt?: string
}

export const emptyPersonalInfo: PersonalInfo = {
  fullName: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  portfolio: '',
  summary: '',
}

export const emptyResumeContent: ResumeContent = {
  personalInfo: { ...emptyPersonalInfo },
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
}

// Re-export so feature code can import both from one place
export type { ScoreResult }
