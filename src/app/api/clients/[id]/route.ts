import { NextRequest } from 'next/server'
import { getClient, updateClientService, deleteClientAndDocuments } from '@/lib/services/clients'

function isAuthorized(req: NextRequest): boolean {
  const key = process.env.SERVER_API_KEY
  if (!key) return true
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth
  return token === key
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await getClient(id)
    if (!data) return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json({ data })
  } catch (e: unknown) {
    console.error(e)
    return Response.json({ error: 'Failed to get client' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const patch: Record<string, unknown> = {}
    if (typeof body?.full_name === 'string') patch.full_name = body.full_name
    if (typeof body?.status === 'string') patch.status = body.status
    if (body?.extracted_data !== undefined) patch.extracted_data = body.extracted_data
    if (typeof body?.registration_place === 'string') patch.registration_place = body.registration_place
    if (typeof body?.diploma_series === 'string') patch.diploma_series = body.diploma_series
    if (typeof body?.diploma_number === 'string') patch.diploma_number = body.diploma_number
    if (typeof body?.diploma_reg_number === 'string') patch.diploma_reg_number = body.diploma_reg_number
    if (typeof body?.diploma_university_name === 'string') patch.diploma_university_name = body.diploma_university_name
    if (typeof body?.diploma_university_location === 'string') patch.diploma_university_location = body.diploma_university_location
    if (typeof body?.diploma_specialty === 'string') patch.diploma_specialty = body.diploma_specialty
    if (typeof body?.diploma_specialization === 'string') patch.diploma_specialization = body.diploma_specialization
    if (typeof body?.diploma_qualification === 'string') patch.diploma_qualification = body.diploma_qualification
    if (typeof body?.diploma_qualification_date === 'string') patch.diploma_qualification_date = body.diploma_qualification_date
    if (typeof body?.diploma_file_url === 'string') patch.diploma_file_url = body.diploma_file_url
    if (typeof body?.cert_reg_number === 'string') patch.cert_reg_number = body.cert_reg_number
    if (typeof body?.cert_issue_date === 'string') patch.cert_issue_date = body.cert_issue_date
    if (typeof body?.cert_expiry_date === 'string') patch.cert_expiry_date = body.cert_expiry_date
    if (typeof body?.cert_center_name === 'string') patch.cert_center_name = body.cert_center_name
    if (typeof body?.cert_center_location === 'string') patch.cert_center_location = body.cert_center_location
    if (typeof body?.cert_file_url === 'string') patch.cert_file_url = body.cert_file_url
    const { id } = await params
    const data = await updateClientService(id, patch)
    if (!data) return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json({ data })
  } catch (e: unknown) {
    console.error(e)
    return Response.json({ error: 'Failed to update client' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const result = await deleteClientAndDocuments(id)
    if (!result.ok) return Response.json({ error: 'Delete failed' }, { status: 500 })
    return Response.json({ ok: true, deletedDocuments: result.deletedDocuments })
  } catch (e: unknown) {
    console.error(e)
    return Response.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}

