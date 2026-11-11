import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppCard } from "@/shared/ui";
import { resolveAvatarSrc } from "@/shared/lib/format";
import { listInstitutionsApi } from "../api";
import type { InstitutionListItem } from "../types";

const initialsFromName = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "I";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
};

const InstitutionLogo: React.FC<{ name: string; logoUrl?: string | null }> = ({ name, logoUrl }) => {
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

const Institutions: React.FC = () => {
  const [items, setItems] = useState<InstitutionListItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const handle = window.setTimeout(() => {
      void (async () => {
        try {
          setLoading(true);
          setError(null);
          const list = await listInstitutionsApi(query);
          if (!cancelled) setItems(list);
        } catch (err) {
          if (!cancelled) {
            setItems([]);
            setError(err instanceof Error ? err.message : "Nie udało się załadować instytucji.");
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, query.trim().length >= 2 ? 250 : 0);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.02em] text-neutral-900">Instytucje</h1>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-neutral-500">
          Katalog wystawców z profilem instytucji — nazwa, kraj i logo zamiast samego adresu
          hot-wallet.
        </p>
      </div>

      <label className="block max-w-md">
        <span className="sr-only">Szukaj instytucji</span>
        <input
          type="search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Szukaj po nazwie, kraju…"
          className="w-full rounded-lg border border-hairline bg-white px-3 py-2 text-sm text-neutral-900 shadow-soft outline-none focus:border-neutral-300"
        />
      </label>

      {loading ? (
        <AppCard>
          <p className="text-sm text-neutral-500">Ładowanie instytucji…</p>
        </AppCard>
      ) : null}

      {error ? (
        <AppCard>
          <p className="text-sm font-medium text-red-600">{error}</p>
        </AppCard>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <AppCard>
          <p className="text-sm leading-relaxed text-neutral-500">
            {query.trim().length >= 2
              ? "Brak instytucji pasujących do wyszukiwania."
              : "Brak instytucji w katalogu. Pojawią się po zatwierdzeniu wniosku issuera i uzupełnieniu profilu."}
          </p>
        </AppCard>
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(item => {
            const name = item.institutionName?.trim() || "Instytucja";
            const eth = item.ethereumAddress?.trim();
            const href = eth
              ? `/u/${encodeURIComponent(eth)}`
              : `/i/${item.memberId}`;
            return (
              <li key={item.memberId}>
                <Link
                  to={href}
                  className="flex h-full flex-col gap-3 rounded-xl border border-hairline bg-white p-4 shadow-soft transition hover:border-neutral-300"
                >
                  <div className="flex items-start gap-3">
                    <InstitutionLogo name={name} logoUrl={item.logoUrl} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-neutral-900">{name}</p>
                      {item.country?.trim() ? (
                        <p className="mt-0.5 text-xs font-medium text-neutral-500">{item.country}</p>
                      ) : null}
                    </div>
                  </div>
                  {item.description?.trim() ? (
                    <p className="line-clamp-3 text-sm leading-relaxed text-neutral-500">
                      {item.description}
                    </p>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
};

export default Institutions;
