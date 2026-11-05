---
name: frontend-development
description: >-
  DIVI frontend UI system (React 19 + Vite + Tailwind v4): Figtree, canvas
  #F5F5F5, coral→pink brand, framed white cards, shadow-soft, @/shared/ui.
  Use when working anywhere under frontend/ — landing (/public), authenticated
  app-shell (/), features, shared UI/verify, AppHeader, routing, or Tailwind
  styling — not only marketing pages.
---

# DIVI frontend development

Source of truth: `frontend/src/styles/tailwind.css` + `frontend/src/shared/ui` (+ landing re-exports from `public/main-page/components/ui`).
Reuse `@/shared/ui` — do not invent parallel button/heading/card systems.

## When this applies

- **Any** UI under `frontend/` (features, layout, shared, public landing, verify)
- New routes / nav / AppHeader / feature folders
- Tailwind tokens, spacing, typography, cards, CTAs
- Polish user-facing copy in the product UI

**Out of scope unless the user asks:** rewrite of legacy auth pages (`/login`, `/register`, `/auth`) CSS — leave those files alone; do not add new SCSS.

## Hard rules

1. **Shells:**  
   - Landing: `className="landing min-h-screen bg-canvas font-sans text-neutral-900 antialiased"`.  
   - Authenticated app: `className="app-shell min-h-screen bg-canvas font-sans text-neutral-900 antialiased"`.
2. **Tailwind only** for landing, app-shell, shared, and features — no new SCSS; no parallel CSS module systems for new UI.
3. **Stay inside tokens** from `@theme` in `src/styles/tailwind.css`:  
   `brand`, `brand-pink`, `canvas`, `hairline`, `shadow-soft`, `font-sans` (Figtree), `font-mono`.
4. **Reuse** `Container`, `SectionHeading`, `buttonDark`, `buttonLight`, `GradientButton`, `LogoLink`, `CheckIcon`, `AppCard`, `MissingBackendNote` from `@/shared/ui`.
5. **One job per section/page block:** one heading + short description, then content. No fake stats/testimonials.
6. **Polish copy** for user-facing UI; keep claims honest (SHA-256, Sepolia, IPFS/Pinata, issuer approval, revoke, PDF ≤ 5 MB).
7. **Logo** is white line-art — always sit it on `bg-neutral-950` (see `LogoLink`), never bare on canvas.
8. Gaps vs backend/blockchain: use red `MissingBackendNote` — do not fake working APIs.
9. **Features:** `frontend/src/app/features/<name>/` with `hooks/`, `components/`, `api/` + main component; route in `App.tsx` under `MainLayout`; nav in `navigation/routes.ts` / `AppHeader` if needed.

## Visual system (do not drift)

| Role | Spec |
| ---- | ---- |
| Page bg | `bg-canvas` (`#f5f5f5`) |
| Headings | `font-semibold tracking-[-0.02em]` / hero `[-0.03em]`; `text-neutral-900` |
| Body | `text-base leading-relaxed text-neutral-500` (supporting `sm:text-lg`) |
| Accent | `bg-linear-to-l from-brand to-brand-pink` (fills, text clip, glow) |
| Primary CTA | `buttonDark` — `bg-neutral-950 … rounded … text-sm … hover:bg-neutral-700` |
| Secondary CTA | `buttonLight` — white + `shadow-soft` |
| Wallet / special CTA | `GradientButton` only (pixel corner squares) |
| Framed hero card | `rounded-[20px] border-[12px] border-white/50 bg-white bg-clip-padding shadow-soft` |
| Feature / soft cards | `rounded-xl border border-white bg-linear-to-b from-white to-white/20 p-7` |
| Solid white cards | `AppCard` / `rounded-xl bg-white … shadow-soft` or `border border-hairline` |
| FAQ rows | `border border-hairline` → `hover:border-neutral-300`; open → `border-neutral-300` |
| Section rhythm | `py-14 lg:py-20`; grids `gap-4` / `lg:gap-6`; heading→content `mt-12 lg:mt-16` |
| Anchors | `scroll-mt-16` (or `scroll-mt-24` under sticky header) |
| Container | `Container` → `max-w-7xl px-4 sm:px-6 lg:px-8` |

### Forbidden (AI / off-brand look)

- Purple / indigo gradients, glow neon stacks, `rounded-full` pill button clusters
- Warm cream `#F4F1EA` + terracotta + display serif
- Broadsheet / hairline newspaper layouts
- Flat single-color hero with no atmosphere (prefer soft grid mask or brand blur like hero)
- On `/public`, cards in the hero that compete with `#verify` — verify stays the centerpiece
- New global preflight that breaks auth CSS

## New landing section checklist

```
- [ ] File: frontend/src/public/main-page/components/LandingXxx.tsx
- [ ] Export named component; import into MainPage.tsx in a sensible order
- [ ] Wrap with <section> + Container (+ SectionHeading if it has a title)
- [ ] Spacing py-14 lg:py-20; no one-off max widths except framed cards (~1000px)
- [ ] Buttons from shared/ui
- [ ] If nav-worthy: add header + footer anchor, id + scroll-mt-*
- [ ] Honest Polish copy; no fabricated metrics
- [ ] Desktop + ~390px: no horizontal overflow
```

## New authenticated feature checklist

```
- [ ] Feature folder under frontend/src/app/features/<name>/
- [ ] Route in App.tsx under MainLayout; path/nav in routes.ts / AppHeader if needed
- [ ] Tailwind + AppCard / shared/ui; Polish copy
- [ ] API helpers in feature api/; no fake backends (use MissingBackendNote)
```

## Verify widget

- Landing hero framed card `#verify` on `/public`; app also has `features/Verify`.
- Shared components under `src/shared/verify` stay Tailwind; errors = “BŁĄD WERYFIKACJI”.

## After visual / FE structure changes

Update `frontend/AGENTS.md` briefly (and root `AGENTS.md` if routing/architecture changes). Class recipes: [recipes.md](recipes.md).
