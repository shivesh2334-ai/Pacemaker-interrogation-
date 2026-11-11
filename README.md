# Pacemaker Interrogation Analyzer

React/Vite implementation of the supplied component with compiled Tailwind styles, Lucide icons, manual parameter entry, rule-based findings, searchable knowledge passages, references, printable reports, and optional Claude extraction, analysis and reference search.

## Run

Node.js 22 or newer:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Manual analysis and knowledge search work without credentials. Add `ANTHROPIC_API_KEY` to `.env.local` for AI features. Optionally set `ANTHROPIC_MODEL` to an available Claude model. The API key is server-only. Do not prefix it with VITE_. Uploads and optional AI requests transmit data to Anthropic; avoid identifiers in reports and free-text notes. Patient data is not intentionally persisted by this app.

## Build / deploy

`npm run build` produces dist. Import this folder into Vercel, select Vite and configure ANTHROPIC_API_KEY as a server environment variable. The included /api/claude.js is a Node serverless endpoint. A static-only host supports manual analysis but needs a separate backend for AI. `npm run preview` serves the static build only; `npm run dev` includes the local API.

Before opening a paid AI endpoint to the public, add authenticated access and durable usage quotas. This implementation has same-origin checks and request size limits, but does not include multi-user authentication or billing controls.

## Verification

`npm test` checks API method, origin and missing-configuration behavior. Production build passes. Browser verification was attempted but blocked by this environment’s Chromium process restrictions. Live AI requires credentials and is not validated by these tests.

The clinical corpus and rule thresholds are inherited from the supplied component; they have not undergone guideline or device-specific clinical validation. The app starts blank. Demo data loads explicitly. Extraction resets missing fields rather than retaining demo or prior-patient values. All extracted values require clinician verification. High pacing burden alone does not establish pacemaker dependency.
