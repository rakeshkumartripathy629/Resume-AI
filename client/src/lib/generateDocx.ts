import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  TabStopPosition,
  TabStopType,
  type ParagraphOptions,
} from 'docx'
import type { TailoredResume, TailoredExperience } from '../types/tailor'

function sectionHeading(title: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 80 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 4, color: '94a3b8' },
    },
    children: [
      new TextRun({
        text: title,
        bold: true,
        size: 22,
        font: 'Calibri',
        color: '1e293b',
      }),
    ],
  })
}

function bodyText(text: string, opts?: Partial<ParagraphOptions>): Paragraph {
  return new Paragraph({
    spacing: { after: 60 },
    ...opts,
    children: [
      new TextRun({
        text,
        size: 21,
        font: 'Calibri',
        color: '334155',
      }),
    ],
  })
}

function experienceParagraph(exp: TailoredExperience): Paragraph[] {
  const paras: Paragraph[] = []
  paras.push(
    new Paragraph({
      spacing: { before: 120, after: 20 },
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      children: [
        new TextRun({
          text: exp.role,
          bold: true,
          size: 21,
          font: 'Calibri',
          color: '1e293b',
        }),
        new TextRun({
          text: `\t${[exp.startDate, exp.endDate || 'Present'].filter(Boolean).join(' – ')}`,
          size: 18,
          font: 'Calibri',
          color: '64748b',
        }),
      ],
    })
  )
  paras.push(
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: exp.company,
          italics: true,
          size: 20,
          font: 'Calibri',
          color: '475569',
        }),
      ],
    })
  )
  for (const bullet of exp.bullets) {
    paras.push(
      new Paragraph({
        spacing: { after: 20 },
        indent: { left: 360, hanging: 180 },
        children: [
          new TextRun({
            text: `•  ${bullet}`,
            size: 21,
            font: 'Calibri',
            color: '334155',
          }),
        ],
      })
    )
  }
  return paras
}

export async function generateResumeDocx(
  resume: TailoredResume,
  filename?: string
): Promise<void> {
  const paras: Paragraph[] = []

  // Header — safe access
  const contact = resume.contact ?? { fullName: 'Resume', email: '', phone: '', location: '', linkedin: '', portfolio: '' }
  paras.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: contact.fullName || 'Resume',
          bold: true,
          size: 32,
          font: 'Calibri',
          color: '0f172a',
        }),
      ],
    })
  )
  const contactLine = [contact.email, contact.phone, contact.location]
    .filter(Boolean)
    .join('  |  ')
  paras.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: contactLine || ' ',
          size: 18,
          font: 'Calibri',
          color: '64748b',
        }),
      ],
    })
  )

  // Summary
  if (resume.summary) {
    paras.push(sectionHeading('PROFESSIONAL SUMMARY'))
    paras.push(bodyText(resume.summary))
  }

  // Skills
  if (resume.skills.length > 0) {
    paras.push(sectionHeading('SKILLS'))
    paras.push(bodyText(resume.skills.join('  •  ')))
  }

  // Experience
  if (resume.experience.length > 0) {
    paras.push(sectionHeading('EXPERIENCE'))
    for (const exp of resume.experience) {
      paras.push(...experienceParagraph(exp))
    }
  }

  // Education
  if (resume.education.length > 0) {
    paras.push(sectionHeading('EDUCATION'))
    for (const edu of resume.education) {
      paras.push(
        new Paragraph({
          spacing: { before: 100, after: 20 },
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          children: [
            new TextRun({
              text: `${edu.degree} in ${edu.field}`,
              bold: true,
              size: 21,
              font: 'Calibri',
              color: '1e293b',
            }),
            new TextRun({
              text: `\t${[edu.startDate, edu.endDate].filter(Boolean).join(' – ')}`,
              size: 18,
              font: 'Calibri',
              color: '64748b',
            }),
          ],
        })
      )
      paras.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: edu.institution,
              italics: true,
              size: 20,
              font: 'Calibri',
              color: '475569',
            }),
          ],
        })
      )
    }
  }

  // Projects
  if (resume.projects && resume.projects.length > 0) {
    paras.push(sectionHeading('PROJECTS'))
    for (const proj of resume.projects) {
      paras.push(
        new Paragraph({
          spacing: { before: 100, after: 20 },
          children: [
            new TextRun({
              text: proj.name,
              bold: true,
              size: 21,
              font: 'Calibri',
              color: '1e293b',
            }),
          ],
        })
      )
      paras.push(bodyText(proj.description))
      if (proj.tech.length > 0) {
        paras.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: proj.tech.join(', '),
                italics: true,
                size: 18,
                font: 'Calibri',
                color: '64748b',
              }),
            ],
          })
        )
      }
    }
  }

  // Certifications
  if (resume.certifications && resume.certifications.length > 0) {
    paras.push(sectionHeading('CERTIFICATIONS'))
    for (const cert of resume.certifications) {
      paras.push(bodyText(`${cert.name}  —  ${cert.issuer}`))
    }
  }

  const doc = new Document({
    sections: [{ children: paras }],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename ?? `${(contact.fullName || 'Resume').replace(/\s+/g, '_')}_Resume.docx`
  a.click()
  URL.revokeObjectURL(url)
}
