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
  } catch (e: any) {
    return Response.json({ error: 'Failed to get client' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const patch: any = {}
    if (typeof body?.full_name === 'string') patch.full_name = body.full_name
    if (typeof body?.status === 'string') patch.status = body.status
    if (body?.extracted_data !== undefined) patch.extracted_data = body.extracted_data
    const { id } = await params
    const data = await updateClientService(id, patch)
    if (!data) return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json({ data })
  } catch (e: any) {
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
  } catch (e: any) {
    return Response.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}

