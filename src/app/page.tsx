import Link from 'next/link'
import { getClients } from '@/app/actions/getClients'
import { createClientAction } from '@/app/actions/createClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Client } from '../../types/database'

export default async function Home() {
  const clients = await getClients()

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold text-gray-800">Список заявок</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Новая заявка</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Создать клиента</DialogTitle>
            </DialogHeader>
            <form action={createClientAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">ФИО</Label>
                <Input id="full_name" name="full_name" placeholder="Иванов Иван Иванович" />
              </div>
              <DialogFooter>
                <Button type="submit">Создать</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {clients.map((c: Client) => (
          <Link key={c.id} href={`/client/${c.id}`}>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{c.full_name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <div>Статус: {String(c.status ?? '')}</div>
                <div>Дата: {c.created_at ? new Date(c.created_at).toLocaleDateString('ru-RU') : ''}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {clients.length === 0 && (
          <Card>
            <CardContent className="p-6 text-muted-foreground">Нет заявок</CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
