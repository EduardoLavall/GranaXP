# Data Model Spec

Google Sheets is the MVP persistence layer. The backend manages these tabs.

## State
Columns: `user_id`, `state_json`, `updated_at`, `version`.

There is one row per MVP user. `state_json` stores the complete application/game state so the existing frontend can hydrate without duplicating business logic.

## Transactions
Columns: `id`, `user_id`, `value`, `category`, `description`, `date`, `created_at`, `updated_at`, `deleted_at`.

Each expense is stored as a row. Removed expenses are soft-deleted by filling `deleted_at`, preserving an inspectable history.

Current categories: `alimentacao`, `transporte`, `lazer`, `contas`, `saude`, `educacao`, `outros`.

## ImportJobs
Reserved for the future file-import pipeline.

Columns: `id`, `user_id`, `filename`, `mime_type`, `status`, `provider`, `created_at`, `updated_at`, `error`.

Expected statuses: `queued`, `processing`, `review`, `committed`, `failed`.

## ImportCandidates
Reserved for parsed candidate records before user confirmation.

Columns: `job_id`, `candidate_id`, `user_id`, `date`, `description`, `value`, `category`, `confidence`, `status`, `raw_json`.

Candidates are never treated as real expenses until the user explicitly accepts them.

## Frontend state contract
```js
{
  version,
  player: { name, level, xp, coins, lifetimeCoins, streak },
  budget: { monthly },
  transactions: [],
  dailyXpLogs,
  quests,
  upgrades,
  achievements,
  stats,
  preferences,
  updatedAt
}
```

## Versioning rule
Breaking state changes require a version bump, documented migration behavior, an updated frontend normalizer and an update to this spec.

## Future normalization
If Sheets remains useful beyond MVP, gameplay state may later move into dedicated tabs. Keep the public API stable and perform storage migrations behind the server adapter.
