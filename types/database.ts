export type ClientStatus = 'new' | 'in_progress' | 'done' | 'rejected' | string

export interface Client {
  id: string
  full_name: string
  status: ClientStatus
  extracted_data: any
  created_at: string
}

export interface Document {
  id: string
  client_id: string
  original_name?: string
  file_url?: string
  filename?: string
  path?: string
  mime_type?: string
  size?: number
  created_at: string
}
