# Setup Guide — Vercel + Google Sheets

## 1. Create the Google spreadsheet
Create one Google Sheet that will act as the MVP database. The backend automatically creates/repairs the tabs and headers it needs.

Keep the spreadsheet private. Copy its spreadsheet id from the URL:

`https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit`

## 2. Create Google Cloud credentials
In Google Cloud Console:
1. create/select a project;
2. enable **Google Sheets API**;
3. create a **service account**;
4. create a JSON key for that service account;
5. keep the JSON file private and never commit it.

From the key you need:
- `client_email`;
- `private_key`.

## 3. Share the spreadsheet
Share the Google Sheet with the service-account `client_email` as **Editor**.

Without this step the API can authenticate but cannot edit the spreadsheet.

## 4. Configure Vercel
Import this GitHub repository as a Vercel project.

In **Project Settings -> Environment Variables**, add:

| variable | value |
|---|---|
| `GOOGLE_SHEETS_SPREADSHEET_ID` | spreadsheet id |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | service-account email |
| `GOOGLE_PRIVATE_KEY` | full private key |
| `GRANAXP_USER_ID` | `demo` for the MVP |
| `GRANAXP_ENV` | optional label such as `production` |

For `GOOGLE_PRIVATE_KEY`, Vercel may store either real line breaks or escaped `\n`; server code normalizes escaped newlines.

Never prefix these variables with `VITE_`, `NEXT_PUBLIC_` or anything else that would expose them to the browser.

## 5. Deploy
Vercel detects static frontend files and `/api/*.js` serverless functions. `package.json` provides the `googleapis` dependency.

After deployment, test:

`https://<your-domain>/api/health`

Expected shape:

```json
{
  "ok": true,
  "service": "granaxp-api",
  "storage": "google-sheets"
}
```

The first successful state request will create the required spreadsheet tabs/headers.

## 6. Test application persistence
1. open `/demo.html` on the deployed URL;
2. continue the game;
3. register or remove an expense;
4. wait briefly for background sync;
5. refresh/open in another browser session;
6. confirm state comes back from Google Sheets;
7. inspect `State` and `Transactions` tabs in the spreadsheet.

## 7. Local/offline behavior
Opening the files directly still uses the existing `localStorage` behavior because `/api` is unavailable under `file://`.

This is intentional so the classroom demo is not dependent on internet access.

If you run a local Vercel-compatible environment in the future, remote hydration can also work locally, but that is not required for normal use.

## 8. Troubleshooting
### `/api/health` says environment variables are missing
Check Vercel env names exactly and redeploy after changes.

### Google returns permission denied
Confirm the spreadsheet is shared with the exact service-account email as Editor.

### Private key error
Re-copy the entire PEM value including `BEGIN PRIVATE KEY` and `END PRIVATE KEY` lines.

### Frontend still works but Sheets does not update
The app intentionally falls back to local state. Check browser console for `GranaXP remote sync failed` and test `/api/health`.

### Multiple people using the public deployment
Current MVP is intentionally single-user. All sessions share `GRANAXP_USER_ID`. Do not use this architecture for private real-world financial data until authentication/multi-user authorization is implemented.

## 9. Security checklist
- service-account JSON is not in Git;
- `.env` files with secrets are not committed;
- Google Sheet is not public;
- service account has access only to the required spreadsheet/project resources;
- production deployment is treated as single-user demo until auth lands.
