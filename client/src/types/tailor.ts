export interface TailoredContact {
  fullName: string
  email: string
  phone: string
  location: string
  linkedin: string
  portfolio: string
}

export interface TailoredExperience {
  role: string
  company: string
  startDate: string
  endDate: string
  current: boolean
  bullets: string[]
}

export interface TailoredEducation {
  institution: string
  degree: string
  field: string
  startDate: string
  endDate: string
  grade: string
}

export interface TailoredProject {
  name: string
  description: string
  tech: string[]
}

export interface TailoredCertification {
  name: string
  issuer: string
  date: string
}

export interface TailoredResume {
  contact: TailoredContact
  summary: string
  skills: string[]
  experience: TailoredExperience[]
  education: TailoredEducation[]
  projects: TailoredProject[]
  certifications: TailoredCertification[]
}

export interface ATSBreakdown {
  keywordMatch: number
  requiredSkills: number
  preferredSkills: number
  experienceRelevance: number
  jobTitleAlignment: number
  achievementRelevance: number
  atsFormatting: number
  resumeCompleteness: number
}

export interface ATSAnalysis {
  overallScore: number
  breakdown: ATSBreakdown
  matchedKeywords: string[]
  missingKeywords: Array<{ keyword: string; reason: string }>
  recommendations: string[]
}

export interface TailorResult {
  tailoredResume: TailoredResume
  atsAnalysis: ATSAnalysis
  originalSummary?: string
  tailoringNotes?: string[]
}
