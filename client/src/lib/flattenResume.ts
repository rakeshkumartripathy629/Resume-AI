import type { ResumeContent } from '../types/resume'

export function flattenResumeContent(content: ResumeContent): string {
  const parts: string[] = []
  const info = content.personalInfo

  if (info.fullName) parts.push(info.fullName)
  if (info.email) parts.push(info.email)
  if (info.phone) parts.push(info.phone)
  if (info.location) parts.push(info.location)
  if (info.linkedin) parts.push(info.linkedin)
  if (info.portfolio) parts.push(info.portfolio)

  if (info.summary) parts.push(`\nSummary\n${info.summary}`)

  if (content.experience.length > 0) {
    parts.push('\nExperience')
    for (const exp of content.experience) {
      const header = [exp.role, exp.company].filter(Boolean).join(' at ')
      if (header) parts.push(header)
      for (const bullet of exp.bullets) {
        if (bullet.trim()) parts.push(`- ${bullet.trim()}`)
      }
    }
  }

  if (content.education.length > 0) {
    parts.push('\nEducation')
    for (const edu of content.education) {
      const line = [edu.degree, edu.field, edu.institution].filter(Boolean).join(', ')
      if (line) parts.push(line)
    }
  }

  if (content.skills.length > 0) {
    parts.push(`\nSkills\n${content.skills.join(', ')}`)
  }

  if (content.projects && content.projects.length > 0) {
    parts.push('\nProjects')
    for (const proj of content.projects) {
      if (proj.name) parts.push(proj.name)
      if (proj.description) parts.push(proj.description)
    }
  }

  if (content.certifications && content.certifications.length > 0) {
    parts.push('\nCertifications')
    for (const cert of content.certifications) {
      const line = [cert.name, cert.issuer].filter(Boolean).join(', ')
      if (line) parts.push(line)
    }
  }

  return parts.join('\n')
}
