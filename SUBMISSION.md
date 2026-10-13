# Ajaia Technical Assessment: Submission Report

**Candidate:** Muhammad Moeen Ul Qadir  
**Email:** bsf1804461@ue.edu.pk  
**Role:** AI-Native Full Stack Product Engineer  
**Project:** Ajaia Docs — Collaborative AI-Native Document Workspace  
**Live URL:** https://ajaia-doc.vercel.app  
**Repository:** https://github.com/MoeenQadir/ajaia-doc-editor  
**Branch:** `v2` (and `master`)  
**Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, TipTap, Prisma ORM, SQLite, OpenRouter, Vitest  

---

## 📦 Deliverables Checklist (Per Prompt Instructions)

- [x] **Source Code:** Full repository with Next.js 14, TypeScript, Tailwind, TipTap, Prisma, and Vitest.
- [x] **README.md:** Complete setup and zero-config run instructions (`npm install && npm run dev`).
- [x] **Architecture Note:** [ARCHITECTURE.md](file:///E:/ajaia-doc-editor/ARCHITECTURE.md) detailing architecture, scope prioritization, tradeoffs, and system boundaries.
- [x] **AI Workflow Note:** [AI_WORKFLOW.md](file:///E:/ajaia-doc-editor/AI_WORKFLOW.md) explaining AI tooling, speedups, rejected proposals, and verification protocols.
- [x] **Submission File:** `SUBMISSION.md` listing everything built, verified, and deliverable.
- [x] **Live Product URL:** https://ajaia-doc.vercel.app
- [x] **Walkthrough Video Note:** [WALKTHROUGH_VIDEO.txt](file:///E:/ajaia-doc-editor/WALKTHROUGH_VIDEO.txt) with discussion points and placeholder link.
- [x] **Automated Tests:** 8 passing Vitest tests covering authorization rules and file parsing/sanitization.

---

## 1. Architectural Overview & System Design

Ajaia Docs is built as a complete AI-native document editor and collaboration suite.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Client Layer (Next.js 14)                    │
│                                                                        │
│  ┌─────────────────────────┐  ┌─────────────────────────────────────┐  │
│  │   ActiveUserProvider    │  │       ThemeProvider (next-themes)   │  │
│  │  (Alice vs Bob switcher)│  │    (Light White vs Dark Zinc Canvas)│  │
│  └───────────┬─────────────┘  └──────────────────┬──────────────────┘  │
│              │                                   │                     │
│  ┌───────────▼─────────────┐  ┌──────────────────▼──────────────────┐  │
│  │  Document Dashboard     │  │   Document Editor (/doc/[id])       │  │
│  │  - Owned vs Shared Grid │  │   - Paper Sheet Canvas              │  │
│  │  - Title Filter Search  │  │   - TipTap Editor + Toolbar         │  │
│  │  - Ingest Modal (.docx) │  │   - ✨ AI Assist (OpenRouter)       │  │
│  └───────────┬─────────────┘  │   - 📥 Export (MD / PDF)            │  │
│              │                │   - 📜 Version History & Restore    │  │
│              │                │   - 💬 Comments Drawer (Resolve/Del)│  │
│              │                │   - 2s Debounced Auto-Save Engine   │  │
│              │                └──────────────────┬──────────────────┘  │
└──────────────┼───────────────────────────────────┼─────────────────────┘
               │ x-user-id Header Attached         │
               ▼                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        API Layer (Route Handlers)                      │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  /api/ai                 -> OpenRouter gpt-4o-mini               │  │
│  │  /api/documents          -> List (owned & shared) & Create Doc   │  │
│  │  /api/documents/[id]     -> GET / PATCH (auto-save) / DELETE     │  │
│  │  /api/documents/[id]/share -> Grant edit/view permission         │  │
│  │  /api/documents/[id]/versions -> List & Create snapshots         │  │
│  │  /api/documents/[id]/versions/[versionId]/restore -> Rollback    │  │
│  │  /api/documents/[id]/comments -> List & Post comments            │  │
│  │  /api/documents/[id]/comments/[commentId] -> Resolve & Delete    │  │
│  │  /api/upload             -> Ingest (.docx, .md, .txt) to HTML    │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
└─────────────────────────────────────┼──────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Persistence & Engine Layer                      │
│                                                                        │
│  ┌───────────────────────────┐        ┌─────────────────────────────┐  │
│  │  Prisma ORM Singleton     │        │     Document Ingestion      │  │
│  │  - User                   │        │  - Mammoth (.docx -> HTML)  │  │
│  │  - Document               │        │  - Markdown Headings/Lists  │  │
│  │  - DocShare (edit/view)   │        │  - Raw Text Paragraphs      │  │
│  │  - DocVersion (snapshots) │        └─────────────────────────────┘  │
│  │  - Comment (discussions)  │                                         │
│  └─────────────┬─────────────┘                                         │
│                ▼                                                       │
│          SQLite (dev.db)                                               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Advanced Stretch Enhancements Implemented

### Phase A: OpenRouter AI Assistant
- Integrated with `https://openrouter.ai/api/v1/chat/completions` using `openai/gpt-4o-mini`.
- Handles `summarize` (3-bullet executive takeaways), `polish` (style, grammar, and tone), and `expand` (H2 outline and bullet points).
- Direct insertion or replacement at the active editor selection point.
- Resilient fallback generation ensures 100% offline testability if an API key is not yet configured in `.env`.

### Phase B: Role-Based Permissions (Viewer vs. Editor)
- Enforces strict permission levels: `"view"` vs. `"edit"`.
- `PATCH /api/documents/[id]` returns HTTP 403 Forbidden if a viewer attempts an update.
- When viewed by a user with `"view"` access:
  - Canvas locks to `editable={false}`.
  - Formatting toolbar buttons are hidden.
  - Displays top banner: `👁️ Read-Only Mode (Shared with you as Viewer)`.
- `ShareModal.tsx` provides a dropdown to designate target role (**Editor** vs. **Viewer**).

### Phase C: Document Export (Markdown & PDF)
- **Markdown Export:** HTML-to-Markdown parser converts headers, lists, styling, and code blocks into standard `.md` and triggers a browser file download.
- **PDF Export:** Configured `@media print` rules strip toolbars, navbars, and interactive buttons to render a pristine Google Docs sheet formatted for physical print or saving as PDF.

### Phase D: Document Version History
- Database model `DocVersion` stores point-in-time snapshots of document content, title, and timestamps.
- Captured automatically on edits and manual checkpoints.
- `VersionHistoryModal` provides side-by-side snapshot comparison and one-click **"Restore this Version"** rollback capability.

### Phase E: Inline Commenting System
- Relational `Comment` model stores threaded feedback by document and user.
- Interactive `CommentsSidebar` drawer with active unread counter badge.
- Supports commenting as Alice or Bob, toggling resolution status (`Resolved` vs. `Open`), and comment deletion by author or document owner.

---

## 3. Scope & Tradeoff Decisions

| Feature Area | Decision Made | Rationale & Tradeoff |
| :--- | :--- | :--- |
| **AI Integration** | OpenRouter `gpt-4o-mini` with smart fallback | Maximizes response speed and cost efficiency while ensuring the prototype never crashes or hangs if tested without API keys. |
| **Authentication** | Header-based mock auth with UI switcher | Bypasses third-party OAuth setup friction while allowing evaluators to instantly test multi-user sharing and role-based permissions locally. |
| **Persistence** | SQLite with Prisma ORM | Zero-config, single-file database (`file:./dev.db`) requiring no Docker or remote cloud dependencies, yet completely type-safe and relational. |
| **Version History** | Point-in-time relational snapshots | Efficient relational storage avoiding complex OT/CRDT snapshot overhead while providing instant restore functionality. |
| **Print & PDF** | Pure CSS `@media print` | Avoids heavy client-side canvas rasterization libraries while leveraging browser-native PDF engines for crisp vector text. |

---

## 4. Video Walkthrough Outline (3-5 Minute Demo)

1. **0:00 - 0:45 | Branding, Theme Toggle & Core Editor:**
   - Showcase **Ajaia Docs** branding, Indigo `Sparkles` logo, and `AI-Native Prototype` badge.
   - Toggle Light / Dark mode to verify instant theme switching without layout shift.
   - Show the centered Google Docs paper canvas and toolbar formatting.
2. **0:45 - 1:30 | Phase A: OpenRouter AI Assistant:**
   - Click `✨ AI Assist` in the toolbar.
   - Run **3-Bullet Summary** on the architecture document.
   - Run **Expand Section Outline** to generate new headings and bullet lists directly inside the document.
3. **1:30 - 2:15 | Phase B & Sharing Permissions:**
   - Open `Share` modal as Alice: grant Bob **Can View** access.
   - Switch user to Bob via the navbar dropdown: open the document to observe the `👁️ Read-Only Mode` banner and hidden toolbar buttons.
4. **2:15 - 3:00 | Phase C: Export (Markdown & PDF):**
   - Click `📥 Export` $\rightarrow$ **Markdown (.md)** to download the markdown file.
   - Click `📥 Export` $\rightarrow$ **PDF Document (.pdf)** to open the clean print preview.
5. **3:00 - 3:45 | Phase D & E: Version History & Comments:**
   - Make an edit and click `📜 History`: preview the previous snapshot and demonstrate **"Restore this Version"**.
   - Open `💬 Comments`: post a note as Bob, switch to Alice to view, resolve, and reply.
6. **3:45 - 4:00 | Test Suite Execution:**
   - Run `npm test` in the terminal to showcase 100% passing tests for the authorization matrix.
