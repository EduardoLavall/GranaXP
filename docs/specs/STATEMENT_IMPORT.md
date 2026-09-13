# Statement Import Spec

## Goal
Allow users to import bank statements or transaction files and convert them into reviewable GranaXP expense candidates.

This is a planned feature, not yet implemented.

## Accepted inputs — target
Prioritize structured formats first:
1. CSV;
2. OFX/QFX when available;
3. XLSX;
4. text-based PDF;
5. scanned/image PDF only when OCR is required.

Structured formats should never be sent to an LLM if deterministic parsing is enough.

## Required pipeline
```text
UPLOAD
  -> FILE VALIDATION
  -> TEXT/ROW EXTRACTION
  -> NORMALIZATION
  -> CATEGORY SUGGESTION
  -> DUPLICATE DETECTION
  -> USER REVIEW
  -> CONFIRM
  -> REAL TRANSACTIONS
```

No parser, OCR tool or AI provider may directly create final expenses without the review step.

## Provider architecture
Backend code should expose a provider-neutral interface such as:

```js
parseStatement({ file, mimeType, providerOptions })
  -> {
       metadata,
       candidates: [
         { date, description, value, direction, category, confidence, raw }
       ]
     }
```

Possible future adapters:
- deterministic CSV/OFX parser;
- PDF text parser;
- Google Document AI / Vision OCR;
- Gemini structured extraction;
- other LLM providers with structured JSON output;
- local/offline parser for privacy-sensitive workflows.

Do not hard-wire business logic to one AI vendor.

## Backend-only rule
Files and extracted statement data must go to `/api/*` endpoints. API keys and provider credentials live only in Vercel environment variables.

The frontend receives normalized candidates, never provider secrets.

## Candidate lifecycle
`queued` -> `processing` -> `review` -> (`accepted` / `rejected` / `edited`) -> `committed`

On commit:
- accepted candidates become transactions;
- rejected candidates remain audit metadata only;
- imports must not pay duplicate quest/XP rewards simply because an old transaction was re-imported.

## Duplicate detection
Use a stable fingerprint candidate, for example:
`normalized date + absolute value + normalized description + account/import scope`.

Exact strategy must be spec'd before implementation because statements can contain legitimate repeated purchases.

## Category suggestion
AI/category models may suggest, not dictate, categories.
Store confidence when available and let the user edit before commit.

## Privacy / data minimization
- process only what is needed;
- avoid storing original statement files unless a clear retention policy exists;
- sanitize logs;
- do not log raw account numbers or entire statement text;
- document which external provider receives data before enabling it;
- provide a non-AI deterministic path for structured files whenever practical.

## Vercel constraints
Large PDFs/OCR may exceed serverless request/runtime limits. If that happens, use direct upload/object storage plus asynchronous job processing rather than increasing frontend complexity.

## First implementation milestone
Build CSV/OFX import before PDF AI extraction. It gives deterministic behavior and establishes the candidate-review-commit UX that every later provider can reuse.
