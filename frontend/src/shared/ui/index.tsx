import type { HTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
import logo from "@/assets/icons/divi_icon_demo.png";

export const LogoLink = ({
  to = "/",
  onClick,
}: {
  to?: string;
  onClick?: () => void;
}) => (
  <Link to={to} className="flex items-center gap-2.5" onClick={onClick}>
    <span className="flex size-9 items-center justify-center rounded-lg bg-neutral-950">
      <img src={logo} alt="" className="size-7" />
    </span>
    <span className="text-lg font-semibold tracking-tight text-neutral-900">DIVI</span>
  </Link>
);

export const buttonDark =
  "inline-flex items-center justify-center gap-2 rounded bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-700";

export const buttonLight =
  "inline-flex items-center justify-center gap-2 rounded bg-white px-5 py-3 text-sm font-medium text-neutral-900 shadow-soft transition hover:bg-neutral-50";

export const Container = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>
);

export const SectionHeading = ({
  title,
  description,
  align = "center",
}: {
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "left";
}) => (
  <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-xl"}>
    <h2 className="text-3xl font-semibold tracking-[-0.02em] text-neutral-900 sm:text-4xl lg:text-[44px] lg:leading-[1.15]">
      {title}
    </h2>
    {description && <p className="mt-4 text-base leading-relaxed text-neutral-500 sm:text-lg">{description}</p>}
  </div>
);

export const GradientButton = ({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <span className="relative inline-flex bg-[rgba(255,136,150,0.2)] p-1">
    {["top-0 left-0", "top-0 right-0", "bottom-0 left-0", "bottom-0 right-0"].map((position) => (
      <span key={position} aria-hidden="true" className={`absolute size-[3px] bg-[#fe7eb2] ${position}`} />
    ))}
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 bg-linear-to-l from-brand to-brand-pink px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
    >
      {children}
    </button>
  </span>
);

export const CheckIcon = ({ className = "size-5" }: { className?: string }) => (
  <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
    <circle cx="10" cy="10" r="9" className="fill-brand/10" />
    <path d="m6.5 10.2 2.3 2.3 4.7-4.9" className="stroke-brand" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const MissingBackendNote = ({ children }: { children: ReactNode }) => (
  <p className="text-sm font-medium text-red-600" role="note">
    Do zaimplementowania: {children}
  </p>
);

export const AppCard = ({
  children,
  className = "",
  ...rest
}: { children: ReactNode; className?: string } & HTMLAttributes<HTMLDivElement>) => (
  <div className={`rounded-xl border border-hairline bg-white p-6 shadow-soft ${className}`} {...rest}>
    {children}
  </div>
);
