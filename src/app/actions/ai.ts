'use server'

import { supabaseServer } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { recognize as ocrRecognize, detectMimeFromUrl } from '@/lib/services/ocr'
import type { ExtractedData } from '../../../types/database'

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

  const parsed = await ocrRecognize({ base64, mimeType: mime }, { language: 'ru' })

  const { data: current } = await supabase
    .from('clients')
    .select('extracted_data')
    .eq('id', clientId)
    .single()

  const merged: ExtractedData = { ...(current?.extracted_data ?? {}), ...(parsed ?? {}) }
  await supabase
    .from('clients')
    .update({ extracted_data: merged })
    .eq('id', clientId)

  revalidatePath(`/client/${clientId}`)
  return merged
}
