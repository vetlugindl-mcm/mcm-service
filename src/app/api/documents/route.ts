import { NextRequest } from 'next/server'
import { listDocuments, createDocumentService } from '@/lib/services/documents'

function isAuthorized(req: NextRequest): boolean {
  const key = process.env.SERVER_API_KEY
  if (!key) return true
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth
  return token === key
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get('client_id') || undefined
    const data = await listDocuments(clientId)
    return Response.json({ data })
  } catch (e: any) {
    return Response.json({ error: 'Failed to list documents' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const client_id = String(body?.client_id ?? '')
    const original_name = body?.original_name ? String(body.original_name) : undefined
    const file_url = String(body?.file_url ?? '')
    const mime_type = body?.mime_type ? String(body.mime_type) : undefined
    const size = typeof body?.size === 'number' ? body.size : undefined
    if (!client_id || !file_url) return Response.json({ error: 'client_id and file_url are required' }, { status: 400 })
    const data = await createDocumentService({ client_id, original_name, file_url, mime_type, size })
    return Response.json({ data }, { status: 201 })
  } catch (e: any) {
    return Response.json({ error: 'Failed to create document' }, { status: 500 })
  }
}

