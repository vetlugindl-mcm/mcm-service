'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { updateClientDataAction } from '@/app/actions/updateClientData'

type Data = Record<string, any>

export function ClientDataForm({ clientId, data }: { clientId: string; data: Data }) {
  const [saving, setSaving] = useState(false)

  async function onSubmit(formData: FormData) {
    setSaving(true)
    await updateClientDataAction(formData)
    setSaving(false)
  }

  return (
    <form action={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <input type="hidden" name="client_id" value={clientId} />

      <div className="space-y-2">
        <Label htmlFor="surname">Фамилия</Label>
        <Input id="surname" name="surname" defaultValue={data?.surname ?? ''} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">Имя</Label>
        <Input id="name" name="name" defaultValue={data?.name ?? ''} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="patronymic">Отчество</Label>
        <Input id="patronymic" name="patronymic" defaultValue={data?.patronymic ?? ''} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="birth_date">Дата рождения</Label>
        <Input id="birth_date" name="birth_date" defaultValue={data?.birth_date ?? ''} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="series">Серия паспорта</Label>
        <Input id="series" name="series" defaultValue={data?.series ?? ''} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="number">Номер паспорта</Label>
        <Input id="number" name="number" defaultValue={data?.number ?? ''} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="issuer">Кем выдан</Label>
        <Input id="issuer" name="issuer" defaultValue={data?.issuer ?? ''} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="code">Код подразделения</Label>
        <Input id="code" name="code" defaultValue={data?.code ?? ''} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="issue_date">Дата выдачи</Label>
        <Input id="issue_date" name="issue_date" defaultValue={data?.issue_date ?? ''} />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="snils_number">СНИЛС</Label>
        <Input id="snils_number" name="snils_number" defaultValue={data?.snils_number ?? ''} />
      </div>

      <div className="md:col-span-2 flex justify-end">
        <Button type="submit" disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить изменения'}</Button>
      </div>
    </form>
  )
}
