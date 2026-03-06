import React from "react";
import type { EditableField } from "../types";

type ProfileTabContentProps = {
  avatar: string;
  role: string | null;
  displayName: string | null;
  email: string | null;
  bio: string | null;
  shortAddress: string | null;
  joinedAt: string | null;
  saving: boolean;
  menuOpenFor: EditableField | null;
  editingField: EditableField | null;
  editingValue: string;
  onEditValueChange: (value: string) => void;
  onMenuToggle: (field: EditableField) => void;
  onStartEditing: (field: EditableField, value: string) => void;
  onCancelEditing: () => void;
  onSaveField: (field: EditableField) => Promise<void>;
  onDeleteField: (field: EditableField) => Promise<void>;
};

const ProfileTabContent: React.FC<ProfileTabContentProps> = ({
  avatar,
  role,
  displayName,
  email,
  bio,
  shortAddress,
  joinedAt,
  saving,
  menuOpenFor,
  editingField,
  editingValue,
  onEditValueChange,
  onMenuToggle,
  onStartEditing,
  onCancelEditing,
  onSaveField,
  onDeleteField,
}) => {
  return (
    <>
      <header className="profile-header">
        <div className="profile-avatar-wrap">
          <img src={avatar} alt="Avatar" className="profile-avatar" />
        </div>

        <div className="profile-headline">
          {editingField === "name" ? (
            <div className="profile-edit-inline">
              <input
                className="profile-input"
                value={editingValue}
                onChange={e => onEditValueChange(e.target.value)}
                placeholder="Wpisz nazwę"
              />
              <button type="button" className="profile-add-btn" onClick={() => onSaveField("name")} disabled={saving}>
                Zapisz
              </button>
              <button type="button" className="profile-add-btn" onClick={onCancelEditing} disabled={saving}>
                Anuluj
              </button>
            </div>
          ) : (
            <div className="profile-field-with-menu">
              <h1 className="profile-name">{displayName ?? "Brak nazwy"}</h1>
              {displayName && (
                <div className="profile-menu-wrap">
                  <button
                    type="button"
                    className="profile-kebab-btn"
                    onClick={() => onMenuToggle("name")}
                  >
                    ...
                  </button>
                  {menuOpenFor === "name" && (
                    <div className="profile-menu">
                      <button type="button" onClick={() => onStartEditing("name", displayName)}>Edytuj</button>
                      <button type="button" onClick={() => onDeleteField("name")}>Usuń</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {!displayName && (
            <button type="button" className="profile-add-btn" onClick={() => onStartEditing("name", "")}>
              Dodaj nazwę
            </button>
          )}
          {role && <span className="profile-role-pill">{role}</span>}
        </div>
      </header>

      <div className="profile-divider" />

      <ul className="profile-details" aria-label="Szczegóły profilu">
        <li className="profile-row">
          <span className="profile-row-icon">⟠</span>
          {shortAddress ? (
            <span>{shortAddress}</span>
          ) : (
            <>
              <span>Brak adresu ETH</span>
              <button type="button" className="profile-add-btn">Dodaj adres ETH</button>
            </>
          )}
        </li>
        <li className="profile-row">
          <span className="profile-row-icon">✉</span>
          {editingField === "email" ? (
            <div className="profile-edit-inline profile-edit-inline--row">
              <input
                className="profile-input"
                value={editingValue}
                onChange={e => onEditValueChange(e.target.value)}
                placeholder="Wpisz e-mail"
              />
              <button type="button" className="profile-add-btn" onClick={() => onSaveField("email")} disabled={saving}>
                Zapisz
              </button>
              <button type="button" className="profile-add-btn" onClick={onCancelEditing} disabled={saving}>
                Anuluj
              </button>
            </div>
          ) : (
            <div className="profile-field-with-menu profile-field-with-menu--row">
              <span>{email ?? "Brak e-maila"}</span>
              {email ? (
                <div className="profile-menu-wrap">
                  <button
                    type="button"
                    className="profile-kebab-btn"
                    onClick={() => onMenuToggle("email")}
                  >
                    ...
                  </button>
                  {menuOpenFor === "email" && (
                    <div className="profile-menu">
                      <button type="button" onClick={() => onStartEditing("email", email)}>Edytuj</button>
                      <button type="button" onClick={() => onDeleteField("email")}>Usuń</button>
                    </div>
                  )}
                </div>
              ) : (
                <button type="button" className="profile-add-btn" onClick={() => onStartEditing("email", "")}>
                  Dodaj e-mail
                </button>
              )}
            </div>
          )}
        </li>
        {joinedAt && (
          <li className="profile-row">
            <span className="profile-row-icon">◷</span>
            <span>Dołączono: {joinedAt}</span>
          </li>
        )}
      </ul>

      <div className="profile-divider" />
      {editingField === "bio" ? (
        <div className="profile-edit-inline profile-edit-inline--bio">
          <input
            className="profile-input"
            value={editingValue}
            onChange={e => onEditValueChange(e.target.value)}
            placeholder="Wpisz bio"
          />
          <button type="button" className="profile-add-btn" onClick={() => onSaveField("bio")} disabled={saving}>
            Zapisz
          </button>
          <button type="button" className="profile-add-btn" onClick={onCancelEditing} disabled={saving}>
            Anuluj
          </button>
        </div>
      ) : bio ? (
        <div className="profile-field-with-menu profile-field-with-menu--bio">
          <p className="profile-bio">{bio}</p>
          <div className="profile-menu-wrap">
            <button
              type="button"
              className="profile-kebab-btn"
              onClick={() => onMenuToggle("bio")}
            >
              ...
            </button>
            {menuOpenFor === "bio" && (
              <div className="profile-menu">
                <button type="button" onClick={() => onStartEditing("bio", bio)}>Edytuj</button>
                <button type="button" onClick={() => onDeleteField("bio")}>Usuń</button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="profile-bio profile-bio--empty">
          Brak bio
          <button type="button" className="profile-add-btn" onClick={() => onStartEditing("bio", "")}>
            Dodaj bio
          </button>
        </p>
      )}
    </>
  );
};

export default ProfileTabContent;
