import React, { useEffect, useState } from "react";
import userIcon from "@/assets/icons/user.svg";
import ProfileTabContent, { ProfileAccountDetails } from "./components/ProfileTabContent";
import ProfileNavTabs from "./components/ProfileNavTabs";
import { useProfile } from "./useProfile";
import type { FollowTarget, ProfileProps } from "../types";
import { fetchFollowingApi } from "../api";
import FollowingSection from "./components/FollowingSection";
import {
  CredentialTypeSections,
  hasDocumentPdfFile,
  openDocumentPdfInNewTab,
} from "@/modules/documents";
import {
  IssuerInstitutionForm,
  verifyIssuerOnChainApi,
  type IssuerOnChainVerifyResult,
} from "@/modules/issuers";
import { shortHex } from "@/shared/lib/format";
import { AppCard, buttonLight } from "@/shared/ui";

const isIssuerRole = (role: string | null | undefined): boolean => {
  if (!role) return false;
  return ["issuer", "admin", "owner", "2", "1", "4"].includes(role.trim().toLowerCase());
};

type ProfileSectionTab = "info" | "credentials" | "followers" | "activity";

const PROFILE_TABS: { id: ProfileSectionTab; label: string }[] = [
  { id: "info", label: "Informacje" },
  { id: "credentials", label: "Dokumenty i certyfikaty" },
  { id: "followers", label: "Followers" },
  { id: "activity", label: "Historia transakcji" },
];

const Profile: React.FC<ProfileProps> = ({ userRole, walletAddress }) => {
  const {
    loading,
    saving,
    profileError,
    avatarUploading,
    hasCustomAvatar,
    credentialSections,
    credentialsLoading,
    credentialsError,
    visibilityUpdatingHash,
    menuOpenFor,
    editingField,
    editingValue,
    role,
    displayName,
    email,
    bio,
    linkedInUrl,
    githubUrl,
    websiteUrl,
    profileAddress,
    shortAddress,
    joinedAt,
    avatar,
    setMenuOpenFor,
    setEditingValue,
    startEditing,
    cancelEditing,
    saveField,
    deleteField,
    saveLinks,
    uploadAvatar,
    deleteAvatar,
    loadCredentials,
    updateCredentialVisibility,
    activity,
    activityLoading,
    activityError,
    loadActivity,
    isPublicProfile,
    setIsPublicProfile,
  } = useProfile({ userRole, walletAddress, fallbackAvatar: userIcon });

  const handleMenuToggle = (field: "name" | "email" | "bio") => {
    setMenuOpenFor(menuOpenFor === field ? null : field);
  };

  const [activeTab, setActiveTab] = useState<ProfileSectionTab>("info");
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedShareFor, setCopiedShareFor] = useState<string | null>(null);
  const [openingPdfHash, setOpeningPdfHash] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [following, setFollowing] = useState<FollowTarget[]>([]);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [followingError, setFollowingError] = useState<string | null>(null);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [verifyResult, setVerifyResult] = useState<IssuerOnChainVerifyResult | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    void loadCredentials();
    void loadActivity();
  }, [loadCredentials, loadActivity]);

  useEffect(() => {
    if (!profileAddress) {
      setFollowing([]);
      setFollowingLoading(false);
      setFollowingError(null);
      return;
    }

    let cancelled = false;

    const loadFollowing = async () => {
      try {
        setFollowingLoading(true);
        setFollowingError(null);
        const list = await fetchFollowingApi(profileAddress);
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
  }, [profileAddress]);

  const handleCopyAddress = async () => {
    if (!profileAddress) {
      return;
    }

    try {
      await navigator.clipboard.writeText(profileAddress);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = profileAddress;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }

    setCopiedAddress(true);
    window.setTimeout(() => setCopiedAddress(false), 1400);
  };

  const handleCopyShare = async (hash: string, sharePath: string) => {
    const url = `${window.location.origin}${sharePath}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    setCopiedShareFor(hash);
    window.setTimeout(() => setCopiedShareFor(null), 1400);
  };

  const handleOpenPdf = async (hash: string) => {
    try {
      setPdfError(null);
      setOpeningPdfHash(hash);
      await openDocumentPdfInNewTab(hash);
    } catch (error) {
      setPdfError(error instanceof Error ? error.message : "Nie udało się otworzyć PDF.");
    } finally {
      setOpeningPdfHash(null);
    }
  };

  const handleVerifyIssuer = async () => {
    if (!profileAddress) return;
    try {
      setVerifyBusy(true);
      setVerifyError(null);
      setVerifyResult(null);
      setVerifyResult(await verifyIssuerOnChainApi(profileAddress));
    } catch (err) {
      setVerifyResult(null);
      setVerifyError(err instanceof Error ? err.message : "Nie udało się zweryfikować issuera.");
    } finally {
      setVerifyBusy(false);
    }
  };

  const showIssuerSection = isIssuerRole(role);

  if (loading) {
    return (
      <AppCard>
        <p className="text-sm text-neutral-500">Ładowanie profilu...</p>
      </AppCard>
    );
  }

  return (
    <div className="space-y-6">
      <section aria-label="Profil" className="space-y-6">
        <ProfileTabContent
          avatar={avatar}
          hasCustomAvatar={hasCustomAvatar}
          avatarUploading={avatarUploading}
          profileError={profileError}
          role={role}
          displayName={displayName}
          email={email}
          bio={bio}
          linkedInUrl={linkedInUrl}
          githubUrl={githubUrl}
          websiteUrl={websiteUrl}
          profileAddress={profileAddress}
          shortAddress={shortAddress}
          copiedAddress={copiedAddress}
          joinedAt={joinedAt}
          saving={saving}
          menuOpenFor={menuOpenFor}
          editingField={editingField}
          editingValue={editingValue}
          onEditValueChange={setEditingValue}
          onMenuToggle={handleMenuToggle}
          onStartEditing={startEditing}
          onCancelEditing={cancelEditing}
          onSaveField={saveField}
          onDeleteField={deleteField}
          onSaveLinks={saveLinks}
          onCopyAddress={handleCopyAddress}
          isPublicProfile={isPublicProfile}
          onPublicProfileChange={setIsPublicProfile}
          onAvatarSelected={file => {
            void uploadAvatar(file);
          }}
          onAvatarDelete={() => {
            void deleteAvatar();
          }}
          headerAction={
            profileAddress ? (
              <button
                type="button"
                className={`${buttonLight} disabled:opacity-50`}
                disabled={verifyBusy}
                onClick={() => void handleVerifyIssuer()}
              >
                {verifyBusy ? "Weryfikacja…" : "Zweryfikuj konto"}
              </button>
            ) : null
          }
          transactionCount={activityLoading ? null : activity.length}
          tabs={
            <ProfileNavTabs
              tabs={PROFILE_TABS}
              activeId={activeTab}
              onChange={id => setActiveTab(id as ProfileSectionTab)}
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
            <p className="mt-1 font-mono text-xs text-neutral-600" title={verifyResult.ethereumAddress}>
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
            <ProfileAccountDetails
              email={email}
              linkedInUrl={linkedInUrl}
              githubUrl={githubUrl}
              websiteUrl={websiteUrl}
              saving={saving}
              isPublicProfile={isPublicProfile}
              menuOpenFor={menuOpenFor}
              editingField={editingField}
              editingValue={editingValue}
              onEditValueChange={setEditingValue}
              onMenuToggle={handleMenuToggle}
              onStartEditing={startEditing}
              onCancelEditing={cancelEditing}
              onSaveField={saveField}
              onDeleteField={deleteField}
              onSaveLinks={saveLinks}
            >
              {showIssuerSection ? <IssuerInstitutionForm embedded /> : null}
            </ProfileAccountDetails>
          ) : null}

          {activeTab === "credentials" ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900">Dokumenty i certyfikaty</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Sekcje: wykształcenie, doświadczenie, licencje i certyfikaty, rekomendacje, wyróżnienia.
                </p>
                {!profileAddress ? (
                  <p className="mt-1 text-sm text-neutral-500">
                    Wymagany Ethereum address powiązany z kontem, aby dokumenty pojawiły się w sekcjach.
                  </p>
                ) : null}
              </div>

              <CredentialTypeSections
                sections={credentialSections}
                loading={credentialsLoading}
                error={credentialsError}
                visibilityUpdatingHash={visibilityUpdatingHash}
                copiedShareFor={copiedShareFor}
                onCopyShare={(hash, sharePath) => {
                  void handleCopyShare(hash, sharePath);
                }}
                onVisibilityChange={(hash, visibility) => {
                  void updateCredentialVisibility(hash, visibility);
                }}
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
              <h2 className="text-xl font-semibold text-neutral-900">Historia transakcji</h2>
              <AppCard className="space-y-4" aria-live="polite">
                {activityLoading ? (
                  <p className="text-sm text-neutral-500">Ładowanie historii...</p>
                ) : null}
                {!activityLoading && activityError ? (
                  <p className="text-sm text-red-600">{activityError}</p>
                ) : null}
                {pdfError ? <p className="text-sm text-red-600">{pdfError}</p> : null}
                {!activityLoading && !activityError && activity.length === 0 ? (
                  <p className="text-sm text-neutral-500">Brak historii transakcji dla tego konta.</p>
                ) : null}

                {!activityLoading && activity.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[48rem] text-left text-sm">
                      <thead>
                        <tr className="border-b border-hairline text-neutral-500">
                          <th className="py-2 pr-3 font-medium">Typ</th>
                          <th className="py-2 pr-3 font-medium">Hash</th>
                          <th className="py-2 pr-3 font-medium">TxHash</th>
                          <th className="py-2 pr-3 font-medium">Block</th>
                          <th className="py-2 pr-3 font-medium">Czas</th>
                          <th className="py-2 pr-3 font-medium">Źródło</th>
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
                            <td className="py-3 pr-3">
                              {item.fromFallback ? "Documents" : "Activity"}
                            </td>
                            <td className="py-3">
                              {hasDocumentPdfFile(item.cid) ? (
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
    </div>
  );
};

export default Profile;
