import { supabaseServer } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { UploadZone } from '@/components/upload-zone'
import { DocumentList } from '@/components/document-list'
import { ClientDataForm } from '@/components/client-data-form'

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = supabaseServer()
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Клиент</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-lg font-semibold">{client?.full_name}</div>
            <div className="text-sm text-muted-foreground">Статус: {client?.status}</div>
            <div className="text-sm text-muted-foreground">Дата: {client?.created_at ? new Date(client.created_at).toLocaleDateString('ru-RU') : ''}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Загрузка файлов</CardTitle>
          </CardHeader>
          <CardContent>
            <UploadZone clientId={id} />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Файлы</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentList documents={(documents ?? []) as any} clientId={id} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Данные клиента</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientDataForm clientId={id} data={client?.extracted_data ?? {}} />
        </CardContent>
      </Card>
    </div>
  )
}
