'use server'

import { supabaseServer } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ExtractedData } from '../../../types/database'

function str(v: FormDataEntryValue | null): string {
  return String(v ?? '').trim()
}

export async function updateClientProfileAction(formData: FormData) {
  const clientId = str(formData.get('client_id'))
  if (!clientId) return

  const registration_place = str(formData.get('registration_place')) || null

  const diploma_series = str(formData.get('diploma_series')) || null
  const diploma_number = str(formData.get('diploma_number')) || null
  const diploma_reg_number = str(formData.get('diploma_reg_number')) || null
  const diploma_university_name = str(formData.get('diploma_university_name')) || null
  const diploma_university_location = str(formData.get('diploma_university_location')) || null
  const diploma_specialty = str(formData.get('diploma_specialty')) || null
  const diploma_specialization = str(formData.get('diploma_specialization')) || null
  const diploma_qualification = str(formData.get('diploma_qualification')) || null
  const diploma_qualification_date = str(formData.get('diploma_qualification_date')) || null
  const diploma_file_url = str(formData.get('diploma_file_url')) || null

  const cert_reg_number = str(formData.get('cert_reg_number')) || null
  const cert_issue_date = str(formData.get('cert_issue_date')) || null
  const cert_expiry_date = str(formData.get('cert_expiry_date')) || null
  const cert_center_name = str(formData.get('cert_center_name')) || null
  const cert_center_location = str(formData.get('cert_center_location')) || null
  const cert_file_url = str(formData.get('cert_file_url')) || null

  const passport_number = str(formData.get('passport_number'))

  const supabase = supabaseServer()

  if (diploma_reg_number) {
    const { data } = await supabase
      .from('clients')
      .select('id')
      .eq('diploma_reg_number', diploma_reg_number)
    if (Array.isArray(data) && data.some((r) => r.id !== clientId)) throw new Error('Duplicate diploma registration number')
  }

  if (cert_reg_number) {
    const { data } = await supabase
      .from('clients')
      .select('id')
      .eq('cert_reg_number', cert_reg_number)
    if (Array.isArray(data) && data.some((r) => r.id !== clientId)) throw new Error('Duplicate certificate registration number')
  }

  if (passport_number) {
    const { data } = await supabase
      .from('clients')
      .select('id, extracted_data')
    if (Array.isArray(data)) {
      const dup = data.find((r: { id: string; extracted_data?: { number?: string } | null }) => r.id !== clientId && String(r.extracted_data?.number ?? '') === passport_number)
      if (dup) throw new Error('Duplicate passport number')
    }
  }

  const payload: Record<string, unknown> = {
    registration_place,
    diploma_series,
    diploma_number,
    diploma_reg_number,
    diploma_university_name,
    diploma_university_location,
    diploma_specialty,
    diploma_specialization,
    diploma_qualification,
    diploma_qualification_date,
    diploma_file_url,
    cert_reg_number,
    cert_issue_date,
    cert_expiry_date,
    cert_center_name,
    cert_center_location,
    cert_file_url,
  }

  if (passport_number) {
    const { data: current } = await supabase
      .from('clients')
      .select('extracted_data')
      .eq('id', clientId)
      .single()
    const merged: ExtractedData = { ...(current?.extracted_data ?? {}), number: passport_number }
    payload.extracted_data = merged
  }

  await supabase
    .from('clients')
    .update(payload)
    .eq('id', clientId)

  revalidatePath(`/client/${clientId}`)
}
