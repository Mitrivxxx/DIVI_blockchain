import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import userIcon from "@/assets/icons/user.svg";
import {
  fetchFollowStatusApi,
  fetchFollowingApi,
  fetchPublicProfileApi,
  followMemberApi,
  unfollowMemberApi,
} from "../api";
import type { FollowTarget, PublicMemberProfile } from "../types";
import {
  CredentialTypeSections,
  DOCUMENT_TYPE_SECTIONS,
  fetchPublicActivityApi,
  fetchPublicCredentialsApi,
  openDocumentPdfInNewTab,
  type DocumentActivityItem,
  type PublicCredentialSection,
  type PublicCredentialWallet,
} from "@/modules/documents";
import {
  fetchPublicIssuerInstitutionApi,
  verifyIssuerOnChainApi,
  type IssuerInstitutionProfile,
  type IssuerOnChainVerifyResult,
} from "@/modules/issuers";
import { useWeb3Auth } from "@/modules/identity";
import { resolveAvatarSrc, shortHex } from "@/shared/lib/format";
import { getRoutePath } from "@/shared/lib/routes";
import { AppCard, buttonDark, buttonLight } from "@/shared/ui";
import FollowingSection from "../profile/components/FollowingSection";
import ExternalLinksBlock from "../profile/components/ExternalLinksBlock";
import ProfileNavTabs from "../profile/components/ProfileNavTabs";
import {
  ProfileAvatarFrame,
  ProfileHeroPanel,
} from "../profile/components/ProfileHeroPanel";
import VerifiedByDiviBadge, { isIssuerLikeRole } from "../profile/components/VerifiedByDiviBadge";

const emptyPublicCredentialSections = (): PublicCredentialSection[] =>
  DOCUMENT_TYPE_SECTIONS.map(section => ({
    documentType: section.id,
    label: section.label,
    items: [],
  }));

type PublicSectionTab = "info" | "credentials" | "followers" | "activity";

const PUBLIC_TABS: { id: PublicSectionTab; label: string }[] = [
  { id: "info", label: "Informacje" },
  { id: "credentials", label: "Dokumenty i certyfikaty" },
  { id: "followers", label: "Followers" },
  { id: "activity", label: "Historia transakcji" },
];

const PublicProfile: React.FC = () => {
  const { ethereumAddress } = useParams<{ ethereumAddress: string }>();
  const { jwt, address: myAddress } = useWeb3Auth();
  const [profile, setProfile] = useState<PublicMemberProfile | null>(null);
  const [wallet, setWallet] = useState<PublicCredentialWallet | null>(null);
  const [institution, setInstitution] = useState<IssuerInstitutionProfile | null>(null);
  const [following, setFollowing] = useState<FollowTarget[]>([]);
  const [followingLoading, setFollowingLoading] = useState(true);
  const [followingError, setFollowingError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [followError, setFollowError] = useState<string | null>(null);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [verifyResult, setVerifyResult] = useState<IssuerOnChainVerifyResult | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PublicSectionTab>("info");
  const [activity, setActivity] = useState<DocumentActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [openingPdfHash, setOpeningPdfHash] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const isOwnProfile =
    Boolean(ethereumAddress) &&
    Boolean(myAddress) &&
    ethereumAddress!.trim().toLowerCase() === myAddress!.trim().toLowerCase();

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
        setVerifyResult(null);
        setVerifyError(null);
        const [member, credentials, institutionProfile, activityItems] = await Promise.all([
          fetchPublicProfileApi(ethereumAddress),
          fetchPublicCredentialsApi(ethereumAddress),
          fetchPublicIssuerInstitutionApi(ethereumAddress),
          fetchPublicActivityApi(ethereumAddress),
        ]);
        if (!cancelled) {
          setProfile(member);
          setWallet(credentials);
          setInstitution(institutionProfile);
          setActivity(activityItems);
          setActivityError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setProfile(null);
          setWallet(null);
          setInstitution(null);
          setActivity([]);
          setError(err instanceof Error ? err.message : "Nie udało się załadować profilu.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setActivityLoading(false);
        }
      }
    };

    setActivityLoading(true);
    void load();
    return () => {
      cancelled = true;
    };
  }, [ethereumAddress]);

  const handleVerifyIssuer = async () => {
    if (!ethereumAddress) return;
    try {
      setVerifyBusy(true);
      setVerifyError(null);
      setVerifyResult(null);
      const result = await verifyIssuerOnChainApi(ethereumAddress);
      setVerifyResult(result);
    } catch (err) {
      setVerifyResult(null);
      setVerifyError(err instanceof Error ? err.message : "Nie udało się zweryfikować issuera.");
    } finally {
      setVerifyBusy(false);
    }
  };

  const handleOpenPdf = async (hash: string) => {
    try {
      setPdfError(null);
      setOpeningPdfHash(hash);
      await openDocumentPdfInNewTab(hash);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : "Nie udało się otworzyć PDF.");
    } finally {
      setOpeningPdfHash(null);
    }
  };

  useEffect(() => {
    if (!ethereumAddress) {
      setFollowing([]);
      setFollowingLoading(false);
      return;
    }

    let cancelled = false;

    const loadFollowing = async () => {
      try {
        setFollowingLoading(true);
        setFollowingError(null);
        const list = await fetchFollowingApi(ethereumAddress);
        if (!cancelled) setFollowing(list);
      } catch (err) {
        if (!cancelled) {
          setFollowing([]);
          setFollowingError(
            err instanceof Error ? err.message : "Nie udało się pobrać listy obserwowanych.",
          );
        }
      } finally {
        if (!cancelled) setFollowingLoading(false);
      }
    };

    void loadFollowing();
    return () => {
      cancelled = true;
    };
  }, [ethereumAddress]);

  useEffect(() => {
    if (!ethereumAddress || !jwt || isOwnProfile) {
      setIsFollowing(false);
      return;
    }

    let cancelled = false;

    const loadStatus = async () => {
      try {
        setFollowError(null);
        const status = await fetchFollowStatusApi(ethereumAddress);
        if (!cancelled) setIsFollowing(status);
      } catch {
        if (!cancelled) setIsFollowing(false);
      }
    };

    void loadStatus();
    return () => {
      cancelled = true;
    };
  }, [ethereumAddress, jwt, isOwnProfile]);

  const handleToggleFollow = async () => {
    if (!ethereumAddress || !jwt || isOwnProfile) return;
    try {
      setFollowBusy(true);
      setFollowError(null);
      if (isFollowing) {
        await unfollowMemberApi(ethereumAddress);
        setIsFollowing(false);
      } else {
        await followMemberApi(ethereumAddress);
        setIsFollowing(true);
      }
    } catch (err) {
      setFollowError(err instanceof Error ? err.message : "Nie udało się zmienić obserwacji.");
    } finally {
      setFollowBusy(false);
    }
  };

  const displayName =
    profile?.name?.trim() ||
    (profile?.ethereumAddress ? shortHex(profile.ethereumAddress) : "Użytkownik");
  const avatar = resolveAvatarSrc(profile?.avatarUrl, userIcon);
  const joined =
    profile?.createdAt != null
      ? new Date(profile.createdAt).toLocaleDateString("pl-PL")
      : null;

  return (
    <div className="space-y-6">
      {loading ? (
        <AppCard>
          <h1 className="text-xl font-semibold text-neutral-900">Profil…</h1>
          <p className="mt-2 text-sm text-neutral-500">Ładowanie profilu…</p>
        </AppCard>
      ) : null}

      {error ? (
        <AppCard>
          <p className="text-sm font-medium text-red-600">{error}</p>
        </AppCard>
      ) : null}

      {!loading && !error && profile ? (
        <section aria-label="Profil" className="space-y-6">
          <ProfileHeroPanel
            variant="person"
            avatar={
              <ProfileAvatarFrame shape="circle">
                <img src={avatar} alt="" className="size-full object-cover" />
              </ProfileAvatarFrame>
            }
            title={<h1 className="text-inherit">{displayName}</h1>}
            titleAside={
              isIssuerLikeRole(profile.role) ? <VerifiedByDiviBadge /> : null
            }
            subtitle={
              profile.bio?.trim() ? <p className="text-inherit">{profile.bio}</p> : null
            }
            headerAction={
              <button
                type="button"
                className={`${buttonLight} disabled:opacity-50`}
                disabled={verifyBusy}
                onClick={() => void handleVerifyIssuer()}
              >
                {verifyBusy ? "Weryfikacja…" : "Zweryfikuj konto"}
              </button>
            }
            stats={[
              {
                label: "Adres ETH",
                value: profile.ethereumAddress ? (
                  <span className="font-mono" title={profile.ethereumAddress}>
                    {shortHex(profile.ethereumAddress)}
                  </span>
                ) : (
                  "—"
                ),
              },
              {
                label: "Dołączył",
                value: joined ?? "—",
              },
              {
                label: "Transakcje",
                value: activityLoading ? "…" : String(activity.length),
              },
            ]}
            actions={
              <>
                {jwt && !isOwnProfile ? (
                  <button
                    type="button"
                    className={`${isFollowing ? buttonLight : buttonDark} disabled:opacity-50`}
                    disabled={followBusy}
                    onClick={() => void handleToggleFollow()}
                  >
                    {followBusy
                      ? "Zapisywanie…"
                      : isFollowing
                        ? "Przestań obserwować"
                        : "Obserwuj"}
                  </button>
                ) : null}
                {isOwnProfile ? (
                  <Link to={getRoutePath("profile")} className={buttonLight}>
                    Edytuj swój profil
                  </Link>
                ) : null}
                {followError ? <p className="text-sm text-red-600">{followError}</p> : null}
              </>
            }
            tabs={
              <ProfileNavTabs
                tabs={PUBLIC_TABS}
                activeId={activeTab}
                onChange={id => setActiveTab(id as PublicSectionTab)}
              />
            }
          />

          {verifyError ? <p className="text-sm font-medium text-red-600">{verifyError}</p> : null}
          {verifyResult ? (
            <AppCard
              className={
                verifyResult.isIssuer
                  ? "border border-emerald-200 bg-emerald-50"
                  : "border border-red-200 bg-red-50"
              }
              role="status"
              aria-live="polite"
            >
              <p
                className={`text-sm font-semibold ${
                  verifyResult.isIssuer ? "text-emerald-800" : "text-red-700"
                }`}
              >
                {verifyResult.message}
              </p>
              <p
                className="mt-1 font-mono text-xs text-neutral-600"
                title={verifyResult.ethereumAddress}
              >
                {shortHex(verifyResult.ethereumAddress)} · wynik jednorazowy, bez zapisu.
              </p>
            </AppCard>
          ) : null}

          <div
            id={`profile-panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`profile-tab-${activeTab}`}
            className="space-y-6"
          >
            {activeTab === "info" ? (
              <AppCard className="space-y-5">
                <h2 className="text-lg font-semibold tracking-[-0.02em] text-neutral-900">
                  Informacje
                </h2>

                <ExternalLinksBlock
                  linkedInUrl={profile.linkedInUrl}
                  githubUrl={profile.githubUrl}
                  websiteUrl={profile.websiteUrl}
                />

                {institution ? (
                  <dl className="grid gap-4 border-t border-hairline pt-5 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="font-medium text-neutral-500">Witryna</dt>
                      <dd className="mt-1 break-all text-neutral-800">
                        {institution.websiteUrl?.trim() ? (
                          <a
                            href={institution.websiteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="underline hover:text-neutral-950"
                          >
                            {institution.websiteUrl}
                          </a>
                        ) : (
                          "—"
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-neutral-500">Branża</dt>
                      <dd className="mt-1 text-neutral-800">
                        {institution.description?.trim() || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-neutral-500">Siedziba główna</dt>
                      <dd className="mt-1 text-neutral-800">
                        {institution.country?.trim() || "—"}
                      </dd>
                    </div>
                  </dl>
                ) : !profile.linkedInUrl?.trim() &&
                  !profile.githubUrl?.trim() &&
                  !profile.websiteUrl?.trim() ? (
                  <p className="text-sm text-neutral-500">Brak dodatkowych informacji publicznych.</p>
                ) : null}
              </AppCard>
            ) : null}

            {activeTab === "credentials" ? (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900">Dokumenty i certyfikaty</h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    Sekcje: wykształcenie, doświadczenie, licencje i certyfikaty, rekomendacje,
                    wyróżnienia.
                  </p>
                </div>
                <CredentialTypeSections
                  sections={
                    wallet?.sections?.length ? wallet.sections : emptyPublicCredentialSections()
                  }
                  readOnly
                />
              </div>
            ) : null}

            {activeTab === "followers" ? (
              <FollowingSection
                items={following}
                loading={followingLoading}
                error={followingError}
              />
            ) : null}

            {activeTab === "activity" ? (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900">Historia transakcji</h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    Publiczne Issued / Revoked dla dokumentów oznaczonych jako public.
                  </p>
                </div>
                <AppCard className="space-y-4" aria-live="polite">
                  {activityLoading ? (
                    <p className="text-sm text-neutral-500">Ładowanie historii…</p>
                  ) : null}
                  {!activityLoading && activityError ? (
                    <p className="text-sm text-red-600">{activityError}</p>
                  ) : null}
                  {!activityLoading && !activityError && activity.length === 0 ? (
                    <p className="text-sm text-neutral-500">
                      Brak publicznej historii transakcji dla tego konta.
                    </p>
                  ) : null}
                  {pdfError ? <p className="text-sm text-red-600">{pdfError}</p> : null}
                  {!activityLoading && activity.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[44rem] text-left text-sm">
                        <thead>
                          <tr className="border-b border-hairline text-neutral-500">
                            <th className="py-2 pr-3 font-medium">Typ</th>
                            <th className="py-2 pr-3 font-medium">Hash</th>
                            <th className="py-2 pr-3 font-medium">TxHash</th>
                            <th className="py-2 pr-3 font-medium">Block</th>
                            <th className="py-2 pr-3 font-medium">Czas</th>
                            <th className="py-2 font-medium">PDF</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activity.map((item, index) => (
                            <tr
                              key={`${item.hash}-${item.activityType}-${item.timestamp}-${index}`}
                              className="border-b border-hairline last:border-0"
                            >
                              <td className="py-3 pr-3">{item.activityType}</td>
                              <td className="py-3 pr-3 font-mono text-xs" title={item.hash}>
                                {shortHex(item.hash)}
                              </td>
                              <td
                                className="py-3 pr-3 font-mono text-xs"
                                title={item.txHash ?? undefined}
                              >
                                {item.txHash ? shortHex(item.txHash) : "—"}
                              </td>
                              <td className="py-3 pr-3">{item.blockNumber ?? "—"}</td>
                              <td className="py-3 pr-3">
                                {new Date(item.timestamp).toLocaleString("pl-PL")}
                              </td>
                              <td className="py-3">
                                {item.hasPdfFile ? (
                                  <button
                                    type="button"
                                    className="underline disabled:opacity-50"
                                    disabled={openingPdfHash === item.hash}
                                    onClick={() => void handleOpenPdf(item.hash)}
                                  >
                                    {openingPdfHash === item.hash ? "Otwieranie…" : "Pokaż dokument"}
                                  </button>
                                ) : (
                                  "—"
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </AppCard>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default PublicProfile;
