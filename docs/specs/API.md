# API Spec

Base path: `/api`

The API is same-origin with the Vercel-hosted frontend. Current MVP is single-user; server-side `GRANAXP_USER_ID` selects the row namespace.

## GET /api/health
Checks server configuration and Google Sheets connectivity.

### 200
```json
{
  "ok": true,
  "service": "granaxp-api",
  "environment": "production",
  "storage": "google-sheets",
  "spreadsheet": { "title": "GranaXP DB" }
}
```

### 500
```json
{
  "ok": false,
  "error": "backend_unavailable",
  "message": "..."
}
```

Do not expose credentials or spreadsheet id in the response.

## GET /api/state
Returns the complete persisted MVP state.

### 200 with data
```json
{
  "state": { "version": 1, "player": {}, "budget": {}, "transactions": [] },
  "source": "google-sheets"
}
```

### 200 before first seed
```json
{ "state": null, "source": "empty" }
```

## PUT /api/state
Writes the complete MVP state and synchronizes transaction rows.

Body may be either:
```json
{ "state": { "version": 1, "player": {}, "budget": {}, "transactions": [] } }
```
or the state object directly.

Minimum validation:
- object;
- `player` object;
- `budget` object;
- `transactions` array;
- payload <= 250 KB.

### 200
```json
{ "ok": true, "updatedAt": 1234567890 }
```

### 400
```json
{ "error": "invalid_state", "message": "..." }
```

## Error philosophy
Frontend persistence is local-first for failure handling. A failed remote write must not delete or corrupt the local save.

## Planned API — not implemented yet
Do not pretend these exist until code lands:

- `POST /api/imports` — upload/register statement import job;
- `GET /api/imports/:id` — import status/candidates;
- `POST /api/imports/:id/confirm` — commit reviewed candidates;
- auth/session endpoints or provider integration;
- categorized analytics endpoints if client-side calculation stops being sufficient.

Any new endpoint must update this file in the same PR.
