import React, { useRef } from "react";
import type { EditableField } from "../types";
import { buttonDark, buttonLight } from "@/shared/ui";

type ProfileTabContentProps = {
  avatar: string;
  hasCustomAvatar: boolean;
  avatarUploading: boolean;
  profileError: string | null;
  role: string | null;
  displayName: string | null;
  email: string | null;
  bio: string | null;
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
  onCopyAddress: () => Promise<void> | void;
  onPublicProfileChange: (isPublic: boolean) => void;
  onAvatarSelected: (file: File) => void;
  onAvatarDelete: () => void;
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

const ProfileTabContent: React.FC<ProfileTabContentProps> = ({
  avatar,
  hasCustomAvatar,
  avatarUploading,
  profileError,
  role,
  displayName,
  email,
  bio,
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
  onCopyAddress,
  onPublicProfileChange,
  onAvatarSelected,
  onAvatarDelete,
}) => {
  const roleLabel = formatRole(role);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start gap-4">
        <div className="space-y-2">
          <button
            type="button"
            className="group relative block overflow-hidden rounded-xl border border-hairline bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUploading || saving}
            aria-label="Zmień zdjęcie profilowe"
          >
            <img
              src={avatar}
              alt="Avatar"
              className="size-16 object-cover transition group-hover:opacity-80"
            />
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
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="text-xs font-medium underline disabled:opacity-50"
              disabled={avatarUploading || saving}
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarUploading ? "Wgrywanie…" : "Zmień zdjęcie"}
            </button>
            {hasCustomAvatar ? (
              <button
                type="button"
                className="text-xs font-medium text-red-600 underline disabled:opacity-50"
                disabled={avatarUploading || saving}
                onClick={onAvatarDelete}
              >
                Usuń
              </button>
            ) : null}
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          {editingField === "name" ? (
            <div className="flex flex-wrap gap-2">
              <input
                value={editingValue}
                onChange={e => onEditValueChange(e.target.value)}
                placeholder="Wpisz nazwę"
                className={inputClass}
              />
              <button type="button" className={buttonDark} onClick={() => onSaveField("name")} disabled={saving}>
                Zapisz
              </button>
              <button type="button" className={buttonLight} onClick={onCancelEditing} disabled={saving}>
                Anuluj
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-[-0.02em] text-neutral-900">
                {displayName ?? "Brak nazwy"}
              </h1>
              {displayName ? (
                <>
                  <button type="button" className="text-sm font-medium text-neutral-600 underline" onClick={() => onMenuToggle("name")}>
                    Menu
                  </button>
                  {menuOpenFor === "name" ? (
                    <>
                      <button type="button" className="text-sm" onClick={() => onStartEditing("name", displayName)}>Edytuj</button>
                      <button type="button" className="text-sm text-red-600" onClick={() => onDeleteField("name")}>Usuń</button>
                    </>
                  ) : null}
                </>
              ) : (
                <button type="button" className="text-sm font-medium underline" onClick={() => onStartEditing("name", "")}>
                  Dodaj nazwę
                </button>
              )}
              {roleLabel ? (
                <span className="rounded bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-700">
                  {roleLabel}
                </span>
              ) : null}
            </div>
          )}
        </div>
      </header>

      {profileError ? <p className="text-sm text-red-600">{profileError}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hairline bg-neutral-50 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-neutral-900">
            {isPublicProfile ? "Profil publiczny" : "Profil prywatny"}
          </p>
          <p className="text-xs text-neutral-500">
            {isPublicProfile
              ? "Pokazujemy pełny profil: dokumenty, historię i formularz instytucji."
              : "Tryb prywatny: tylko sekcja Profil oraz Instytucja (podgląd, bez formularza)."}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isPublicProfile}
          className={buttonLight}
          onClick={() => onPublicProfileChange(!isPublicProfile)}
        >
          Przełącz na {isPublicProfile ? "prywatny" : "publiczny"}
        </button>
      </div>

      <ul className="space-y-3 text-sm text-neutral-700" aria-label="Szczegóły profilu">
        <li className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-neutral-500">ETH</span>
          <span className="font-mono">{shortAddress ?? profileAddress ?? "Brak adresu ETH"}</span>
          {shortAddress ? (
            <>
              <button type="button" className="underline" onClick={onCopyAddress}>Skopiuj</button>
              {copiedAddress ? <span className="text-emerald-600">Skopiowano</span> : null}
            </>
          ) : (
            <button type="button" className="underline">Dodaj adres ETH</button>
          )}
        </li>
        <li className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-neutral-500">E-mail</span>
          {editingField === "email" ? (
            <>
              <input
                value={editingValue}
                onChange={e => onEditValueChange(e.target.value)}
                placeholder="Wpisz e-mail"
                className={inputClass}
              />
              <button type="button" className={buttonDark} onClick={() => onSaveField("email")} disabled={saving}>Zapisz</button>
              <button type="button" className={buttonLight} onClick={onCancelEditing} disabled={saving}>Anuluj</button>
            </>
          ) : (
            <>
              <span>{email ?? "Brak e-maila"}</span>
              {email ? (
                <>
                  <button type="button" className="underline" onClick={() => onMenuToggle("email")}>Menu</button>
                  {menuOpenFor === "email" ? (
                    <>
                      <button type="button" onClick={() => onStartEditing("email", email)}>Edytuj</button>
                      <button type="button" className="text-red-600" onClick={() => onDeleteField("email")}>Usuń</button>
                    </>
                  ) : null}
                </>
              ) : (
                <button type="button" className="underline" onClick={() => onStartEditing("email", "")}>Dodaj e-mail</button>
              )}
            </>
          )}
        </li>
        {joinedAt ? (
          <li>
            <span className="font-medium text-neutral-500">Dołączono</span> {joinedAt}
          </li>
        ) : null}
      </ul>

      <div className="border-t border-hairline pt-4">
        {editingField === "bio" ? (
          <div className="flex flex-wrap gap-2">
            <input
              value={editingValue}
              onChange={e => onEditValueChange(e.target.value)}
              placeholder="Wpisz bio"
              className={`${inputClass} min-w-[16rem] flex-1`}
            />
            <button type="button" className={buttonDark} onClick={() => onSaveField("bio")} disabled={saving}>Zapisz</button>
            <button type="button" className={buttonLight} onClick={onCancelEditing} disabled={saving}>Anuluj</button>
          </div>
        ) : bio ? (
          <p className="text-sm leading-relaxed text-neutral-700">
            {bio}{" "}
            <button type="button" className="underline" onClick={() => onMenuToggle("bio")}>Menu</button>
            {menuOpenFor === "bio" ? (
              <>
                {" "}
                <button type="button" onClick={() => onStartEditing("bio", bio)}>Edytuj</button>{" "}
                <button type="button" className="text-red-600" onClick={() => onDeleteField("bio")}>Usuń</button>
              </>
            ) : null}
          </p>
        ) : (
          <p className="text-sm text-neutral-500">
            Brak bio{" "}
            <button type="button" className="underline" onClick={() => onStartEditing("bio", "")}>
              Dodaj bio
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default ProfileTabContent;
