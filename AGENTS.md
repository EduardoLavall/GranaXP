# AGENTS.md — GranaXP AI Working Agreement

This repository is maintained with human + AI collaboration. Treat the files under `docs/specs/` as the product/architecture contract.

## Before changing code
1. Read `docs/specs/PRODUCT.md`.
2. Read `docs/specs/ARCHITECTURE.md`.
3. Read the spec related to your change (`API.md`, `DATA_MODEL.md`, `MOBILE_ROADMAP.md`, `STATEMENT_IMPORT.md`).
4. Check `docs/specs/DECISIONS.md` for constraints already decided.
5. If your change alters behavior, data shape, endpoints, persistence, security, or UX architecture, update the relevant spec in the same PR.

## Non-negotiable architecture rules
- Frontend secrets are forbidden. Google credentials exist only in Vercel server environment variables.
- The browser must never call Google Sheets API directly.
- `/api/*` is the only boundary between frontend and external persistence/services.
- Google Sheets is the MVP database, not a forever database. Keep storage access behind `server/` abstractions so it can be replaced later.
- Current MVP identity is single-user via `GRANAXP_USER_ID`. Do not fake multi-user security with client-provided user IDs.
- Local/offline mode must remain usable when the API is unavailable; remote state is preferred when deployed.
- Financial actions must never award more XP because a user spent more money.
- Bank-statement imports must always have a review/confirmation step before candidates become real expenses.
- AI/OCR providers must be called from backend code only and hidden behind a provider interface.

## Spec-driven change protocol
For a meaningful feature, PRs should contain:
1. spec update;
2. code implementation;
3. configuration/docs update when needed;
4. validation notes and known limitations.

Prefer small, reversible changes. Do not silently rewrite the visual identity or gamification rules while implementing infrastructure.

## Definition of done
- No credentials committed.
- Existing presentation/demo flow still works.
- API errors degrade gracefully instead of destroying local state.
- Data model changes are documented.
- New environment variables are added to `.env.example` and `docs/SETUP.md`.
- New endpoints are documented in `docs/specs/API.md`.
- Import/mobile work follows the dedicated roadmap/spec.
