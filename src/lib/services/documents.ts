import { supabaseServer } from '@/lib/supabase/server'
import type { Document } from '../../../types/database'

export async function listDocuments(clientId?: string): Promise<Document[]> {
  const supabase = supabaseServer()
  let query = supabase.from('documents').select('*').order('created_at', { ascending: false })
  if (clientId) query = query.eq('client_id', clientId)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as Document[]
}

export async function getDocument(id: string): Promise<Document | null> {
  const supabase = supabaseServer()
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data as Document
}

type CreateInput = Pick<Document, 'client_id' | 'original_name' | 'file_url' | 'mime_type' | 'size'>

export async function createDocumentService(input: CreateInput): Promise<Document> {
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
  return data as Document
}

type DocumentPatch = Partial<Pick<Document, 'original_name' | 'file_url' | 'mime_type' | 'size'>>

export async function updateDocumentService(id: string, patch: DocumentPatch): Promise<Document | null> {
  const supabase = supabaseServer()
  const payload: DocumentPatch = {}
  if (typeof patch.original_name === 'string') payload.original_name = patch.original_name
  if (typeof patch.file_url === 'string') payload.file_url = patch.file_url
  if (typeof patch.mime_type === 'string') payload.mime_type = patch.mime_type
  if (typeof patch.size === 'number') payload.size = patch.size
  const { data, error } = await supabase
    .from('documents')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) return null
  return data as Document
}

export async function deleteDocumentService(id: string): Promise<boolean> {
  const supabase = supabaseServer()
  const { data } = await supabase
    .from('documents')
    .select('file_url')
    .eq('id', id)
    .single()
  const path = data?.file_url ? String(data.file_url) : null
  if (path) {
    try {
      await supabase.storage.from('documents').remove([path])
    } catch {}
  }
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)
  if (error) return false
  return true
}

