import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import userIcon from "../../../assets/icons/user.svg";
import {
  fetchPublicCredentialsApi,
  fetchPublicProfileApi,
  resolveAvatarSrc,
  type PublicMemberProfile,
} from "./api/profileApi";
import type { PublicCredentialSection, PublicCredentialWallet } from "./types";
import { DOCUMENT_TYPE_SECTIONS, shortHex } from "@/types/documents";
import { AppCard } from "@/shared/ui";
import { getRoutePath } from "../navigation/routes";
import CredentialTypeSections from "./components/CredentialTypeSections";

const emptyPublicCredentialSections = (): PublicCredentialSection[] =>
  DOCUMENT_TYPE_SECTIONS.map(section => ({
    documentType: section.id,
    label: section.label,
    items: [],
  }));

const PublicProfile: React.FC = () => {
  const { ethereumAddress } = useParams<{ ethereumAddress: string }>();
  const [profile, setProfile] = useState<PublicMemberProfile | null>(null);
  const [wallet, setWallet] = useState<PublicCredentialWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ethereumAddress) {
      setError("Brak adresu.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [member, credentials] = await Promise.all([
          fetchPublicProfileApi(ethereumAddress),
          fetchPublicCredentialsApi(ethereumAddress),
        ]);
        if (!cancelled) {
          setProfile(member);
          setWallet(credentials);
        }
      } catch (err) {
        if (!cancelled) {
          setProfile(null);
          setWallet(null);
          setError(err instanceof Error ? err.message : "Nie udało się załadować profilu.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [ethereumAddress]);

  const displayName =
    profile?.name?.trim() ||
    (profile?.ethereumAddress ? shortHex(profile.ethereumAddress) : "Użytkownik");
  const avatar = resolveAvatarSrc(profile?.avatarUrl, userIcon);
  const joined =
    profile?.createdAt != null
      ? new Date(profile.createdAt).toLocaleDateString("pl-PL")
      : null;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-neutral-500">
          <Link to={getRoutePath("profile")} className="underline hover:text-neutral-800">
            Mój profil
          </Link>
          <span aria-hidden="true"> · </span>
          Profil użytkownika
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-neutral-900">
          {loading ? "Profil…" : displayName}
        </h1>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-neutral-500">
          Publiczne dane konta oraz dokumenty oznaczone jako public.
        </p>
      </div>

      {loading ? (
        <AppCard>
          <p className="text-sm text-neutral-500">Ładowanie profilu…</p>
        </AppCard>
      ) : null}

      {error ? (
        <AppCard>
          <p className="text-sm font-medium text-red-600">{error}</p>
        </AppCard>
      ) : null}

      {!loading && !error && profile ? (
        <>
          <section aria-labelledby="public-profile-heading" className="space-y-4">
            <h2 id="public-profile-heading" className="text-xl font-semibold text-neutral-900">
              Profil
            </h2>
            <AppCard className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <img
                src={avatar}
                alt=""
                className="size-20 shrink-0 rounded-xl border border-hairline object-cover bg-neutral-100"
              />
              <div className="min-w-0 space-y-2">
                <p className="text-xl font-semibold text-neutral-900">{displayName}</p>
                {profile.ethereumAddress ? (
                  <p className="font-mono text-sm text-neutral-600" title={profile.ethereumAddress}>
                    {profile.ethereumAddress}
                  </p>
                ) : null}
                {profile.role ? (
                  <p className="text-sm text-neutral-500">Rola: {profile.role}</p>
                ) : null}
                {joined ? <p className="text-sm text-neutral-500">Dołączył: {joined}</p> : null}
                {profile.bio?.trim() ? (
                  <p className="pt-2 text-sm leading-relaxed text-neutral-600">{profile.bio}</p>
                ) : null}
              </div>
            </AppCard>
          </section>

          <section aria-labelledby="public-credentials-heading" className="space-y-4">
            <div>
              <h2 id="public-credentials-heading" className="text-xl font-semibold text-neutral-900">
                Dokumenty i certyfikaty
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                Sekcje: wykształcenie, doświadczenie, licencje i certyfikaty, rekomendacje, wyróżnienia.
              </p>
            </div>
            <CredentialTypeSections
              sections={
                wallet?.sections?.length ? wallet.sections : emptyPublicCredentialSections()
              }
              readOnly
            />
          </section>
        </>
      ) : null}
    </div>
  );
};

export default PublicProfile;
