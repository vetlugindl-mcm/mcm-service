'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { updateClientDataAction } from '@/app/actions/updateClientData'
import { updateClientProfileAction } from '@/app/actions/updateClientProfile'
import { supabaseBrowser } from '@/lib/supabase/client'
import type { ExtractedData, Client } from '../../types/database'

type Data = ExtractedData

export function ClientDataForm({ clientId, data, clientMeta }: { clientId: string; data: Data; clientMeta?: Partial<Client> }) {
  const [saving, setSaving] = useState(false)
  const [diplomaUploading, setDiplomaUploading] = useState(false)
  const [certificateUploading, setCertificateUploading] = useState(false)
  const [diplomaFile, setDiplomaFile] = useState<File | null>(null)
  const [certificateFile, setCertificateFile] = useState<File | null>(null)
  const [diplomaUrl, setDiplomaUrl] = useState<string>(clientMeta?.diploma_file_url ?? '')
  const [certificateUrl, setCertificateUrl] = useState<string>(clientMeta?.cert_file_url ?? '')
  const [errors, setErrors] = useState<{ passport?: string; diploma?: string; certificate?: string }>({})

  async function onSubmit(formData: FormData) {
    setSaving(true)
    formData.set('client_id', clientId)
    if (diplomaUrl) formData.set('diploma_file_url', diplomaUrl)
    if (certificateUrl) formData.set('cert_file_url', certificateUrl)
    const passportNumber = String(formData.get('number') ?? '')
    if (passportNumber) formData.set('passport_number', passportNumber)
    if (errors.passport || errors.diploma || errors.certificate) { setSaving(false); return }
    await updateClientProfileAction(formData)
    await updateClientDataAction(formData)
    setSaving(false)
  }

  async function uploadDiploma() {
    if (!diplomaFile) return
    setDiplomaUploading(true)
    const ext = (diplomaFile.name.split('.').pop() || '').toLowerCase()
    const fileName = `diploma-${clientId}-${Date.now()}.${ext || 'pdf'}`
    const { error } = await supabaseBrowser.storage.from('documents').upload(fileName, diplomaFile, { upsert: true })
    if (!error) setDiplomaUrl(fileName)
    setDiplomaUploading(false)
  }

  async function uploadCertificate() {
    if (!certificateFile) return
    setCertificateUploading(true)
    const ext = (certificateFile.name.split('.').pop() || '').toLowerCase()
    const fileName = `certificate-${clientId}-${Date.now()}.${ext || 'pdf'}`
    const { error } = await supabaseBrowser.storage.from('documents').upload(fileName, certificateFile, { upsert: true })
    if (!error) setCertificateUrl(fileName)
    setCertificateUploading(false)
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

      <div className="md:col-span-2 space-y-2">
        <Label htmlFor="registration_place">Место регистрации</Label>
        <Input id="registration_place" name="registration_place" maxLength={256} defaultValue={clientMeta?.registration_place ?? ''} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="series">Серия паспорта</Label>
        <Input id="series" name="series" defaultValue={data?.series ?? ''} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="number">Номер паспорта</Label>
        <Input id="number" name="number" defaultValue={data?.number ?? ''} onBlur={async (e) => {
          const v = e.target.value.trim()
          setErrors((prev) => ({ ...prev, passport: '' }))
          if (!v) return
          const res = await fetch(`/api/clients/validate?field=passport_number&value=${encodeURIComponent(v)}&exclude_id=${encodeURIComponent(clientId)}`)
          const json = await res.json()
          if (json?.exists) setErrors((prev) => ({ ...prev, passport: 'Номер паспорта уже существует' }))
        }} />
        {errors.passport && <div className="text-destructive text-sm">{errors.passport}</div>}
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

      <div className="md:col-span-2 mt-6">
        <div className="text-lg font-semibold">Диплом</div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="diploma_series">Серия диплома</Label>
        <Input id="diploma_series" name="diploma_series" maxLength={64} defaultValue={String(clientMeta?.diploma_series ?? data?.diploma_series ?? '')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="diploma_number">Номер диплома</Label>
        <Input id="diploma_number" name="diploma_number" maxLength={64} defaultValue={String(clientMeta?.diploma_number ?? data?.diploma_number ?? '')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="diploma_reg_number">Регистрационный номер диплома</Label>
        <Input id="diploma_reg_number" name="diploma_reg_number" maxLength={128} defaultValue={String(clientMeta?.diploma_reg_number ?? data?.diploma_reg_number ?? '')} onBlur={async (e) => {
          const v = e.target.value.trim()
          setErrors((prev) => ({ ...prev, diploma: '' }))
          if (!v) return
          const res = await fetch(`/api/clients/validate?field=diploma_reg_number&value=${encodeURIComponent(v)}&exclude_id=${encodeURIComponent(clientId)}`)
          const json = await res.json()
          if (json?.exists) setErrors((prev) => ({ ...prev, diploma: 'Регистрационный номер диплома уже существует' }))
        }} />
        {errors.diploma && <div className="text-destructive text-sm">{errors.diploma}</div>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="diploma_university_name">Учебное заведение</Label>
        <Input id="diploma_university_name" name="diploma_university_name" maxLength={256} defaultValue={String(clientMeta?.diploma_university_name ?? data?.diploma_university_name ?? '')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="diploma_university_location">Местонахождение учебного заведения</Label>
        <Input id="diploma_university_location" name="diploma_university_location" maxLength={256} defaultValue={String(clientMeta?.diploma_university_location ?? data?.diploma_university_location ?? '')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="diploma_specialty">Специальность</Label>
        <Input id="diploma_specialty" name="diploma_specialty" maxLength={256} defaultValue={String(clientMeta?.diploma_specialty ?? data?.diploma_specialty ?? '')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="diploma_specialization">Специализация</Label>
        <Input id="diploma_specialization" name="diploma_specialization" maxLength={256} defaultValue={String(clientMeta?.diploma_specialization ?? data?.diploma_specialization ?? '')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="diploma_qualification">Квалификация</Label>
        <Input id="diploma_qualification" name="diploma_qualification" maxLength={256} defaultValue={String(clientMeta?.diploma_qualification ?? data?.diploma_qualification ?? '')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="diploma_qualification_date">Дата присвоения квалификации</Label>
        <Input id="diploma_qualification_date" name="diploma_qualification_date" maxLength={32} defaultValue={String(clientMeta?.diploma_qualification_date ?? data?.diploma_qualification_date ?? '')} />
      </div>
      <div className="md:col-span-2 space-y-2">
        <Label htmlFor="diploma_file">Файл диплома</Label>
        <Input id="diploma_file" type="file" onChange={(e) => setDiplomaFile(e.target.files?.[0] ?? null)} />
        <div className="flex gap-2">
          <Button type="button" onClick={uploadDiploma} disabled={diplomaUploading || !diplomaFile}>{diplomaUploading ? 'Загрузка...' : 'Загрузить диплом'}</Button>
          {diplomaUrl && <a href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documents/${diplomaUrl}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary">Просмотреть</a>}
        </div>
        <input type="hidden" name="diploma_file_url" value={diplomaUrl} />
      </div>

      <div className="md:col-span-2 mt-6">
        <div className="text-lg font-semibold">Свидетельство о квалификации</div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="cert_reg_number">Регистрационный номер свидетельства</Label>
        <Input id="cert_reg_number" name="cert_reg_number" maxLength={128} defaultValue={clientMeta?.cert_reg_number ?? ''} onBlur={async (e) => {
          const v = e.target.value.trim()
          setErrors((prev) => ({ ...prev, certificate: '' }))
          if (!v) return
          const res = await fetch(`/api/clients/validate?field=cert_reg_number&value=${encodeURIComponent(v)}&exclude_id=${encodeURIComponent(clientId)}`)
          const json = await res.json()
          if (json?.exists) setErrors((prev) => ({ ...prev, certificate: 'Регистрационный номер свидетельства уже существует' }))
        }} />
        {errors.certificate && <div className="text-destructive text-sm">{errors.certificate}</div>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="cert_issue_date">Дата выдачи свидетельства</Label>
        <Input id="cert_issue_date" name="cert_issue_date" maxLength={32} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cert_expiry_date">Дата окончания срока действия</Label>
        <Input id="cert_expiry_date" name="cert_expiry_date" maxLength={32} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cert_center_name">Центр оценки квалификаций</Label>
        <Input id="cert_center_name" name="cert_center_name" maxLength={256} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cert_center_location">Местонахождение центра</Label>
        <Input id="cert_center_location" name="cert_center_location" maxLength={256} />
      </div>
      <div className="md:col-span-2 space-y-2">
        <Label htmlFor="cert_file">Файл свидетельства</Label>
        <Input id="cert_file" type="file" onChange={(e) => setCertificateFile(e.target.files?.[0] ?? null)} />
        <div className="flex gap-2">
          <Button type="button" onClick={uploadCertificate} disabled={certificateUploading || !certificateFile}>{certificateUploading ? 'Загрузка...' : 'Загрузить свидетельство'}</Button>
          {certificateUrl && <a href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documents/${certificateUrl}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary">Просмотреть</a>}
        </div>
        <input type="hidden" name="cert_file_url" value={certificateUrl} />
      </div>

      <div className="md:col-span-2 flex justify-end">
        <Button type="submit" disabled={saving || !!errors.passport || !!errors.diploma || !!errors.certificate}>{saving ? 'Сохранение...' : 'Сохранить изменения'}</Button>
      </div>
    </form>
  )
}
