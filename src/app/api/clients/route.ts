import { NextRequest } from 'next/server'
import { listClients, createClientService } from '@/lib/services/clients'

function isAuthorized(req: NextRequest): boolean {
  const key = process.env.SERVER_API_KEY
  if (!key) return true
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth
  return token === key
}

export async function GET() {
  try {
    const data = await listClients()
    return Response.json({ data })
  } catch (e: unknown) {
    console.error(e)
    return Response.json({ error: 'Failed to list clients' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const full_name = String(body?.full_name ?? '')
    const status = String(body?.status ?? 'new')
    if (!full_name.trim()) return Response.json({ error: 'full_name is required' }, { status: 400 })
    const data = await createClientService(full_name.trim(), status)
    return Response.json({ data }, { status: 201 })
  } catch (e: unknown) {
    console.error(e)
    return Response.json({ error: 'Failed to create client' }, { status: 500 })
  }
}

