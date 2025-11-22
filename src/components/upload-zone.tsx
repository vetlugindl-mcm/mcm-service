'use client'

import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createDocumentRecord } from '@/app/actions/uploadFile'
import { useRouter } from 'next/navigation'

export function UploadZone({ clientId }: { clientId: string }) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const router = useRouter()

  async function handleUpload() {
    if (!files.length) return
    setUploading(true)
    for (const file of files) {
      const ext = (file.name.split('.').pop() || '').toLowerCase()
      const fileName = ext ? `${clientId}/${Date.now()}.${ext}` : `${clientId}/${Date.now()}`
      const { error } = await supabaseBrowser.storage.from('documents').upload(fileName, file, { upsert: true })
      if (error) continue
      await createDocumentRecord({
        client_id: clientId,
        original_name: file.name,
        file_url: fileName,
        mime_type: file.type,
        size: file.size,
      })
    }
    setUploading(false)
    setFiles([])
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="file">Файлы</Label>
        <Input id="file" type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
      </div>
      <Button onClick={handleUpload} disabled={!files.length || uploading}>{uploading ? 'Загрузка...' : 'Загрузить'}</Button>
    </div>
  )
}
