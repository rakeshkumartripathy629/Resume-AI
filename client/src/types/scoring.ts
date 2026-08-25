export interface CategoryScores {
  keywordMatch: number
  skillsRelevance: number
  experienceImpact: number
  formattingClarity: number
}

export type Verdict = 'strong_match' | 'good' | 'needs_work' | 'poor'

export interface ScoreResult {
  scoreId: string
  overallScore: number
  categoryScores: CategoryScores
  summary: string
  strengths: string[]
  improvements: string[]
  missingKeywords: string[]
  verdict: Verdict
  createdAt?: string
}

export const VERDICT_META: Record<Verdict, { label: string; classes: string }> = {
  strong_match: { label: 'Strong match', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  good: { label: 'Good', classes: 'bg-lime-50 text-lime-700 border-lime-200' },
  needs_work: { label: 'Needs work', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  poor: { label: 'Poor fit', classes: 'bg-red-50 text-red-700 border-red-200' },
}
