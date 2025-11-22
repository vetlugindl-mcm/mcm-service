'use server'

import { recognizeDocument as recognizeDocumentAI } from './ai'

export async function recognizeDocument(fileUrl: string, clientId: string) {
  return recognizeDocumentAI(fileUrl, clientId)
}
