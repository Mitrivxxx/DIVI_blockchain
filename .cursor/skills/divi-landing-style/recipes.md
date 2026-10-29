# Landing class recipes

Copy-paste patterns from the current public page. Prefer these over improvising.

## Buttons

```tsx
import { buttonDark, buttonLight, GradientButton } from "./ui";

<a href="#verify" className={buttonDark}>Zweryfikuj dokument</a>
<a href="/auth" className={buttonLight}>Załóż konto</a>
<GradientButton onClick={onConnect}>Podłącz portfel</GradientButton>
```

Dark CTA on dark CTA band (e.g. `LandingCta`): white fill / ghost border — do not use `buttonLight`’s soft shadow there.

## Section heading

```tsx
<SectionHeading title="…" description="…" />           // center
<SectionHeading align="left" title="…" description="…" />
```

Classes baked in: `text-3xl … sm:text-4xl lg:text-[44px] lg:leading-[1.15]`, description `mt-4 text-neutral-500`.

## Feature grid card

```tsx
<li className="rounded-xl border border-white bg-linear-to-b from-white to-white/20 p-7 transition hover:border-neutral-200">
  <span className="flex size-11 items-center justify-center rounded-lg bg-brand/10 text-brand">{icon}</span>
  <h3 className="mt-6 text-xl font-semibold tracking-tight text-neutral-800">…</h3>
  <p className="mt-2 text-base leading-relaxed text-neutral-500">…</p>
</li>
```

Grid: `mt-12 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3 lg:gap-6`.

## Framed white panel (hero / how-it-works)

```tsx
<div className="rounded-[20px] border-[12px] border-white/50 bg-white bg-clip-padding shadow-soft">
  …
</div>
```

Optional glow behind:  
`absolute … rounded-full bg-linear-to-l from-brand/25 to-brand-pink/25 blur-3xl`.

## Soft panel (issuers band)

```tsx
<div className="rounded-[20px] border border-white bg-linear-to-b from-white to-white/30 p-6 sm:p-10 lg:p-14">
```

## Chip / pill

```tsx
<span className="rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-sm font-medium text-neutral-700">
  …
</span>
```

Eyebrow badge (hero): same + `text-xs text-neutral-600 shadow-sm` and a brand gradient dot.

## FAQ item

```tsx
<li className={`rounded-xl border bg-white/60 transition ${open ? "border-neutral-300" : "border-hairline hover:border-neutral-300"}`}>
  <button type="button" className="flex w-full items-center justify-between gap-6 p-6 text-left text-lg font-medium text-neutral-900">
    …
  </button>
</li>
```

## Step number (issuers)

```tsx
<span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-linear-to-l from-brand to-brand-pink text-sm font-semibold text-white">
  {n}
</span>
```

## Icons

Inline SVG: `viewBox="0 0 24 24"`, `strokeWidth="1.6"`, `strokeLinecap="round"`, `strokeLinejoin="round"`, size `size-5`. Prefer `text-brand` / `bg-brand/10` over multicolor icons. Use `CheckIcon` for checklist rows.

## Dark CTA band

```tsx
<div className="relative overflow-hidden rounded-[20px] bg-neutral-950 px-6 py-14 text-center sm:px-12 lg:py-20">
  {/* brand blur orb */}
  <h2 className="text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl lg:text-[44px] …">…</h2>
  <p className="mt-4 text-neutral-400 …">…</p>
</div>
```

## Typography scale reminder

| Element | Classes |
| ------- | ------- |
| Hero h1 | `text-4xl sm:text-5xl lg:text-[64px] lg:leading-[1.08] font-semibold tracking-[-0.03em]` |
| Section h2 | via `SectionHeading` |
| Card h3 | `text-xl font-semibold tracking-tight text-neutral-800` or `text-lg … text-neutral-900` |
| Mono hash | `font-mono text-sm` |

## Reference files

- Tokens / reset: `frontend/src/styles/tailwind.css`
- Primitives: `frontend/src/public/main-page/components/ui.tsx`
- Composition: `MainPage.tsx` + sibling `Landing*.tsx`
- Verify UI: `frontend/src/shared/verify/`
