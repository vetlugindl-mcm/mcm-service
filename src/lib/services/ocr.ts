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
    return normalize(parsed) as ExtractedData
  } catch (e) {
    console.error('OCR primary model error', e)
    try {
      const parsed = await callModel(fallbackName)
      return normalize(parsed) as ExtractedData
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

function normalize(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...obj }
  const mappings: Record<string, string> = {
    // Russian aliases to canonical keys
    'место_регистрации': 'registration_place',
    'регистрационный_номер_диплома': 'diploma_reg_number',
    'регистрационный номер диплома': 'diploma_reg_number',
    'регистрационный номер': 'diploma_reg_number',
    'регистрационныйномер': 'diploma_reg_number',
    'регистрационный_номер': 'diploma_reg_number',
    'серия_диплома': 'diploma_series',
    'серия диплома': 'diploma_series',
    'номер_диплома': 'diploma_number',
    'номер диплома': 'diploma_number',
    'учебное_заведение': 'diploma_university_name',
    'наименование учебного заведения': 'diploma_university_name',
    'университет': 'diploma_university_name',
    'местонахождение_учебного_заведения': 'diploma_university_location',
    'местонахождение учебного заведения': 'diploma_university_location',
    'город': 'diploma_university_location',
    'специальность': 'diploma_specialty',
    'направление подготовки': 'diploma_specialty',
    'специализация': 'diploma_specialization',
    'квалификация': 'diploma_qualification',
    'дата_присвоения_квалификации': 'diploma_qualification_date',
    'дата присвоения квалификации': 'diploma_qualification_date',
    'дата выдачи диплома': 'diploma_qualification_date',
    'регистрационный_номер_свидетельства': 'cert_reg_number',
    'дата_выдачи_свидетельства': 'cert_issue_date',
    'дата_окончания_срока': 'cert_expiry_date',
    'центр_оценки_квалификаций': 'cert_center_name',
    'местонахождение_центра': 'cert_center_location',
  }
  for (const [k, v] of Object.entries(obj)) {
    const kk = k.trim()
    if (mappings[kk] && out[mappings[kk]] === undefined) {
      out[mappings[kk]] = v
    }
  }
  // doc_type normalization
  const dt = String(out['doc_type'] ?? '').toLowerCase()
  if (!dt || dt === 'unknown') {
    if (out['snils_number']) out['doc_type'] = 'snils'
    else if (
      out['diploma_series'] || out['diploma_number'] || out['diploma_reg_number'] || out['diploma_university_name']
    ) out['doc_type'] = 'diploma'
    else if (out['cert_reg_number'] || out['cert_center_name']) out['doc_type'] = 'certificate'
    else out['doc_type'] = 'passport'
  } else {
    const map: Record<string, string> = {
      'паспорт': 'passport',
      'snils': 'snils',
      'снилс': 'snils',
      'диплом': 'diploma',
      'certificate': 'certificate',
      'свидетельство': 'certificate',
    }
    out['doc_type'] = map[dt] ?? dt
  }
  return out
}
