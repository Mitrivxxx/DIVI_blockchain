import React, { useRef, type ReactNode } from "react";
import type { EditableField, ProfileExternalLinks } from "../types";
import { AppCard, buttonDark, buttonLight } from "@/shared/ui";
import ExternalLinksBlock from "./ExternalLinksBlock";
import {
  ProfileAvatarFrame,
  ProfileHeroPanel,
  ProfileMetaLine,
} from "./ProfileHeroPanel";

type ProfileTabContentProps = {
  avatar: string;
  hasCustomAvatar: boolean;
  avatarUploading: boolean;
  profileError: string | null;
  role: string | null;
  displayName: string | null;
  email: string | null;
  bio: string | null;
  linkedInUrl: string | null;
  githubUrl: string | null;
  websiteUrl: string | null;
  profileAddress: string | null;
  shortAddress: string | null;
  copiedAddress: boolean;
  joinedAt: string | null;
  saving: boolean;
  isPublicProfile: boolean;
  menuOpenFor: EditableField | null;
  editingField: EditableField | null;
  editingValue: string;
  onEditValueChange: (value: string) => void;
  onMenuToggle: (field: EditableField) => void;
  onStartEditing: (field: EditableField, value: string) => void;
  onCancelEditing: () => void;
  onSaveField: (field: EditableField) => Promise<void>;
  onDeleteField: (field: EditableField) => Promise<void>;
  onSaveLinks: (links: ProfileExternalLinks) => Promise<void>;
  onCopyAddress: () => Promise<void> | void;
  onPublicProfileChange: (isPublic: boolean) => void;
  onAvatarSelected: (file: File) => void;
  onAvatarDelete: () => void;
  /** Extra CTAs in the hero action row (e.g. Zweryfikuj issuera). */
  extraActions?: ReactNode;
  /** Bottom section tabs inside the hero card. */
  tabs?: ReactNode;
};

type ProfileAccountDetailsProps = {
  email: string | null;
  linkedInUrl: string | null;
  githubUrl: string | null;
  websiteUrl: string | null;
  saving: boolean;
  isPublicProfile: boolean;
  menuOpenFor: EditableField | null;
  editingField: EditableField | null;
  editingValue: string;
  onEditValueChange: (value: string) => void;
  onMenuToggle: (field: EditableField) => void;
  onStartEditing: (field: EditableField, value: string) => void;
  onCancelEditing: () => void;
  onSaveField: (field: EditableField) => Promise<void>;
  onDeleteField: (field: EditableField) => Promise<void>;
  onSaveLinks: (links: ProfileExternalLinks) => Promise<void>;
  /** Extra block inside Informacje (e.g. institution Witryna / Branża / Siedziba). */
  children?: ReactNode;
};

const formatRole = (roleValue: string | null | undefined): string | null => {
  if (!roleValue) return null;
  const normalized = roleValue.trim().toLowerCase();
  const labels: Record<string, string> = {
    owner: "Właściciel",
    "4": "Właściciel",
    admin: "Administrator",
    "1": "Administrator",
    issuer: "Wystawca",
    "2": "Wystawca",
    user: "Użytkownik",
    member: "Użytkownik",
    "3": "Użytkownik",
  };
  return labels[normalized] ?? roleValue;
};

const inputClass =
  "rounded-lg border border-hairline bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-300";

const PencilIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden="true">
    <path
      d="M4 20h4.5L19 9.5 14.5 5 4 15.5V20z"
      className="stroke-current"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="m13.5 6.5 4 4"
      className="stroke-current"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const CameraIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden="true">
    <path
      d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.2l1.1-1.6A1.5 1.5 0 0 1 10 3.8h4a1.5 1.5 0 0 1 1.2.6L16.3 6h1.2A2.5 2.5 0 0 1 20 8.5v9A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-9Z"
      className="stroke-current"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="13" r="3.2" className="stroke-current" strokeWidth="1.6" />
  </svg>
);

const ProfileTabContent: React.FC<ProfileTabContentProps> = ({
  avatar,
  hasCustomAvatar,
  avatarUploading,
  profileError,
  role,
  displayName,
  email,
  bio,
  linkedInUrl,
  githubUrl,
  websiteUrl,
  profileAddress,
  shortAddress,
  copiedAddress,
  joinedAt,
  saving,
  isPublicProfile,
  menuOpenFor,
  editingField,
  editingValue,
  onEditValueChange,
  onMenuToggle,
  onStartEditing,
  onCancelEditing,
  onSaveField,
  onDeleteField,
  onSaveLinks,
  onCopyAddress,
  onPublicProfileChange,
  onAvatarSelected,
  onAvatarDelete,
  extraActions,
  tabs,
}) => {
  const roleLabel = formatRole(role);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const titleNode =
    editingField === "name" ? (
      <div className="flex flex-wrap gap-2">
        <input
          value={editingValue}
          onChange={e => onEditValueChange(e.target.value)}
          placeholder="Wpisz nazwę"
          className={inputClass}
          aria-label="Nazwa profilu"
        />
        <button type="button" className={buttonDark} onClick={() => void onSaveField("name")} disabled={saving}>
          Zapisz
        </button>
        <button type="button" className={buttonLight} onClick={onCancelEditing} disabled={saving}>
          Anuluj
        </button>
      </div>
    ) : (
      <h1 className="text-inherit">{displayName ?? "Brak nazwy"}</h1>
    );

  const titleAside =
    editingField === "name" ? null : (
      <div className="flex flex-wrap items-center gap-2">
        {displayName ? (
          <div className="relative">
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded border border-hairline bg-white text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-900"
              aria-label="Opcje nazwy"
              aria-expanded={menuOpenFor === "name"}
              onClick={() => onMenuToggle("name")}
            >
              <PencilIcon />
            </button>
            {menuOpenFor === "name" ? (
              <div className="absolute left-0 top-full z-10 mt-1 min-w-[8rem] rounded-lg border border-hairline bg-white p-1 shadow-soft">
                <button
                  type="button"
                  className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-neutral-50"
                  onClick={() => onStartEditing("name", displayName)}
                >
                  Edytuj
                </button>
                <button
                  type="button"
                  className="block w-full rounded px-3 py-2 text-left text-sm text-red-600 hover:bg-neutral-50"
                  onClick={() => void onDeleteField("name")}
                >
                  Usuń
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            className="text-sm font-medium underline"
            onClick={() => onStartEditing("name", "")}
          >
            Dodaj nazwę
          </button>
        )}
        {roleLabel ? (
          <span className="rounded border border-hairline bg-white px-2.5 py-1 text-xs font-medium text-neutral-700">
            {roleLabel}
          </span>
        ) : null}
      </div>
    );

  const subtitleNode =
    editingField === "bio" ? (
      <div className="flex flex-wrap gap-2">
        <input
          value={editingValue}
          onChange={e => onEditValueChange(e.target.value)}
          placeholder="Krótki opis profilu"
          className={`${inputClass} min-w-[16rem] flex-1`}
          aria-label="Bio"
        />
        <button type="button" className={buttonDark} onClick={() => void onSaveField("bio")} disabled={saving}>
          Zapisz
        </button>
        <button type="button" className={buttonLight} onClick={onCancelEditing} disabled={saving}>
          Anuluj
        </button>
      </div>
    ) : bio ? (
      <p className="text-inherit">
        {bio}{" "}
        <button
          type="button"
          className="align-baseline text-sm font-medium text-neutral-500 underline hover:text-neutral-800"
          onClick={() => onMenuToggle("bio")}
        >
          Edytuj
        </button>
        {menuOpenFor === "bio" ? (
          <>
            {" "}
            <button type="button" className="text-sm underline" onClick={() => onStartEditing("bio", bio)}>
              Potwierdź
            </button>{" "}
            <button
              type="button"
              className="text-sm text-red-600 underline"
              onClick={() => void onDeleteField("bio")}
            >
              Usuń
            </button>
          </>
        ) : null}
      </p>
    ) : (
      <button
        type="button"
        className="text-sm font-medium text-neutral-500 underline hover:text-neutral-800"
        onClick={() => onStartEditing("bio", "")}
      >
        Dodaj krótki opis
      </button>
    );

  return (
    <ProfileHeroPanel
      variant="person"
      avatar={
        <div className="relative">
          <ProfileAvatarFrame shape="circle">
            <button
              type="button"
              className="block size-full focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading || saving}
              aria-label="Zmień zdjęcie profilowe"
            >
              <img src={avatar} alt="" className="size-full object-cover" />
            </button>
          </ProfileAvatarFrame>
          <button
            type="button"
            className="absolute bottom-1 right-1 inline-flex size-8 items-center justify-center rounded-full border border-white bg-neutral-950 text-white shadow-soft transition hover:bg-neutral-700 disabled:opacity-50"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUploading || saving}
            aria-label={avatarUploading ? "Wgrywanie zdjęcia" : "Zmień zdjęcie"}
          >
            <CameraIcon />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={event => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) onAvatarSelected(file);
            }}
          />
        </div>
      }
      title={titleNode}
      titleAside={titleAside}
      subtitle={subtitleNode}
      meta={
        <ProfileMetaLine
          items={[
            roleLabel,
            shortAddress || profileAddress ? (
              <button
                type="button"
                className="font-mono text-neutral-600 underline decoration-neutral-300 underline-offset-2 hover:text-neutral-900"
                title={profileAddress ?? undefined}
                onClick={() => void onCopyAddress()}
              >
                {copiedAddress ? "Skopiowano" : (shortAddress ?? profileAddress)}
              </button>
            ) : (
              "Brak adresu ETH"
            ),
            joinedAt ? `Dołączono ${joinedAt}` : null,
            isPublicProfile ? "Profil publiczny" : "Profil Web3",
          ]}
        />
      }
      actions={
        <>
          <button
            type="button"
            role="switch"
            aria-checked={isPublicProfile}
            className={buttonDark}
            onClick={() => {
              const next = !isPublicProfile;
              if (!next && editingField === "email") {
                onCancelEditing();
              }
              onPublicProfileChange(next);
            }}
          >
            {isPublicProfile ? "Przełącz na prywatne" : "Przełącz na publiczne"}
          </button>
          {hasCustomAvatar ? (
            <button
              type="button"
              className={`${buttonLight} disabled:opacity-50`}
              disabled={avatarUploading || saving}
              onClick={onAvatarDelete}
            >
              Usuń zdjęcie
            </button>
          ) : (
            <button
              type="button"
              className={`${buttonLight} disabled:opacity-50`}
              disabled={avatarUploading || saving}
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarUploading ? "Wgrywanie…" : "Zmień zdjęcie"}
            </button>
          )}
          {extraActions}
        </>
      }
      tabs={tabs}
    >
      {profileError ? (
        <p className="mt-5 text-sm text-red-600" role="alert">
          {profileError}
        </p>
      ) : null}
    </ProfileHeroPanel>
  );
};

/** Account fields shown under the Informacje tab. */
export const ProfileAccountDetails: React.FC<ProfileAccountDetailsProps> = ({
  email,
  linkedInUrl,
  githubUrl,
  websiteUrl,
  saving,
  isPublicProfile,
  menuOpenFor,
  editingField,
  editingValue,
  onEditValueChange,
  onMenuToggle,
  onStartEditing,
  onCancelEditing,
  onSaveField,
  onDeleteField,
  onSaveLinks,
  children,
}) => (
  <AppCard className="space-y-5">
    <div>
      <h2 className="text-lg font-semibold tracking-[-0.02em] text-neutral-900">Informacje</h2>
      <p className="mt-1 text-sm leading-relaxed text-neutral-500">
        {isPublicProfile
          ? "Konto publiczne: pełne dane konta, w tym e-mail. Widoczność dokumentów ustawiasz osobno."
          : "Konto prywatne (Web3): bez e-maila i danych konta tradycyjnego. Dokumenty działają jak dotychczas."}
      </p>
    </div>

    {isPublicProfile ? (
      <div className="space-y-3 text-sm text-neutral-700">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-neutral-500">E-mail</span>
          {editingField === "email" ? (
            <>
              <input
                value={editingValue}
                onChange={e => onEditValueChange(e.target.value)}
                placeholder="Wpisz e-mail"
                className={inputClass}
                aria-label="E-mail"
              />
              <button
                type="button"
                className={buttonDark}
                onClick={() => void onSaveField("email")}
                disabled={saving}
              >
                Zapisz
              </button>
              <button type="button" className={buttonLight} onClick={onCancelEditing} disabled={saving}>
                Anuluj
              </button>
            </>
          ) : (
            <>
              <span>{email ?? "Brak e-maila"}</span>
              {email ? (
                <>
                  <button type="button" className="underline" onClick={() => onMenuToggle("email")}>
                    Menu
                  </button>
                  {menuOpenFor === "email" ? (
                    <>
                      <button type="button" onClick={() => onStartEditing("email", email)}>
                        Edytuj
                      </button>
                      <button
                        type="button"
                        className="text-red-600"
                        onClick={() => void onDeleteField("email")}
                      >
                        Usuń
                      </button>
                    </>
                  ) : null}
                </>
              ) : (
                <button type="button" className="underline" onClick={() => onStartEditing("email", "")}>
                  Dodaj e-mail
                </button>
              )}
            </>
          )}
        </div>

        <ExternalLinksBlock
          linkedInUrl={linkedInUrl}
          githubUrl={githubUrl}
          websiteUrl={websiteUrl}
          editable
          saving={saving}
          onSave={onSaveLinks}
        />
      </div>
    ) : null}

    {children}
  </AppCard>
);

export default ProfileTabContent;
