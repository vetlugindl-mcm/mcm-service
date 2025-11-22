'use server'

import { supabaseServer } from '@/lib/supabase/server'
import type { Client } from '../../../types/database'

export async function getClients(): Promise<Client[]> {
  const supabase = supabaseServer()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as Client[]
}