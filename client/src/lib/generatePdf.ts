import { api } from './api'
import type { TailoredResume } from '../types/tailor'

export async function generateResumePdf(resume: TailoredResume, filename?: string): Promise<void> {
  const response = await api.post('/agent/generate-pdf', { resume }, {
    responseType: 'blob',
  })

  const blob = new Blob([response.data], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename ?? `${(resume.contact?.fullName || 'Resume').replace(/\s+/g, '_')}_Resume.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
