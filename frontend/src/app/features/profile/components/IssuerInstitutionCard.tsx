import React, { useEffect, useState } from "react";
import { fetchIssuerInstitutionProfileApi, resolveAvatarSrc } from "../api/profileApi";
import type { IssuerInstitutionProfile } from "../types";
import { AppCard } from "@/shared/ui";

type IssuerInstitutionCardProps = {
  /** Shown under the heading when profile is empty. */
  emptyHint?: string;
};

const IssuerInstitutionCard: React.FC<IssuerInstitutionCardProps> = ({
  emptyHint = "Brak danych instytucji.",
}) => {
  const [profile, setProfile] = useState<IssuerInstitutionProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchIssuerInstitutionProfileApi();
        if (!cancelled) setProfile(data);
      } catch (err) {
        if (!cancelled) {
          setProfile(null);
          setError(err instanceof Error ? err.message : "Nie udało się wczytać profilu instytucji.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const logoSrc = profile?.logoUrl?.trim()
    ? resolveAvatarSrc(profile.logoUrl, "")
    : "";

  return (
    <AppCard className="space-y-5" aria-live="polite">
      {loading ? <p className="text-sm text-neutral-500">Ładowanie…</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!loading && !error && !profile ? (
        <p className="text-sm text-neutral-500">{emptyHint}</p>
      ) : null}

      {!loading && profile ? (
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt=""
              className="size-16 shrink-0 rounded-xl border border-hairline object-cover bg-neutral-100"
            />
          ) : (
            <span
              className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-neutral-950 text-sm font-semibold tracking-wide text-white"
              aria-hidden="true"
            >
              {(profile.institutionName?.trim()?.[0] ?? "I").toUpperCase()}
            </span>
          )}

          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="text-xl font-semibold tracking-[-0.02em] text-neutral-900">
                {profile.institutionName?.trim() || "Instytucja"}
              </p>
              {profile.description?.trim() ? (
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{profile.description}</p>
              ) : null}
            </div>

            <dl className="grid gap-2 text-sm text-neutral-700 sm:grid-cols-2">
              {profile.websiteUrl?.trim() ? (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                    Strona
                  </dt>
                  <dd className="mt-0.5 truncate">
                    <a
                      href={profile.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline hover:text-neutral-900"
                    >
                      {profile.websiteUrl}
                    </a>
                  </dd>
                </div>
              ) : null}
              {profile.country?.trim() ? (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                    Kraj
                  </dt>
                  <dd className="mt-0.5">{profile.country}</dd>
                </div>
              ) : null}
              {profile.taxId?.trim() ? (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                    NIP / KRS
                  </dt>
                  <dd className="mt-0.5 font-mono text-xs">{profile.taxId}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        </div>
      ) : null}
    </AppCard>
  );
};

export default IssuerInstitutionCard;
