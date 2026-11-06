import type { ReactNode } from "react";
import { AppCard } from "@/shared/ui";

export type ProfileHeroVariant = "person" | "institution";

type ProfileHeroPanelProps = {
  variant?: ProfileHeroVariant;
  /** Avatar / logo node — place image or fallback inside. */
  avatar: ReactNode;
  title: ReactNode;
  /** Badge, edit control, verify chip next to the title. */
  titleAside?: ReactNode;
  /** Bio / tagline under the title. */
  subtitle?: ReactNode;
  /** Muted secondary line (role · location · joined). */
  meta?: ReactNode;
  /** Primary / secondary CTAs under identity. */
  actions?: ReactNode;
  /** Extra details below the hero identity (forms, links, errors). */
  children?: ReactNode;
  /** Bottom nav (e.g. ProfileNavTabs) — full-bleed under the body. */
  tabs?: ReactNode;
  className?: string;
};

/** Cover atmosphere — brand wash + soft orbs (no purple / neon). */
const Cover = ({ variant }: { variant: ProfileHeroVariant }) => (
  <div
    className={`relative h-36 overflow-hidden sm:h-40 ${
      variant === "institution"
        ? "bg-linear-to-br from-neutral-900 via-neutral-800 to-neutral-700"
        : "bg-neutral-100"
    }`}
    aria-hidden="true"
  >
    {variant === "person" ? (
      <>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.04)_1px,transparent_0)] bg-size-[18px_18px]" />
        <div className="absolute -right-8 -top-10 size-56 rounded-full bg-linear-to-l from-brand/30 to-brand-pink/25 blur-3xl" />
        <div className="absolute -bottom-16 left-8 size-48 rounded-full bg-linear-to-l from-brand-pink/20 to-brand/15 blur-3xl" />
      </>
    ) : (
      <>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08)_1px,transparent_0)] bg-size-[20px_20px]" />
        <div className="absolute -right-6 top-0 size-44 rounded-full bg-linear-to-l from-brand/40 to-brand-pink/30 blur-2xl" />
        <div className="absolute -bottom-10 left-10 size-40 rounded-full bg-brand-pink/20 blur-2xl" />
      </>
    )}
  </div>
);

/**
 * LinkedIn-inspired identity shell: cover → overlapping avatar → title → tagline → meta → CTAs.
 * Tokens stay inside DIVI (Figtree, brand coral→pink, AppCard, no pill clusters).
 */
export const ProfileHeroPanel = ({
  variant = "person",
  avatar,
  title,
  titleAside,
  subtitle,
  meta,
  actions,
  children,
  tabs,
  className = "",
}: ProfileHeroPanelProps) => (
  <AppCard className={`overflow-hidden p-0 ${className}`}>
    <Cover variant={variant} />
    <div className="relative px-5 pb-6 sm:px-6">
      <div className="-mt-12 w-fit sm:-mt-14">{avatar}</div>

      <div className="mt-4 space-y-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="min-w-0 text-2xl font-semibold tracking-[-0.02em] text-neutral-900 sm:text-[1.75rem]">
            {title}
          </div>
          {titleAside}
        </div>
        {subtitle ? (
          <div className="max-w-2xl text-base leading-relaxed text-neutral-700">{subtitle}</div>
        ) : null}
        {meta}
      </div>

      {actions ? <div className="mt-5 flex flex-wrap items-center gap-3">{actions}</div> : null}

      {children}
    </div>
    {tabs}
  </AppCard>
);

/** Grey meta row joined with middots. */
export const ProfileMetaLine = ({
  items,
}: {
  items: Array<ReactNode | null | undefined | false>;
}) => {
  const parts = items.filter(Boolean) as ReactNode[];
  if (parts.length === 0) return null;

  return (
    <p className="flex flex-wrap items-center gap-x-0 text-sm text-neutral-500">
      {parts.map((part, index) => (
        <span key={index} className="inline-flex items-center">
          {index > 0 ? (
            <span className="mx-1.5 text-neutral-300" aria-hidden="true">
              ·
            </span>
          ) : null}
          {part}
        </span>
      ))}
    </p>
  );
};

export const ProfileAvatarFrame = ({
  children,
  shape = "circle",
  className = "",
}: {
  children: ReactNode;
  shape?: "circle" | "rounded";
  className?: string;
}) => (
  <div
    className={`relative overflow-hidden border-[3px] border-white bg-neutral-100 shadow-soft ${
      shape === "circle" ? "size-28 rounded-full sm:size-32" : "size-28 rounded-xl sm:size-32"
    } ${className}`}
  >
    {children}
  </div>
);

export default ProfileHeroPanel;
