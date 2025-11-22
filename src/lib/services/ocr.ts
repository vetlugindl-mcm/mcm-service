import { GoogleGenerativeAI } from '@google/generative-ai'
import type { ExtractedData } from '../../../types/database'

type OCRRecognizeInput = {
  base64: string
  mimeType: string
}

type OCRRecognizeOptions = {
  language?: string
  modelPrimary?: string
  modelFallback?: string
}

function tryParseJson(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text)
  } catch {}
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    const slice = text.slice(start, end + 1)
    try {
      return JSON.parse(slice)
    } catch {}
  }
  return null
}

export async function recognize(input: OCRRecognizeInput, options: OCRRecognizeOptions = {}): Promise<ExtractedData> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY as string)
  const primary = options.modelPrimary ?? 'gemini-1.5-pro-002'
  const fallbackName = options.modelFallback ?? 'gemini-2.0-flash'
  const language = options.language ?? 'ru'

  const prompt = `Проанализируй документ (Паспорт РФ, СНИЛС, Диплом или Свидетельство о квалификации) и извлеки данные в строгом JSON.
Язык интерфейса: ${language}.
Структура:
{
  "doc_type": "passport" | "snils" | "diploma" | "unknown",
  "surname": "...",
  "name": "...",
  "patronymic": "...",
  "birth_date": "DD.MM.YYYY",
  "number": "...",
  "series": "...",
  "issue_date": "DD.MM.YYYY",
  "issuer": "...",
  "code": "...",
  "snils_number": "...",
  "registration_place": "...",
  "diploma_series": "...",
  "diploma_number": "...",
  "diploma_reg_number": "...",
  "diploma_university_name": "...",
  "diploma_university_location": "...",
  "diploma_specialty": "...",
  "diploma_specialization": "...",
  "diploma_qualification": "...",
  "diploma_qualification_date": "DD.MM.YYYY",
  "cert_reg_number": "...",
  "cert_issue_date": "DD.MM.YYYY",
  "cert_expiry_date": "DD.MM.YYYY",
  "cert_center_name": "...",
  "cert_center_location": "..."
}
Верни ТОЛЬКО чистый JSON.`

 async function callModel(modelName: string): Promise<Record<string, unknown>> {
    const model = genAI.getGenerativeModel({ model: modelName })
    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { data: input.base64, mimeType: input.mimeType } },
    ])
    const text = result.response.text()
    const parsed = tryParseJson(text) || {}
    return parsed
  }

  try {
    const parsed = await callModel(primary)
    return parsed as ExtractedData
  } catch (e) {
    console.error('OCR primary model error', e)
    try {
      const parsed = await callModel(fallbackName)
      return parsed as ExtractedData
    } catch (e2) {
      console.error('OCR fallback model error', e2)
      return {} as ExtractedData
    }
  }
}

export function detectMimeFromUrl(url: string): string {
  const lower = url.toLowerCase()
  if (lower.endsWith('.pdf')) return 'application/pdf'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (lower.endsWith('.png')) return 'image/png'
  return 'application/pdf'
}
