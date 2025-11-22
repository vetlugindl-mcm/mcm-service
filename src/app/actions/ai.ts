'use server'

import { supabaseServer } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { recognize as ocrRecognize, detectMimeFromUrl } from '@/lib/services/ocr'
import type { ExtractedData } from '../../../types/database'

type Parsed = ExtractedData & {
  doc_type?: 'passport' | 'snils' | 'diploma' | 'certificate' | 'unknown'
  registration_place?: string
  diploma_series?: string
  diploma_number?: string
  diploma_reg_number?: string
  diploma_university_name?: string
  diploma_university_location?: string
  diploma_specialty?: string
  diploma_specialization?: string
  diploma_qualification?: string
  diploma_qualification_date?: string
  cert_reg_number?: string
  cert_issue_date?: string
  cert_expiry_date?: string
  cert_center_name?: string
  cert_center_location?: string
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
  const mime = detectMimeFromUrl(fetchUrl)

  const parsed = await ocrRecognize({ base64, mimeType: mime }, { language: 'ru' }) as Parsed

  const { data: current } = await supabase
    .from('clients')
    .select('extracted_data')
    .eq('id', clientId)
    .single()

  const merged: ExtractedData = { ...(current?.extracted_data ?? {}), ...(parsed ?? {}) }

  const profilePatch: Record<string, unknown> = {}
  const dt = String(parsed.doc_type ?? '')
  if (dt === 'passport') {
    if (parsed.registration_place) profilePatch.registration_place = parsed.registration_place
  }
  if (dt === 'diploma') {
    const keys: (keyof Parsed)[] = [
      'diploma_series','diploma_number','diploma_reg_number','diploma_university_name','diploma_university_location','diploma_specialty','diploma_specialization','diploma_qualification','diploma_qualification_date'
    ]
    for (const k of keys) if (parsed[k] !== undefined) (profilePatch as Record<string, unknown>)[k as string] = parsed[k] as unknown
  }
  if (dt === 'certificate') {
    const keys: (keyof Parsed)[] = ['cert_reg_number','cert_issue_date','cert_expiry_date','cert_center_name','cert_center_location']
    for (const k of keys) if (parsed[k] !== undefined) (profilePatch as Record<string, unknown>)[k as string] = parsed[k] as unknown
  }

  await supabase
    .from('clients')
    .update({ extracted_data: merged, ...profilePatch })
    .eq('id', clientId)

  revalidatePath(`/client/${clientId}`)
  return merged
}
