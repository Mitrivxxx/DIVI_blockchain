---
name: divi-landing-style
description: >-
  Keep DIVI public landing and authenticated app-shell Tailwind UI in the
  OriginX-inspired stylistic system (Figtree, canvas #F5F5F5, coral→pink brand,
  framed white cards, shadow-soft). Use when adding or editing landing sections,
  MainPage, Landing*.tsx, src/shared/verify, app-shell (/), AppHeader, or
  Tailwind on /public.
---

# DIVI public landing + app-shell style

Source of truth: `frontend/src/public/main-page/` + `frontend/src/styles/tailwind.css` + `frontend/src/shared/ui`.
Reuse primitives from `@/shared/ui` (landing `./ui` re-exports) — do not invent parallel button/heading systems.

## When this applies

- New or changed sections on `/public` (`MainPage.tsx`, `Landing*.tsx`)
- Authenticated shell (`.app-shell`): `AppHeader`, Home / Network / Institutions, feature pages
- Tailwind work in `src/shared/verify`
- Public marketing blocks that sit inside `.landing`

**Out of scope:** auth pages (`/login`, `/register`, `/auth`) SCSS — leave alone unless the user asks otherwise.

## Hard rules

1. **Shell:**  
   - Landing: `className="landing min-h-screen bg-canvas font-sans text-neutral-900 antialiased"`.  
   - App: `className="app-shell min-h-screen bg-canvas font-sans text-neutral-900 antialiased"`.
2. **Tailwind only** for landing / app-shell / shared-verify — no new SCSS modules there.
3. **Stay inside tokens** from `@theme` in `src/styles/tailwind.css`:  
   `brand`, `brand-pink`, `canvas`, `hairline`, `shadow-soft`, `font-sans` (Figtree), `font-mono`.
4. **Reuse** `Container`, `SectionHeading`, `buttonDark`, `buttonLight`, `GradientButton`, `LogoLink`, `CheckIcon`, `AppCard`, `MissingBackendNote` from `@/shared/ui`.
5. **One job per section:** one heading + short description, then content. No fake stats/testimonials.
6. **Polish copy** for public UI; keep claims honest (SHA-256, Sepolia, IPFS/Pinata, issuer approval, revoke, PDF ≤ 5 MB).
7. **Logo** is white line-art — always sit it on `bg-neutral-950` (see `LogoLink`), never bare on canvas.
8. Gaps vs backend/blockchain: use red `MissingBackendNote` — do not fake working APIs.

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
- Cards in the hero that compete with `#verify` — verify stays the centerpiece on `/public`
- New global preflight that breaks auth SCSS

## New section checklist (landing)

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

## Verify widget

- Lives in landing hero framed card `#verify` on `/public`.
- Shared components under `src/shared/verify` stay Tailwind; errors = “BŁĄD WERYFIKACJI”.

## After visual changes

Update `frontend/AGENTS.md` briefly if tokens, routes, or Tailwind rules change. Full class recipes: [recipes.md](recipes.md).
