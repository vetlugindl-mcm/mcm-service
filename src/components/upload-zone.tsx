'use client'

import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createDocumentRecord } from '@/app/actions/uploadFile'
import { useRouter } from 'next/navigation'

export function UploadZone({ clientId }: { clientId: string }) {
  const [file, setFile] = useState<File | null>(null)
  const router = useRouter()

  async function handleUpload() {
    if (!file) return
    const ext = (file.name.split('.').pop() || '').toLowerCase()
    const fileName = ext ? `${Date.now()}.${ext}` : `${Date.now()}`
    const filePath = fileName
    const { error } = await supabaseBrowser.storage.from('documents').upload(filePath, file, { upsert: true })
    if (error) return
    await createDocumentRecord({
      client_id: clientId,
      original_name: file.name,
      file_url: filePath,
      mime_type: file.type,
      size: file.size,
    })
    router.refresh()
    setFile(null)
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="file">Файл</Label>
        <Input id="file" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </div>
      <Button onClick={handleUpload} disabled={!file}>Загрузить</Button>
    </div>
  )
}
