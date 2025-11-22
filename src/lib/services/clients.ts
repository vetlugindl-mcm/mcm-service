import { supabaseServer } from '@/lib/supabase/server'
import type { Client } from '../../../types/database'

export async function listClients(): Promise<Client[]> {
  const supabase = supabaseServer()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Client[]
}

export async function getClient(id: string): Promise<Client | null> {
  const supabase = supabaseServer()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data as Client
}

export async function createClientService(full_name: string, status: Client['status'] = 'new'): Promise<Client> {
  const supabase = supabaseServer()
  const { data, error } = await supabase
    .from('clients')
    .insert({ full_name, status })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Client
}

type ClientPatch = Partial<Pick<Client, 'full_name' | 'status' | 'extracted_data'>>

export async function updateClientService(id: string, patch: ClientPatch): Promise<Client | null> {
  const supabase = supabaseServer()
  const payload: ClientPatch = {}
  if (typeof patch.full_name === 'string') payload.full_name = patch.full_name
  if (typeof patch.status === 'string') payload.status = patch.status
  if (patch.extracted_data !== undefined) {
    const { data: current } = await supabase
      .from('clients')
      .select('extracted_data')
      .eq('id', id)
      .single()
    const merged = { ...(current?.extracted_data ?? {}), ...(patch.extracted_data ?? {}) }
    payload.extracted_data = merged
  }
  const { data, error } = await supabase
    .from('clients')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) return null
  return data as Client
}

export async function deleteClientService(id: string): Promise<boolean> {
  const supabase = supabaseServer()
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)
  if (error) return false
  return true
}

export async function deleteClientAndDocuments(id: string): Promise<{ ok: boolean; deletedDocuments: number }> {
  const supabase = supabaseServer()
  const { data: docs } = await supabase
    .from('documents')
    .select('id,file_url')
    .eq('client_id', id)
  let deletedDocuments = 0
  if (Array.isArray(docs)) {
    const paths = docs.map(d => d.file_url).filter(Boolean) as string[]
    if (paths.length > 0) {
      try {
        await supabase.storage.from('documents').remove(paths.map(p => String(p)))
      } catch {}
    }
    const { error: delErr } = await supabase
      .from('documents')
      .delete()
      .eq('client_id', id)
    if (!delErr) deletedDocuments = docs.length
  }
  const ok = await deleteClientService(id)
  return { ok, deletedDocuments }
}

