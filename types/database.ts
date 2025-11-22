export type ClientStatus = 'new' | 'in_progress' | 'done' | 'rejected' | string

export type DocType = 'passport' | 'snils' | 'diploma' | 'unknown'

export interface ExtractedData {
  doc_type?: DocType
  surname?: string
  name?: string
  patronymic?: string
  birth_date?: string
  number?: string
  series?: string
  issue_date?: string
  issuer?: string
  code?: string
  snils_number?: string | null
  [key: string]: unknown
}

export interface Client {
  id: string
  full_name: string
  status: ClientStatus
  extracted_data: ExtractedData | null
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
