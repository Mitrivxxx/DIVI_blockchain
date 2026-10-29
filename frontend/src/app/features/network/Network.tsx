import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import userIcon from "@/assets/icons/user.svg";
import {
  listMembersApi,
  resolveAvatarSrc,
  type MemberSearchResult,
} from "@/app/features/profile/api/profileApi";
import { AppCard } from "@/shared/ui";
import { shortHex } from "@/types/documents";

const roleLabel = (role: string | null | undefined): string => {
  switch (role?.trim().toLowerCase()) {
    case "owner":
    case "4":
      return "Właściciel";
    case "admin":
    case "1":
      return "Administrator";
    case "issuer":
    case "2":
      return "Wystawca";
    case "user":
    case "3":
      return "Użytkownik";
    default:
      return role?.trim() || "Użytkownik";
  }
};

const displayNameFor = (member: MemberSearchResult): string => {
  const name = member.name?.trim();
  if (name) return name;
  if (member.ethereumAddress?.trim()) return shortHex(member.ethereumAddress);
  return `Członek #${member.memberId}`;
};

const Network: React.FC = () => {
  const [members, setMembers] = useState<MemberSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const list = await listMembersApi();
        if (!cancelled) setMembers(list);
      } catch (err) {
        if (!cancelled) {
          setMembers([]);
          setError(err instanceof Error ? err.message : "Nie udało się załadować sieci.");
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.02em] text-neutral-900">Moja sieć</h1>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-neutral-500">
          Wszyscy użytkownicy zarejestrowani w DIVI — niezależnie od roli (właściciel, admin,
          wystawca, użytkownik).
        </p>
      </div>

      {loading ? (
        <AppCard>
          <p className="text-sm text-neutral-500">Ładowanie sieci…</p>
        </AppCard>
      ) : null}

      {error ? (
        <AppCard>
          <p className="text-sm font-medium text-red-600">{error}</p>
        </AppCard>
      ) : null}

      {!loading && !error && members.length === 0 ? (
        <AppCard>
          <p className="text-sm leading-relaxed text-neutral-500">
            Brak osób w bazie do wyświetlenia.
          </p>
        </AppCard>
      ) : null}

      {!loading && !error && members.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map(member => {
            const address = member.ethereumAddress?.trim() || "";
            const avatar = resolveAvatarSrc(member.avatarUrl, userIcon);
            const name = displayNameFor(member);
            const role = roleLabel(member.role);
            const inner = (
              <>
                <img
                  src={avatar}
                  alt=""
                  className="size-12 shrink-0 rounded-lg object-cover bg-neutral-100"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-neutral-900">{name}</p>
                  <p className="mt-0.5 text-xs font-medium text-neutral-500">{role}</p>
                  {address ? (
                    <p className="mt-1 truncate font-mono text-xs text-neutral-400">
                      {shortHex(address)}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-neutral-400">Bez adresu Ethereum</p>
                  )}
                </div>
              </>
            );

            return (
              <li key={member.memberId}>
                {address ? (
                  <Link
                    to={`/u/${encodeURIComponent(address)}`}
                    className="flex items-center gap-3 rounded-xl border border-hairline bg-white p-4 shadow-soft transition hover:border-neutral-300"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-hairline bg-white p-4 shadow-soft">
                    {inner}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
};

export default Network;
