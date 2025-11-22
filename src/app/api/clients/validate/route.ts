import { NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const field = searchParams.get('field') || ''
  const value = searchParams.get('value') || ''
  const excludeId = searchParams.get('exclude_id') || ''
  if (!field || !value) return Response.json({ ok: false, error: 'BadRequest' }, { status: 400 })
  const supabase = supabaseServer()
  let exists = false

  if (field === 'passport_number') {
    const { data, error } = await supabase.from('clients').select('id, extracted_data')
    if (!error && Array.isArray(data)) {
      exists = data.some((r: { id: string; extracted_data?: { number?: string } | null }) => r.id !== excludeId && String(r.extracted_data?.number ?? '') === value)
    }
  } else if (field === 'diploma_reg_number') {
    const { data, error } = await supabase.from('clients').select('id').eq('diploma_reg_number', value)
    if (!error && Array.isArray(data)) exists = data.some((r) => r.id !== excludeId)
  } else if (field === 'cert_reg_number') {
    const { data, error } = await supabase.from('clients').select('id').eq('cert_reg_number', value)
    if (!error && Array.isArray(data)) exists = data.some((r) => r.id !== excludeId)
  } else {
    return Response.json({ ok: false, error: 'UnsupportedField' }, { status: 400 })
  }

  return Response.json({ ok: true, exists })
}

