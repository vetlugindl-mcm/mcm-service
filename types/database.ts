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
  registration_place?: string | null
  diploma_series?: string | null
  diploma_number?: string | null
  diploma_reg_number?: string | null
  diploma_university_name?: string | null
  diploma_university_location?: string | null
  diploma_specialty?: string | null
  diploma_qualification?: string | null
  diploma_qualification_date?: string | null
  diploma_file_url?: string | null
  cert_reg_number?: string | null
  cert_issue_date?: string | null
  cert_expiry_date?: string | null
  cert_center_name?: string | null
  cert_center_location?: string | null
  cert_file_url?: string | null
}

export interface Document {
  id: string
  client_id: string
  original_name?: string
  file_url?: string
  file_type?: string
  filename?: string
  path?: string
  mime_type?: string
  size?: number
  created_at: string
}
