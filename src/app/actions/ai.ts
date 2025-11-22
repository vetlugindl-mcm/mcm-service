'use server'

import { supabaseServer } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { revalidatePath } from 'next/cache'

function tryParseJson(text: string) {
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

export async function recognizeDocument(fileUrl: string, clientId: string) {
  const supabase = supabaseServer()
  let fetchUrl = fileUrl
  if (!/^https?:\/\//.test(fileUrl)) {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(fileUrl, 600)
    if (error || !data?.signedUrl) {
      throw new Error('Cannot create signed URL for file')
    }
    fetchUrl = data.signedUrl
  }

  const res = await fetch(fetchUrl)
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`)
  const buf = await res.arrayBuffer()
  const base64 = Buffer.from(buf).toString('base64')

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY as string)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-002' })

  const prompt = `Проанализируй этот документ (Паспорт РФ, СНИЛС или Диплом).
Извлеки все видимые данные в строгий JSON формат.
Структура JSON:
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
  "snils_number": "..."
}
Верни ТОЛЬКО чистый JSON без markdown formatting.`

  let parsed: any = {}
  try {
    const lower = fetchUrl.toLowerCase()
    const mime = lower.endsWith('.pdf')
      ? 'application/pdf'
      : lower.endsWith('.jpg') || lower.endsWith('.jpeg')
      ? 'image/jpeg'
      : lower.endsWith('.png')
      ? 'image/png'
      : 'application/pdf'
    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          data: base64,
          mimeType: mime,
        },
      },
    ])
    const text = result.response.text()
    console.log('GEMINI RAW RESPONSE:', text)
    parsed = tryParseJson(text) || {}
  } catch (e) {
    try {
      const fallback = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
      const lower = fetchUrl.toLowerCase()
      const mime = lower.endsWith('.pdf')
        ? 'application/pdf'
        : lower.endsWith('.jpg') || lower.endsWith('.jpeg')
        ? 'image/jpeg'
        : lower.endsWith('.png')
        ? 'image/png'
        : 'application/pdf'
      const result = await fallback.generateContent([
        { text: prompt },
        { inlineData: { data: base64, mimeType: mime } },
      ])
      const text = result.response.text()
      console.log('GEMINI RAW RESPONSE (fallback):', text)
      parsed = tryParseJson(text) || {}
    } catch (e2) {
      console.error('AI error', e2)
      parsed = {}
    }
  }

  const { data: current } = await supabase
    .from('clients')
    .select('extracted_data')
    .eq('id', clientId)
    .single()

  const merged = { ...(current?.extracted_data ?? {}), ...parsed }
  await supabase
    .from('clients')
    .update({ extracted_data: merged })
    .eq('id', clientId)

  revalidatePath(`/client/${clientId}`)
  return merged
}
