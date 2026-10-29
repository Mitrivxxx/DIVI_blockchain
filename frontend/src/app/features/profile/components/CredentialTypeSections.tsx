import React from "react";
import { Link } from "react-router-dom";
import { resolveAvatarSrc } from "../api/profileApi";
import type { CredentialItem, CredentialSection, CredentialVisibility } from "../types";
import {
  documentStatusLabel,
  formatDocumentPeriod,
  formatIssuerLabel,
  shortHex,
} from "@/types/documents";
import { AppCard } from "@/shared/ui";

const VISIBILITY_OPTIONS: CredentialVisibility[] = ["private", "unlisted", "public"];

/** Shared shape for owner + public credential rows. */
export type CredentialDisplayItem = {
  hash: string;
  status: number;
  issuedAt: string;
  periodStart?: string | null;
  expiresAt?: string | null;
  title?: string | null;
  issuerAddress: string;
  issuerDisplayName?: string | null;
  issuerLogoUrl?: string | null;
  visibility?: CredentialVisibility;
  shareToken?: string | null;
};

export type CredentialDisplaySection = {
  documentType: number;
  label: string;
  items: CredentialDisplayItem[];
};

type CredentialTypeSectionsProps = {
  sections: CredentialDisplaySection[] | CredentialSection[];
  loading?: boolean;
  error?: string | null;
  /** When true, hide per-document visibility / share controls (public /u view). */
  readOnly?: boolean;
  visibilityUpdatingHash?: string | null;
  copiedShareFor?: string | null;
  onCopyShare?: (hash: string, sharePath: string) => void;
  onVisibilityChange?: (hash: string, visibility: CredentialVisibility) => void;
};

const formatIssuedMonthYear = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString("pl-PL", { month: "short", year: "numeric" });
  } catch {
    return "—";
  }
};

const initialsFromName = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
};

const IssuerLogo: React.FC<{ name: string; logoUrl?: string | null }> = ({ name, logoUrl }) => {
  const src = logoUrl?.trim() ? resolveAvatarSrc(logoUrl, "") : "";
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className="size-12 shrink-0 rounded-lg border border-hairline object-cover bg-neutral-100"
      />
    );
  }

  return (
    <span
      className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-neutral-950 text-xs font-semibold tracking-wide text-white"
      aria-hidden="true"
    >
      {initialsFromName(name)}
    </span>
  );
};

const CredentialEntry: React.FC<{
  credential: CredentialDisplayItem;
  readOnly: boolean;
  busy: boolean;
  copiedShareFor: string | null;
  onCopyShare?: (hash: string, sharePath: string) => void;
  onVisibilityChange?: (hash: string, visibility: CredentialVisibility) => void;
}> = ({ credential, readOnly, busy, copiedShareFor, onCopyShare, onVisibilityChange }) => {
  const sharePath = credential.shareToken ? `/share/${credential.shareToken}` : null;
  const institution = formatIssuerLabel(credential.issuerDisplayName, credential.issuerAddress);
  const title = credential.title?.trim();
  const issuedLabel = credential.periodStart
    ? formatDocumentPeriod(credential.periodStart, credential.expiresAt)
    : formatIssuedMonthYear(credential.issuedAt);

  return (
    <article className="flex gap-4 border-t border-hairline pt-5 first:border-t-0 first:pt-0">
      <IssuerLogo name={institution} logoUrl={credential.issuerLogoUrl} />

      <div className="min-w-0 flex-1">
        <h4 className="text-base font-semibold tracking-[-0.01em] text-neutral-900">
          {title || institution}
        </h4>
        {title ? (
          <p className="mt-0.5 text-sm text-neutral-800">{institution}</p>
        ) : null}
        <p className="mt-0.5 text-sm text-neutral-800">
          {documentStatusLabel(credential.status)}
          <span className="text-neutral-400"> · </span>
          dokument on-chain
        </p>
        <p className="mt-0.5 text-sm text-neutral-500">{issuedLabel}</p>
        <p className="mt-1.5 font-mono text-xs text-neutral-500" title={credential.hash}>
          Hash: {shortHex(credential.hash)}
        </p>

        {!readOnly && credential.visibility && onVisibilityChange ? (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-neutral-600">
            <label className="inline-flex items-center gap-1.5">
              <span className="text-neutral-400">Widoczność</span>
              <select
                value={credential.visibility}
                disabled={busy}
                className="rounded border border-hairline bg-white px-2 py-1"
                onChange={event => {
                  onVisibilityChange(credential.hash, event.target.value as CredentialVisibility);
                }}
              >
                {VISIBILITY_OPTIONS.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            {sharePath && onCopyShare ? (
              <span className="inline-flex items-center gap-2">
                <Link to={sharePath} className="font-medium underline">
                  open
                </Link>
                <button
                  type="button"
                  className="font-medium underline"
                  onClick={() => onCopyShare(credential.hash, sharePath)}
                >
                  {copiedShareFor === credential.hash ? "copied" : "copy"}
                </button>
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
};

const CredentialTypeSections: React.FC<CredentialTypeSectionsProps> = ({
  sections,
  loading = false,
  error = null,
  readOnly = false,
  visibilityUpdatingHash = null,
  copiedShareFor = null,
  onCopyShare,
  onVisibilityChange,
}) => {
  if (loading) {
    return <p className="text-sm text-neutral-500">Ładowanie credentials...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (sections.length === 0) {
    return (
      <AppCard>
        <p className="text-sm text-neutral-500">Brak dokumentów.</p>
      </AppCard>
    );
  }

  return (
    <div className="space-y-4">
      {sections.map(section => (
        <AppCard key={section.documentType} className="space-y-5 !p-6 sm:!p-8">
          <h3 className="text-lg font-semibold tracking-[-0.02em] text-neutral-900">{section.label}</h3>

          {section.items.length === 0 ? (
            <p className="text-sm text-neutral-500">Brak dokumentów</p>
          ) : (
            <div className="space-y-5">
              {section.items.map(credential => (
                <CredentialEntry
                  key={credential.hash}
                  credential={credential as CredentialItem}
                  readOnly={readOnly}
                  busy={visibilityUpdatingHash === credential.hash}
                  copiedShareFor={copiedShareFor}
                  onCopyShare={onCopyShare}
                  onVisibilityChange={onVisibilityChange}
                />
              ))}
            </div>
          )}
        </AppCard>
      ))}
    </div>
  );
};

export default CredentialTypeSections;
