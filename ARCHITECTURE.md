# Architecture & Design Decisions

**Project:** Ajaia Docs — AI-Native Collaborative Workspace  
**Candidate:** Muhammad Moeen Ul Qadir (bsf1804461@ue.edu.pk)  
**Role:** AI-Native Full Stack Product Engineer  

---

## 1. Executive Summary & Objective

The objective of this assignment is to build a high-fidelity, lightweight collaborative document editor prototype inspired by Google Docs within a realistic 4–6 hour delivery window. The core challenge is making deliberate product tradeoffs between frontend interaction fidelity, data persistence reliability, access control, and pragmatic AI integration without unnecessary complexity.

---

## 2. High-Level System Architecture

Ajaia Docs is architected using a modern, unified Next.js 14 full-stack structure:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Next.js 14 Client App                           │
│  - ActiveUserProvider (Alice/Bob context simulation)                  │
│  - ThemeProvider (next-themes: Light Paper vs Dark Canvas)            │
│  - Dashboard (/): Owned vs Shared Docs, Search, Templates             │
│  - Editor (/doc/[id]): Paper Sheet, TipTap Engine, Floating Bubble    │
│  - AI Output Playground: Independent modal with copy/insert/clear      │
│  - Modals: ConfirmModal, ImportModal, ShareModal, HistoryModal        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (JSON API / HTTP + x-user-id)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Next.js Route Handlers (API)                       │
│  - /api/documents: List (owned & shared), Create Document              │
│  - /api/documents/[id]: GET, debounced PATCH (auto-save), DELETE       │
│  - /api/documents/[id]/share: Role-based sharing (view vs edit)        │
│  - /api/documents/[id]/versions: Snapshot creation and restore         │
│  - /api/documents/[id]/comments: Collaborative threaded feedback       │
│  - /api/upload: Multipart file ingest (.docx, .md, .txt) + XSS sanitize│
│  - /api/ai: OpenRouter integration (gpt-4o-mini / llama-3.3-70b)       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Data Persistence & Schema                         │
│  - Prisma ORM singleton client                                         │
│  - SQLite (dev.db) for zero-config local runs                          │
│  - PostgreSQL support for cloud production deployment (Vercel/Neon)   │
│  - Relational Models: User, Document, DocShare, DocVersion, Comment    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Key Prioritizations & Technical Rationale

### 3.1. Zero-Friction User Switching over Heavy OAuth
- **Decision:** Authenticate via client context and attach `x-user-id` to all backend calls with a 1-click switcher in the navbar between **Alice (Owner)** and **Bob (Collaborator)**.
- **Rationale:** Reviewers spend 5 minutes testing a submission. Forcing real OAuth or email verification creates setup friction and test account setup issues. The simulated identity model provides 100% of the multi-user authorization matrix while keeping evaluation immediate.

### 3.2. Debounced Auto-Save with Visual Status
- **Decision:** TipTap `onUpdate` feeds into a 2-second debounced `PATCH /api/documents/[id]` request with immediate status changes: `Saving...` $\rightarrow$ `Saved to Ajaia DB`.
- **Rationale:** Mimics the exact Google Docs user peace of mind while avoiding database write starvation on every keystroke.

### 3.3. File Ingestion (.docx, .md, .txt) with HTML Sanitization
- **Decision:** Server-side parsing using `mammoth` for Word documents, a structured AST/regex parser for Markdown, and a custom `sanitizeHtml` filter that strips malicious `<script>`, `<iframe>`, and `onerror` vectors.
- **Rationale:** Allows teams to import existing meeting notes, PRDs, and specs seamlessly without risking XSS injections.

### 3.4. Dedicated AI Output Playground
- **Decision:** Rather than destructively overwriting the user's document canvas when running AI actions (3-bullet summary, polish grammar, expand outline), the AI response opens in a dedicated preview modal with one-click **Copy Output**, **Clear / Discard**, and optional **Insert to Document**.
- **Rationale:** Commercial AI products (Notion AI, Grammarly) avoid destructive in-place text replacement without user review. This ensures users retain complete control over their content.

---

## 4. Tradeoffs & Intentional Deprioritizations

| Feature Area | What Was Built | What Was Deprioritized | Rationale |
| :--- | :--- | :--- | :--- |
| **Real-time Engine** | Relational snapshots & debounced REST | Full WebSocket Yjs / CRDT server | CRDTs require dedicated stateful server infrastructure that complicates simple deployment and exceeds a 4–6 hour scope. |
| **Authentication** | Seeded simulated users (`Alice` & `Bob`) | Production OAuth2 / NextAuth / Clerk | Reviewers need instant, zero-credential access to evaluate sharing and role permissions. |
| **PDF Generation** | CSS `@media print` with custom print layout | Server-side Puppeteer / PDFKit | Browser-native printing produces crisp vector text and zero server overhead with no external dependencies. |

---

## 5. Security & Verification Strategy
- **Role-Based Enforcement:** All document write routes verify whether the user has `owner` or `edit` permissions; viewers receive HTTP 403 Forbidden.
- **Automated Vitest Suite:** Tests both the authorization matrix (`tests/sharing.test.ts`) and file parsing/sanitization pipelines (`tests/fileParser.test.ts`).
