# Feature 5 — Landing pitch deck (`/`)

Enterprise acceptance for the judge-facing marketing surface.  
This page is the pitch deck: problem, mechanism, differentiator, demo paths.

## Voice

Precise, not hype. Brand first. Show enforcement — bond, BTC proof, slash.

## Scope (in)

- Full-bleed hero with Covenant as the hero-level brand signal
- Animated bond lifecycle visual (Locked → BTC → Released / Slashed)
- Pitch sections: Problem → Mechanism → Why it wins → What to click → Close
- Scroll reveals + hero entrance motion (respects `prefers-reduced-motion`)
- Landing nav stays marketing-style (How it works / Demo / Protocol) with a gold **Dashboard** CTA into `/app`
- In-app nav (AppShell) keeps Create / Solve / Explore / Protocol after you enter the product

## Scope (out)

- New product features beyond navigation into existing consoles
- Seed / dummy settlement data on the landing visual (illustrative loop only)

## Acceptance checklist

- [x] First viewport: brand, one headline, one sentence, CTAs, dominant visual
- [x] Brand remains readable without the nav
- [x] Bond lifecycle cycles with intentional motion
- [x] Demo paths (happy + slash) are explicit
- [x] Desktop + mobile layout load without overflow
- [x] `npm run build` includes `/`

## Primary files

- `frontend/app/page.tsx`
- `frontend/components/BondLifecycleVisual.tsx`
- `frontend/components/Reveal.tsx`
- `frontend/components/MarketingNav.tsx`
- `frontend/app/globals.css`
