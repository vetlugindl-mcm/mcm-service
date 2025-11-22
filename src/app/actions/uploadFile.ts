'use server'

import { supabaseServer } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Document } from '../../../types/database'

export type CreateDocumentInput = {
  client_id: string
  original_name: string
  file_url: string
  mime_type?: string
  size?: number
}

export async function createDocumentRecord(input: CreateDocumentInput): Promise<Document> {
  const supabase = supabaseServer()
  const { data, error } = await supabase
    .from('documents')
    .insert({
      client_id: input.client_id,
      original_name: input.original_name,
      file_url: input.file_url,
      mime_type: input.mime_type,
      size: input.size,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath(`/client/${input.client_id}`)
  return data as Document
}
