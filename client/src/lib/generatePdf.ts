import PDFDocument from 'pdfkit'
import type { TailoredResume } from '../types/tailor'

const FONT_SIZE = 11
const HEADING_SIZE = 14
const SECTION_SIZE = 12
const MARGIN = 50
const LINE_HEIGHT = 15

function addSection(doc: PDFKit.PDFDocument, title: string, y: number): number {
  if (y > 720) {
    doc.addPage()
    y = MARGIN
  }
  doc
    .fontSize(SECTION_SIZE)
    .font('Helvetica-Bold')
    .fillColor('#1e293b')
    .text(title, MARGIN, y)
  y += SECTION_SIZE + 4
  doc.moveTo(MARGIN, y).lineTo(545, y).strokeColor('#cbd5e1').lineWidth(0.5).stroke()
  y += 8
  return y
}

export function generateResumePdf(resume: TailoredResume, filename?: string): void {
  const doc = new PDFDocument({ size: 'A4', margin: MARGIN, bufferPages: true })
  const chunks: Uint8Array[] = []

  doc.on('data', (chunk: Uint8Array) => chunks.push(chunk))

  doc.on('end', () => {
    const blob = new Blob([Buffer.concat(chunks)], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename ?? `${resume.contact.fullName.replace(/\s+/g, '_')}_Resume.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  })

  let y = MARGIN

  doc
    .fontSize(HEADING_SIZE + 4)
    .font('Helvetica-Bold')
    .fillColor('#0f172a')
    .text(resume.contact.fullName, MARGIN, y, { align: 'center' })
  y += HEADING_SIZE + 8

  const contactLine = [resume.contact.email, resume.contact.phone, resume.contact.location]
    .filter(Boolean)
    .join('  |  ')
  doc.fontSize(9).font('Helvetica').fillColor('#64748b').text(contactLine, MARGIN, y, {
    align: 'center',
  })
  y += 16

  if (resume.summary) {
    y = addSection(doc, 'PROFESSIONAL SUMMARY', y)
    doc
      .fontSize(FONT_SIZE)
      .font('Helvetica')
      .fillColor('#334155')
      .text(resume.summary, MARGIN, y, { width: 495, lineGap: 2 })
    y += doc.heightOfString(resume.summary, { width: 495 }) + 12
  }

  if (resume.skills.length > 0) {
    y = addSection(doc, 'SKILLS', y)
    doc
      .fontSize(FONT_SIZE)
      .font('Helvetica')
      .fillColor('#334155')
      .text(resume.skills.join('  •  '), MARGIN, y, { width: 495, lineGap: 2 })
    y += doc.heightOfString(resume.skills.join('  •  '), { width: 495 }) + 12
  }

  if (resume.experience.length > 0) {
    y = addSection(doc, 'EXPERIENCE', y)
    for (const exp of resume.experience) {
      if (y > 720) { doc.addPage(); y = MARGIN }
      doc
        .fontSize(FONT_SIZE)
        .font('Helvetica-Bold')
        .fillColor('#1e293b')
        .text(exp.role, MARGIN, y)
      const dateStr = [exp.startDate, exp.endDate || 'Present'].filter(Boolean).join(' – ')
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#64748b')
        .text(dateStr, 400, y, { align: 'right', width: 145 })
      y += LINE_HEIGHT
      doc
        .fontSize(FONT_SIZE - 1)
        .font('Helvetica-Oblique')
        .fillColor('#475569')
        .text(exp.company, MARGIN, y)
      y += LINE_HEIGHT
      for (const bullet of exp.bullets) {
        if (y > 750) { doc.addPage(); y = MARGIN }
        doc
          .fontSize(FONT_SIZE - 1)
          .font('Helvetica')
          .fillColor('#334155')
          .text(`•  ${bullet}`, MARGIN + 8, y, { width: 487, lineGap: 1 })
        y += doc.heightOfString(`•  ${bullet}`, { width: 487 }) + 3
      }
      y += 8
    }
  }

  if (resume.education.length > 0) {
    y = addSection(doc, 'EDUCATION', y)
    for (const edu of resume.education) {
      if (y > 720) { doc.addPage(); y = MARGIN }
      doc
        .fontSize(FONT_SIZE)
        .font('Helvetica-Bold')
        .fillColor('#1e293b')
        .text(`${edu.degree} in ${edu.field}`, MARGIN, y)
      const dateStr = [edu.startDate, edu.endDate].filter(Boolean).join(' – ')
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#64748b')
        .text(dateStr, 400, y, { align: 'right', width: 145 })
      y += LINE_HEIGHT
      doc
        .fontSize(FONT_SIZE - 1)
        .font('Helvetica-Oblique')
        .fillColor('#475569')
        .text(edu.institution, MARGIN, y)
      y += LINE_HEIGHT + 4
    }
  }

  if (resume.projects.length > 0) {
    y = addSection(doc, 'PROJECTS', y)
    for (const proj of resume.projects) {
      if (y > 720) { doc.addPage(); y = MARGIN }
      doc
        .fontSize(FONT_SIZE)
        .font('Helvetica-Bold')
        .fillColor('#1e293b')
        .text(proj.name, MARGIN, y)
      y += LINE_HEIGHT
      doc
        .fontSize(FONT_SIZE - 1)
        .font('Helvetica')
        .fillColor('#334155')
        .text(proj.description, MARGIN, y, { width: 495, lineGap: 1 })
      y += doc.heightOfString(proj.description, { width: 495 }) + 3
      if (proj.tech.length > 0) {
        doc
          .fontSize(9)
          .font('Helvetica-Oblique')
          .fillColor('#64748b')
          .text(proj.tech.join(', '), MARGIN, y)
        y += 14
      }
      y += 4
    }
  }

  if (resume.certifications.length > 0) {
    y = addSection(doc, 'CERTIFICATIONS', y)
    for (const cert of resume.certifications) {
      if (y > 720) { doc.addPage(); y = MARGIN }
      doc
        .fontSize(FONT_SIZE)
        .font('Helvetica')
        .fillColor('#334155')
        .text(`${cert.name}  —  ${cert.issuer}`, MARGIN, y)
      y += LINE_HEIGHT
    }
  }

  doc.end()
}
