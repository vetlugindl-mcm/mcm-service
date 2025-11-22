'use client'

import type { Document } from '../../types/database'
import { Button } from '@/components/ui/button'
import { File as FileIcon, Loader2, Pencil, Trash } from 'lucide-react'
import { recognizeDocument } from '@/app/actions/ai'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function DocumentList({ documents, clientId }: { documents: Document[]; clientId: string }) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [current, setCurrent] = useState<Document | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState<{ original_name?: string; file_url?: string; mime_type?: string; size?: number; file_type?: string }>({})

  async function onRecognize(d: Document) {
    setLoadingId(d.id)
    const path = d.file_url ?? ''
    await recognizeDocument(path, clientId)
    setLoadingId(null)
    router.refresh()
    alert('Документ распознан!')
  }

  function openEdit(d: Document) {
    setCurrent(d)
    setForm({
      original_name: d.original_name ?? '',
      file_url: d.file_url ?? '',
      mime_type: d.mime_type ?? '',
      size: typeof d.size === 'number' ? d.size : undefined,
      file_type: (d as unknown as { file_type?: string }).file_type ?? '',
    })
    setEditOpen(true)
  }

  async function saveEdit() {
    if (!current) return
    setSaving(true)
    try {
      const res = await fetch(`/api/documents/${current.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_name: form.original_name ?? undefined,
          file_url: form.file_url ?? undefined,
          mime_type: form.mime_type ?? undefined,
          size: typeof form.size === 'number' ? form.size : undefined,
          file_type: form.file_type ?? undefined,
        }),
      })
      if (!res.ok) throw new Error('Update failed')
      setEditOpen(false)
      setCurrent(null)
      router.refresh()
      alert('Изменения сохранены')
    } catch (e) {
      console.error(e)
      alert('Ошибка сохранения')
    }
    setSaving(false)
  }

  function openDelete(d: Document) {
    setCurrent(d)
    setDeleteOpen(true)
  }

  async function confirmDelete() {
    if (!current) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/documents/${current.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setDeleteOpen(false)
      setCurrent(null)
      router.refresh()
      alert('Документ удалён')
    } catch (e) {
      console.error(e)
      alert('Ошибка удаления')
    }
    setDeleting(false)
  }

  return (
    <>
    <div className="divide-y">
      {Array.isArray(documents) && documents.length > 0 ? (
        documents.map((d) => {
          const name = d.original_name ?? 'Без названия'
          const href = d.file_url
            ? d.file_url.startsWith('http')
              ? d.file_url
              : `${baseUrl}/storage/v1/object/public/documents/${d.file_url}`
            : undefined
          const isLoading = loadingId === d.id
          return (
            <div key={d.id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium truncate"
                    title={name}
                  >
                    {name}
                  </a>
                ) : (
                  <span className="font-medium truncate" title={name}>
                    {name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => onRecognize(d)} disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Распознаю...</span>
                  ) : (
                    'Распознать'
                  )}
                </Button>
                <Button variant="ghost" size="icon-sm" title="Редактировать" onClick={() => openEdit(d)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" title="Удалить" onClick={() => openDelete(d)}>
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )
        })
      ) : (
        <div className="text-muted-foreground py-2">Нет загруженных файлов</div>
      )}
    </div>

    <Dialog open={editOpen} onOpenChange={setEditOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактирование документа</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="original_name">Название</Label>
            <Input id="original_name" value={form.original_name ?? ''} onChange={(e) => setForm({ ...form, original_name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="file_url">Путь/URL</Label>
            <Input id="file_url" value={form.file_url ?? ''} onChange={(e) => setForm({ ...form, file_url: e.target.value })} />
          </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="mime_type">MIME</Label>
            <Input id="mime_type" value={form.mime_type ?? ''} onChange={(e) => setForm({ ...form, mime_type: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="size">Размер</Label>
            <Input id="size" type="number" value={form.size ?? ''} onChange={(e) => setForm({ ...form, size: e.target.value ? Number(e.target.value) : undefined })} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="file_type">Тип документа</Label>
          <Input id="file_type" value={form.file_type ?? ''} onChange={(e) => setForm({ ...form, file_type: e.target.value })} placeholder="passport | diploma | snils | certificate" />
        </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>Отмена</Button>
          <Button onClick={saveEdit} disabled={saving}>{saving ? (<span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Сохранение...</span>) : 'Сохранить'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Удалить документ?</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground">Операция необратима. Файл и запись будут удалены.</div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>Отмена</Button>
          <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>{deleting ? (<span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Удаление...</span>) : 'Удалить'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
