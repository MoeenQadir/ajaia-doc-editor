# AI-Native Workflow Note

**Candidate:** Muhammad Moeen Ul Qadir (bsf1804461@ue.edu.pk)  
**Role:** AI-Native Full Stack Product Engineer  
**Project:** Ajaia Docs  

---

## 1. AI Tools Utilized
During this build, I incorporated a modern AI-assisted engineering workflow:
- **Claude / Cursor / Antigravity Agent:** Used for rapid full-stack scaffolding, schema drafting, and component architecture.
- **OpenRouter API (`gpt-4o-mini` & `meta-llama/llama-3.3-70b-instruct:free`):** Embedded directly inside the product as the in-app intelligence layer for text summarization, tone polishing, and section outline expansion.

---

## 2. Where AI Materially Sped Up Development
1. **TipTap Extension Scaffolding:** Quickly wiring up StarterKit, Underline, and custom bubble menus with Tailwind typography styling without memorizing low-level TipTap ProseMirror schema APIs.
2. **File Parser Construction:** Writing the Markdown-to-HTML parser that handles nested bullet lists, numbered lists, inline code blocks, and sanitization regexes.
3. **Database Schema & Seed Data Generation:** Crafting realistic PRDs, architecture specifications, and sync notes for the starter template gallery in seconds.
4. **Test Suite Generation:** Generating edge cases for document authorization (owner vs editor vs viewer vs stranger) in Vitest.

---

## 3. What AI-Generated Output Was Changed or Rejected

| Area | Initial AI Proposal | Engineering Decision / Rejection | Rationale |
| :--- | :--- | :--- | :--- |
| **AI Canvas Interaction** | Immediately replacing or overwriting active editor text on button click. | **Rejected:** Built a dedicated preview playground with **Copy Output**, **Clear / Discard**, and optional **Insert**. | Destructive replacement is a poor user experience. Users need to inspect AI output first and copy/clear without polluting their work. |
| **Toolbar Scrolling & Popups** | Placed `overflow-x-auto` directly on the parent toolbar containing the absolute dropdown. | **Rejected & Refactored:** Separated formatting buttons into an inner scroll container; kept AI popup in an unconstrained container. | CSS overflow containers clip absolute dropdowns, causing truncated popups. |
| **Delete Confirmation** | Native browser `window.confirm()`. | **Rejected:** Replaced with custom Framer Motion `ConfirmModal`. | Native alert/confirm freezes browser execution threads and looks unpolished. |
| **Authentication Strategy** | Heavy NextAuth setup with JWT tokens and mock providers. | **Rejected:** Lightweight simulated user switcher with `x-user-id` HTTP headers. | Prevents reviewer friction and external credential dependencies while delivering 100% of the access-control logic. |

---

## 4. How Correctness, UX Quality, and Reliability Were Verified
1. **Automated Testing:** Vitest test suites (`tests/sharing.test.ts` and `tests/fileParser.test.ts`) verifying access permissions and file sanitization on every build.
2. **Deterministic Fallbacks:** The `/api/ai` route features structured offline fallbacks so the application never hangs or crashes even if the OpenRouter key is unset or rate-limited.
3. **Responsive Stress Testing:** Manual inspection across mobile (375px), tablet, and desktop viewports, validating that toolbars, headers, and modals never trigger horizontal layout clipping.
4. **Clean Production Builds:** All TypeScript checks, linting, and Next.js static asset compilations were verified locally with `npm run build` exiting cleanly with code 0.

