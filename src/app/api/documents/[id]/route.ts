import { NextRequest } from 'next/server'
import { getDocument, updateDocumentService, deleteDocumentService } from '@/lib/services/documents'

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
    const data = await getDocument(id)
    if (!data) return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json({ data })
  } catch (e: any) {
    return Response.json({ error: 'Failed to get document' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const patch: any = {}
    if (typeof body?.original_name === 'string') patch.original_name = body.original_name
    if (typeof body?.file_url === 'string') patch.file_url = body.file_url
    if (typeof body?.mime_type === 'string') patch.mime_type = body.mime_type
    if (typeof body?.size === 'number') patch.size = body.size
    const { id } = await params
    const data = await updateDocumentService(id, patch)
    if (!data) return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json({ data })
  } catch (e: any) {
    return Response.json({ error: 'Failed to update document' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const ok = await deleteDocumentService(id)
    if (!ok) return Response.json({ error: 'Delete failed' }, { status: 500 })
    return Response.json({ ok: true })
  } catch (e: any) {
    return Response.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}

