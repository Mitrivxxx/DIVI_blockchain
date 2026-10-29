import React, { useEffect, useState } from "react";
import userIcon from "../../../assets/icons/user.svg";
import ProfileTabContent from "./components/ProfileTabContent";
import CredentialTypeSections from "./components/CredentialTypeSections";
import { useProfile } from "./hooks/useProfile";
import type { ProfileProps } from "./types";
import { hasDocumentPdfFile, shortHex } from "@/types/documents";
import IssuerInstitutionForm from "./components/IssuerInstitutionForm";
import IssuerInstitutionCard from "./components/IssuerInstitutionCard";
import { openDocumentPdfInNewTab } from "./api/profileApi";
import { AppCard } from "@/shared/ui";

const isIssuerRole = (role: string | null | undefined): boolean => {
  if (!role) return false;
  return ["issuer", "admin", "owner", "2", "1", "4"].includes(role.trim().toLowerCase());
};

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

  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedShareFor, setCopiedShareFor] = useState<string | null>(null);
  const [openingPdfHash, setOpeningPdfHash] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    void loadCredentials();
    void loadActivity();
  }, [loadCredentials, loadActivity]);

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

  const showIssuerSection = isIssuerRole(role);
  const showFullProfile = isPublicProfile;

  if (loading) {
    return (
      <AppCard>
        <p className="text-sm text-neutral-500">Ładowanie profilu...</p>
      </AppCard>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.02em] text-neutral-900">Profil</h1>
        <p className="mt-2 text-base leading-relaxed text-neutral-500">
          {showFullProfile
            ? "Dane konta, dokumenty według typu oraz historia transakcji — na jednej stronie."
            : "Profil prywatny — widoczne tylko dane konta oraz instytucja."}
        </p>
      </div>

      <section aria-labelledby="profile-section-heading" className="space-y-4">
        <h2 id="profile-section-heading" className="text-xl font-semibold text-neutral-900">
          Profil
        </h2>
        <AppCard>
          <ProfileTabContent
            avatar={avatar}
            hasCustomAvatar={hasCustomAvatar}
            avatarUploading={avatarUploading}
            profileError={profileError}
            role={role}
            displayName={displayName}
            email={email}
            bio={bio}
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
            onCopyAddress={handleCopyAddress}
            isPublicProfile={isPublicProfile}
            onPublicProfileChange={setIsPublicProfile}
            onAvatarSelected={file => {
              void uploadAvatar(file);
            }}
            onAvatarDelete={() => {
              void deleteAvatar();
            }}
          />
        </AppCard>
      </section>

      {showIssuerSection ? (
        <section aria-labelledby="institution-section-heading" className="space-y-4">
          <h2 id="institution-section-heading" className="text-xl font-semibold text-neutral-900">
            Instytucja
          </h2>
          {showFullProfile ? <IssuerInstitutionForm /> : <IssuerInstitutionCard />}
        </section>
      ) : null}

      {showFullProfile ? (
        <>
          <section aria-labelledby="credentials-section-heading" className="space-y-4">
            <div>
              <h2 id="credentials-section-heading" className="text-xl font-semibold text-neutral-900">
                Dokumenty i certyfikaty
              </h2>
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
          </section>

          <section aria-labelledby="transactions-section-heading" className="space-y-4">
            <h2 id="transactions-section-heading" className="text-xl font-semibold text-neutral-900">
              Historia transakcji
            </h2>
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
          </section>
        </>
      ) : null}
    </div>
  );
};

export default Profile;
