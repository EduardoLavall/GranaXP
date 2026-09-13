# Architecture Decisions

## ADR-001 — Vercel as deployment/runtime
Status: accepted.

Frontend static files and serverless `/api/*` endpoints live in the same Vercel project. This keeps deployment simple and same-origin.

## ADR-002 — Google Sheets as MVP database
Status: accepted for MVP only.

Sheets is chosen for simplicity, inspectability and low infrastructure cost. Storage-specific code is isolated in `server/googleSheets.js` because Sheets is not assumed to be the permanent database.

## ADR-003 — Service account, not browser Google credentials
Status: accepted.

Google API credentials are server-only Vercel environment variables. The spreadsheet must be shared with the service-account email.

## ADR-004 — Single-user server identity first
Status: accepted for MVP.

The backend uses `GRANAXP_USER_ID`. Browser-supplied user ids are not treated as authorization. Real authentication is required before multi-user deployment.

## ADR-005 — Remote-preferred + local fallback
Status: accepted.

On Vercel, the app tries to hydrate from Sheets. If unavailable, the existing `localStorage` state keeps the demo usable. Normal saves sync back to the API asynchronously.

## ADR-006 — Full state snapshot + transaction rows
Status: accepted for transition architecture.

`State` keeps the existing gameplay model easy to hydrate. `Transactions` keeps expenses human-readable/queryable and soft-deletes removed rows. This avoids rewriting all game logic during the backend migration.

## ADR-007 — Separate presentation and product demo
Status: retained.

`slides.html` remains the presentation. `demo.html` remains the application prototype. Backend work must not merge them into one monolith.

## ADR-008 — Statement imports are review-first
Status: accepted.

OCR/AI/parser output creates candidates only. The user must review/confirm before transactions enter the real dataset.

## ADR-009 — Mobile-first redesign is a separate phase
Status: accepted.

Do not mix the mobile navigation rewrite with backend persistence unless required for a specific feature. Follow `MOBILE_ROADMAP.md`.
