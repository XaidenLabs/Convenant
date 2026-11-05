# Feature 1 — Create console (`/app`)

Enterprise acceptance for the creator write-path surface.  
**Do not start Feature 2 (Solver) until this checklist is green.**

## Problem this feature solves

A remittance / payroll sender must post an enforceable intent, compare bonded
quotes, lock a winner, and either settle BTC delivery or slash — without
forcing the Bitcoin recipient to create an account.

## Scope (in)

- Intent form with validation + presets
- Session intent shelf
- Ranked quote list with “best quote”
- Settlement timeline + next-action guidance
- Deadline clock + copyable Chain Signatures path
- Happy path + slash path walkthroughs
- Local stub vs live mode banner
- Activity feed + wallet connect (no email login)
- New intent reset

## Scope (out — later features)

- Solver worker UX → Feature 2 `/solver`
- Public indexed explorer → Feature 3 `/explore`
- Architecture narrative → Feature 4 `/protocol`

## Acceptance checklist

- [x] Page loads with clear Create identity and mode banner
- [x] Invalid BTC address / sats / deadline blocked before submit
- [x] Post intent creates shelf entry and advances next-action
- [x] Demo quote ranks and marks best active quote
- [x] Select winner locks bond and shows derivation path
- [x] Trigger settlement → Completed / Bond Released
- [x] Simulate Failure → Failed / Bond Slashed (or handover)
- [x] One-click happy path and slash path work offline
- [x] New intent clears active workspace
- [x] No account signup; wallet optional until write
- [x] `npm run build` passes for `/app`

## Primary files

- `frontend/app/app/page.tsx`
- `frontend/hooks/useCreateConsole.ts`
- `frontend/components/IntentForm.tsx`
- `frontend/components/QuoteList.tsx`
- `frontend/components/SettlementPanel.tsx`
- `frontend/components/NextActionCard.tsx`
- `frontend/components/ModeBanner.tsx`
- `frontend/components/DeadlineClock.tsx`
- `frontend/lib/bitcoin.ts`
- `frontend/lib/next-action.ts`
