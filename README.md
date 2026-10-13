# Ajaia Docs — AI-Native Collaborative Workspace

A high-quality, production-ready collaborative document editor prototype inspired by Google Docs, built with **Next.js 14 App Router**, **TypeScript**, **Tailwind CSS**, **TipTap**, and **Prisma ORM (SQLite)** for an Ajaia technical assessment.

---

## ✨ Features & Architecture

### Core Foundations
- **Google Docs-Inspired Paper Sheet Canvas:** Centered, distraction-free paper editing sheet with smooth responsive typography.
- **TipTap Rich Text Formatting Engine:**
  - Formatting toolbar: Bold, Italic, Underline, Heading 1, Heading 2, Bulleted Lists, Numbered Lists, Paragraph, Undo, and Redo.
  - Active formatting button states that react in real-time to cursor selection.
- **Debounced Real-Time Auto-Save:**
  - 2-second debounced state update with instant visual feedback:
    - `Saving...` (indigo spinner)
    - `Saved to Ajaia DB` (green checkmark with timestamp)
- **Zero-Config Instant Persistence:**
  - Powered by Prisma ORM with SQLite (`file:./dev.db`) for immediate out-of-the-box local operation.
- **Multi-User Simulation & Access Control (No OAuth Friction):**
  - Instant user switcher in the navbar between **Alice (Owner)** and **Bob (Collaborator)**.
  - All API routes authenticate requests using the `x-user-id` header.
  - Dynamic document access checks: Owner, Collaborator (Edit), or Viewer (Read-only).
- **Multi-Theme Engine:**
  - Built with `next-themes` and Tailwind CSS.
  - Smooth toggling between Light Mode (pure white paper canvas with soft slate background) and Dark Mode (dark zinc paper canvas with pitch black background).
- **Document Ingestion (File Import):**
  - Drag-and-drop file import modal supporting:
    - `.docx` (via `mammoth` parsing into semantic HTML)
    - `.md` (Markdown parser converting headers, lists, code, and styles)
    - `.txt` (Paragraph & linebreak normalizer)
  - Imported documents immediately redirect to the active editor.
- **Sharing Modal:**
  - Document owner can view collaborators and grant `edit` or `view` permissions.

---

## 🌟 Advanced Stretch Enhancements

### 1. In-App OpenRouter AI Writing Assistant (`Phase A`)
- **Backend Route:** `POST /api/ai` connecting to OpenRouter using `openai/gpt-4o-mini` with bearer token authentication via `OPENROUTER_API_KEY`.
- **Supported AI Actions:**
  - `summarize`: Generates a concise 3-bullet executive summary.
  - `polish`: Refines grammar, improves flow, and elevates tone.
  - `expand`: Generates a structured section outline with H2 headings and bullet points.
- **Editor Integration:** `✨ AI Assist` dropdown button directly in the TipTap toolbar with loading state and direct canvas injection.

### 2. Granular Role-Based Permissions (`Phase B`)
- **Explicit Levels:** `DocShare` model supports `"view"` | `"edit"`.
- **Backend Enforcement:** `PATCH /api/documents/[id]` returns HTTP 403 Forbidden if a viewer attempts to edit.
- **UI Read-Only Mode:**
  - TipTap editor locked to `editable={false}`.
  - Editing toolbar buttons automatically hidden.
  - Prominent banner: `👁️ Read-Only Mode (Shared with you as Viewer)`.
- **Sharing Modal:** Granular dropdown to grant either **Can Edit** or **Can View** access.

### 3. Document Export — Markdown & PDF (`Phase C`)
- **Export Dropdown:** `📥 Export` menu in the editor header:
  - **Export as Markdown (`.md`)**: Converts rich HTML into clean Markdown and initiates an instant browser download.
  - **Export as PDF (`.pdf`)**: Triggers native browser print view with dedicated `@media print` stylesheets that strip toolbars and preserve clean canvas margins.

### 4. Document Version History & Restore (`Phase D`)
- **Snapshot Engine:** `DocVersion` relational model captures document checkpoints on edits and updates.
- **Manual Checkpoints:** Users can snapshot checkpoints at any time.
- **History Modal:** `📜 History` button allows browsing historical timestamps, side-by-side content preview, and a **"Restore this Version"** one-click rollback action.

### 5. Inline Commenting System (`Phase E`)
- **Relational Model:** `Comment` model tracking author, document, feedback text, resolution status, and creation date.
- **Comments Sidebar:** Toggleable `💬 Comments` right drawer with unread count pill badge.
- **Actions:** Real-time comment submission, resolve/reopen status toggles, and deletion by author or document owner.

---

## 🚀 Quickstart & Setup Guide

### 1. Prerequisites
- Node.js 18+ (tested on Node v20/v24)
- npm 9+

### 2. Install Dependencies
```bash
npm install
```

### 3. Initialize & Seed Database
```bash
npx prisma db push
npx prisma db seed
```
This populates:
- **Alice (Owner)**: `id: "user-alice"`, `email: "alice@ajaia.io"`
- **Bob (Collaborator)**: `id: "user-bob"`, `email: "bob@ajaia.io"`
- A sample rich document: *"Project Alpha: AI-Native Architecture Spec"* owned by Alice and shared with Bob.

### 4. Configure OpenRouter AI (Optional)
Create `.env` (or copy `.env.example`):
```bash
OPENROUTER_API_KEY="your-openrouter-api-key"
```
*(If omitted, the AI assistant gracefully provides deterministic simulation responses so offline evaluation works seamlessly).*

### 5. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Run Automated Tests
```bash
npm test
```
Runs the Vitest suite testing the permission and access control matrix in `tests/sharing.test.ts`.

---

## 🧪 Testing Multi-User Collaboration
1. In the top navbar, the active user starts as **Alice (Owner)**.
2. In the dashboard, you will see *"Project Alpha: AI-Native Architecture Spec"* under **Owned by Me**.
3. Click the document to open the editor. Notice the **Owner** badge, toolbar, **Export**, **History**, **Comments**, and **Share** buttons.
4. Try the **✨ AI Assist** button in the toolbar to generate an executive summary or expand an outline.
5. Click **📜 History** to view snapshots or save a checkpoint.
6. Open **💬 Comments** to post a collaborative feedback note.
7. Switch user to **Bob (Collaborator)** via the navbar dropdown.
8. Bob sees the document under **Shared with Me** with the badge *"Owned by Alice"*, can respond to comments, format text, and trigger real-time auto-saves.
