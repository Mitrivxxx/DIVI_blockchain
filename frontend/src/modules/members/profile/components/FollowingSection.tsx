import React from "react";
import { Link } from "react-router-dom";
import userIcon from "@/assets/icons/user.svg";
import type { FollowTarget } from "../../types";
import { AppCard } from "@/shared/ui";
import { resolveAvatarSrc, shortHex } from "@/shared/lib/format";

type FollowingSectionProps = {
  items: FollowTarget[];
  loading?: boolean;
  error?: string | null;
};

const displayNameFor = (item: FollowTarget): string => {
  const name = item.name?.trim();
  if (name) return name;
  if (item.ethereumAddress?.trim()) return shortHex(item.ethereumAddress);
  return `Członek #${item.memberId}`;
};

const FollowingSection: React.FC<FollowingSectionProps> = ({
  items,
  loading = false,
  error = null,
}) => {
  return (
    <section aria-labelledby="followers-section-heading" className="space-y-4">
      <div>
        <h2 id="followers-section-heading" className="text-xl font-semibold text-neutral-900">
          Followers
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Osoby, które ten użytkownik obserwuje.
        </p>
      </div>

      <AppCard className="space-y-4" aria-live="polite">
        {loading ? <p className="text-sm text-neutral-500">Ładowanie…</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {!loading && !error && items.length === 0 ? (
          <p className="text-sm text-neutral-500">Brak obserwowanych osób.</p>
        ) : null}

        {!loading && !error && items.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(item => {
              const name = displayNameFor(item);
              const avatar = resolveAvatarSrc(item.avatarUrl, userIcon);
              const address = item.ethereumAddress?.trim() || "";
              const content = (
                <>
                  <img
                    src={avatar}
                    alt=""
                    className="size-12 shrink-0 rounded-lg border border-hairline object-cover bg-neutral-100"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-neutral-900">{name}</p>
                    {address ? (
                      <p className="mt-0.5 truncate font-mono text-xs text-neutral-400">
                        {shortHex(address)}
                      </p>
                    ) : null}
                  </div>
                </>
              );

              return (
                <li key={item.memberId}>
                  {address ? (
                    <Link
                      to={`/u/${encodeURIComponent(address)}`}
                      className="flex items-center gap-3 rounded-xl border border-hairline bg-neutral-50 p-3 transition hover:border-neutral-300"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 rounded-xl border border-hairline bg-neutral-50 p-3">
                      {content}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : null}
      </AppCard>
    </section>
  );
};

export default FollowingSection;
