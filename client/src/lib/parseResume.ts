import * as pdfjsLib from 'pdfjs-dist'
import mammoth from 'mammoth'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

export interface ParseResult {
  text: string
  error?: string
}

export async function parsePdf(file: File): Promise<ParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const textParts: string[] = []

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      const pageText = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
      if (pageText.trim()) textParts.push(pageText.trim())
    }

    const text = textParts.join('\n\n')
    if (!text.trim()) {
      return { text: '', error: 'No extractable text found in PDF.' }
    }
    return { text }
  } catch {
    return { text: '', error: 'Failed to parse PDF. Please try another file.' }
  }
}

export async function parseDocx(file: File): Promise<ParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })
    const text = result.value
    if (!text.trim()) {
      return { text: '', error: 'No extractable text found in document.' }
    }
    return { text }
  } catch {
    return { text: '', error: 'Failed to parse document. Please try another file.' }
  }
}

export async function parseResumeFile(file: File): Promise<ParseResult> {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return parsePdf(file)
  if (ext === 'doc' || ext === 'docx') return parseDocx(file)
  return { text: '', error: 'Unsupported file type. Please upload PDF, DOC, or DOCX.' }
}

export const ACCEPTED_EXTENSIONS = '.pdf,.doc,.docx'
export const MAX_FILE_SIZE_MB = 5
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
