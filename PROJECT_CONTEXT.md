# PROJECT CONTEXT: MSM Service (NOPRIZ Automation)

## 1. Project Overview
Web application for automating the document flow for entry into Self-Regulatory Organizations (SRO/NOPRIZ).
**Core Function:** Uploading client documents (Passport, Diploma, SNILS), extracting data via AI, and generating .docx templates.

## 2. Tech Stack (Mandatory)
- **Framework:** Next.js 15+ (App Router).
- **Language:** TypeScript (Strict mode).
- **Styling:** Tailwind CSS + Shadcn/UI (Zinc theme).
- **Icons:** Lucide React.
- **Database & Auth:** Supabase.
- **File Storage:** Supabase Storage (Bucket: `documents`).
- **AI Provider:** OpenRouter (proxy to Google Gemini/Meta Llama), using `openai` SDK.
- **Package Manager:** npm.

## 3. Database Schema (Supabase)

### Table: `clients`
- `id` (uuid, PK)
- `created_at` (timestamp)
- `full_name` (text) - Client's display name.
- `status` (text) - 'new' | 'processing' | 'done'.
- `extracted_data` (jsonb) - Stores parsed data from AI.
  - Structure: `{ surname, name, patronymic, birth_date, number, series, issue_date, issuer, code, snils_number, ... }`

### Table: `documents`
- `id` (uuid, PK)
- `client_id` (uuid, FK -> clients.id)
- `file_url` (text) - Public URL from Supabase Storage.
- `original_name` (text) - Original filename (e.g., "Паспорт.pdf").
- `mime_type` (text) - e.g., "application/pdf", "image/jpeg".
- `size` (bigint).

## 4. Coding Rules & Patterns

### 4.1. Server Actions ('use server')
- All database mutations and AI calls must be in `app/actions/`.
- Do NOT use API Routes (`pages/api`) unless necessary for webhooks.
- Always handle errors with `try/catch` and return `{ success: boolean, error?: string, data?: any }`.

### 4.2. AI Integration (CURRENT STABLE)
- **Provider:** Google Generative AI (Native SDK).
- **Library:** `@google/generative-ai`.
- **Auth:** Uses `GOOGLE_API_KEY` directly.
- **Strategy:**
  - Primary Model: `gemini-1.5-pro-002` (Stable, high quality for handwritten text).
  - Fallback Model: `gemini-2.0-flash` (Fast, experimental).
- **Flow:** Server Action (`app/actions/ai.ts`) generates a signed URL -> fetches file buffer -> determines MIME type -> sends to Google via `inlineData`.
- **Note:** Requires VPN/Proxy if deployed in restricted regions (RU), or deployment to US/EU servers (Vercel).

### 4.3. UI/UX
- Use **Shadcn** components for everything (Cards, Dialogs, Buttons).
- **Loading States:** Always show a spinner or skeleton when fetching/processing data.
- **Toasts:** Use `sonner` or `use-toast` for success/error messages.
- **Russian Language:** All UI text must be in Russian.

### 4.4. File Handling
- **Storage:** Supabase Storage (Bucket: `documents`).
- **Security:** Private bucket. Files are accessed via `createSignedUrl` only.
- **Upload:** Direct upload from client to Supabase.
- **Recognition:** No local conversion libraries (like pdf2pic) needed. We rely on Gemini's native PDF/Image support.

## 5. Environment Variables (`.env.local`)
Required keys:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENROUTER_API_KEY` (Must be used for AI, do NOT use GOOGLE_API_KEY directly to avoid geoblocks).

## 6. Current Roadmap Status
- [x] Project Setup & UI Shell.
- [x] Supabase DB & Storage connection.
- [x] Document Upload logic.
- [x] AI Recognition logic (via OpenRouter).
- [ ] **Next Step:** Word (.docx) generation based on `extracted_data`.
- [ ] **Next Step:** PDF to Image conversion (to support PDF parsing via Vision API).