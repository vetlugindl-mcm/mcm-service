'use server'

import { supabaseServer } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateClientData(clientId: string, data: any) {
  const supabase = supabaseServer()
  const { data: current } = await supabase
    .from('clients')
    .select('extracted_data')
    .eq('id', clientId)
    .single()

  const merged = { ...(current?.extracted_data ?? {}), ...(data ?? {}) }
  await supabase
    .from('clients')
    .update({ extracted_data: merged })
    .eq('id', clientId)
  revalidatePath(`/client/${clientId}`)
}

export async function updateClientDataAction(formData: FormData) {
  const clientId = String(formData.get('client_id') ?? '')
  const payload = {
    surname: String(formData.get('surname') ?? ''),
    name: String(formData.get('name') ?? ''),
    patronymic: String(formData.get('patronymic') ?? ''),
    birth_date: String(formData.get('birth_date') ?? ''),
    series: String(formData.get('series') ?? ''),
    number: String(formData.get('number') ?? ''),
    issuer: String(formData.get('issuer') ?? ''),
    code: String(formData.get('code') ?? ''),
    issue_date: String(formData.get('issue_date') ?? ''),
    snils_number: String(formData.get('snils_number') ?? ''),
  }
  if (!clientId) return
  await updateClientData(clientId, payload)
}
