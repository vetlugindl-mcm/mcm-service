'use server'

import { supabaseServer } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Client } from '../../../types/database'

export async function createClient(full_name: string): Promise<Client> {
  const supabase = supabaseServer()
  const { data, error } = await supabase
    .from('clients')
    .insert({ full_name, status: 'new' })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/')
  return data as Client
}

export async function createClientAction(formData: FormData): Promise<void> {
  const full_name = String(formData.get('full_name') ?? '')
  if (!full_name.trim()) return
  await createClient(full_name.trim())
}