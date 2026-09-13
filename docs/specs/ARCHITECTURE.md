# Architecture Spec

## Runtime shape
GranaXP is deployed as a single Vercel project:

```text
Browser
  |
  | static HTML/CSS/JS
  v
Vercel
  |-- slides.html / demo.html / assets / js / css
  |-- /api/health
  |-- /api/state
  |
  v
Server-only integration layer (`server/`)
  |
  v
Google Sheets API
  |
  v
Google Spreadsheet (MVP database)
```

## Frontend
The existing presentation and game UI remain framework-free HTML/CSS/JavaScript.

`demo.html` loads:
1. icons/audio;
2. `api-client.js`;
3. `storage.js`;
4. `bootstrap.js`;
5. `demo.js` only after remote hydration attempt.

### Persistence strategy
Deployed mode is **remote-preferred, local-fallback**:
- boot tries `GET /api/state`;
- if a remote state exists, it hydrates `localStorage` before the game starts;
- if no remote row exists, the current local/demo state seeds the backend;
- every normal local save is queued to `PUT /api/state`;
- if remote sync fails, the local save is preserved.

This preserves the offline classroom demo while allowing Vercel to persist to Sheets.

## Backend
Vercel serverless functions live in `api/`.
Shared server code lives in `server/`; it must never be imported by browser scripts.

Current endpoints:
- `GET /api/health`
- `GET /api/state`
- `PUT /api/state`

The backend owns Google credentials and the fixed MVP user identity.

## Google Sheets adapter
`server/googleSheets.js` owns all Sheets-specific behavior. Application/browser code must not know spreadsheet ranges or credentials.

On first successful access it ensures these tabs exist:
- `State`
- `Transactions`
- `ImportJobs`
- `ImportCandidates`

`State` stores the complete serialized gameplay state for simple MVP hydration.
`Transactions` stores expenses as queryable rows and tombstones deletions.
Import sheets reserve the data contract for future statement ingestion.

## Security boundary
Secrets:
- Google service-account email;
- Google private key;
- spreadsheet id;

exist only in Vercel env variables.

Never expose them in HTML, JS bundles, Git history, query strings or browser storage.

## Why Sheets now
Advantages for MVP:
- cheap/simple;
- human-readable;
- easy classroom inspection;
- Google API ecosystem;
- no separate database infrastructure.

Known limits:
- weak transactional semantics;
- poor high-concurrency behavior;
- API quotas/latency;
- awkward relational queries;
- not suitable for large-scale multi-user workloads.

All persistence is therefore behind an adapter so a later migration to Postgres/Supabase/etc. does not require rewriting game/UI logic.

## Future boundaries
### Authentication
Before multi-user launch, introduce real auth/session identity. Do not accept arbitrary `userId` from browser requests as authorization.

### Statement import
Use a backend import pipeline and provider adapters. See `STATEMENT_IMPORT.md`.

### Mobile
Current UI remains responsive but a dedicated mobile-first information architecture is planned. See `MOBILE_ROADMAP.md`.
