import { type ReactNode } from "react";

type VerifyResultVariant = "verified" | "revoked" | "missing" | "error" | "verifying";

type VerifyResultProps = {
  variant: VerifyResultVariant;
  title: string;
  description?: string;
  children?: ReactNode;
};

const STYLES: Record<VerifyResultVariant, { box: string; icon: string; symbol: string }> = {
  verified: {
    box: "border-emerald-200 bg-emerald-50",
    icon: "bg-emerald-600 text-white",
    symbol: "✓",
  },
  revoked: {
    box: "border-rose-200 bg-rose-50",
    icon: "bg-rose-600 text-white",
    symbol: "⊘",
  },
  missing: {
    box: "border-amber-200 bg-amber-50",
    icon: "bg-amber-500 text-white",
    symbol: "?",
  },
  error: {
    box: "border-rose-200 bg-rose-50",
    icon: "bg-rose-600 text-white",
    symbol: "×",
  },
  verifying: {
    box: "border-neutral-200 bg-neutral-50",
    icon: "bg-white text-neutral-700 ring-1 ring-neutral-200",
    symbol: "",
  },
};

export const VerifyResult = ({ variant, title, description, children }: VerifyResultProps) => {
  const styles = STYLES[variant];

  return (
    <div
      data-variant={variant}
      role="status"
      aria-live="polite"
      className={`flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 ${styles.box}`}
    >
      <div className="flex items-start gap-3.5">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-full text-base font-bold ${styles.icon}`}
          aria-hidden="true"
        >
          {variant === "verifying" ? (
            <span className="size-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
          ) : (
            styles.symbol
          )}
        </span>
        <div>
          <p className="text-sm font-semibold tracking-wide text-neutral-900">{title}</p>
          {description ? <p className="mt-1 text-sm leading-relaxed text-neutral-600">{description}</p> : null}
        </div>
      </div>
      {children ? <div className="shrink-0">{children}</div> : null}
    </div>
  );
};
