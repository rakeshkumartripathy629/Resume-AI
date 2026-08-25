import type { ResumeContent } from '../types/resume'
import type { TailoredResume } from '../types/tailor'

export function contentToTailoredResume(content: ResumeContent): TailoredResume {
  const pi = content.personalInfo
  return {
    contact: {
      fullName: pi.fullName,
      email: pi.email,
      phone: pi.phone,
      location: pi.location,
      linkedin: pi.linkedin,
      portfolio: pi.portfolio,
    },
    summary: pi.summary,
    skills: content.skills,
    experience: content.experience.map((exp) => ({
      role: exp.role,
      company: exp.company,
      startDate: exp.startDate,
      endDate: exp.current ? '' : exp.endDate,
      current: exp.current,
      bullets: exp.bullets.filter((b) => b.trim()),
    })),
    education: content.education.map((edu) => ({
      institution: edu.institution,
      degree: edu.degree,
      field: edu.field,
      startDate: edu.startDate,
      endDate: edu.endDate,
      grade: edu.grade,
    })),
    projects: (content.projects ?? []).map((proj) => ({
      name: proj.name,
      description: proj.description,
      tech: proj.tech ?? [],
    })),
    certifications: (content.certifications ?? []).map((cert) => ({
      name: cert.name,
      issuer: cert.issuer,
      date: cert.date,
    })),
  }
}
