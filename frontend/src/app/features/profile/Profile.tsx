import React, { useState } from "react";
import userIcon from "../../../assets/icons/user.svg";
import ProfileTabContent from "./components/ProfileTabContent";
import ProfileTabs from "./components/ProfileTabs";
import { useProfile } from "./hooks/useProfile";
import type { ProfileProps, ProfileTab } from "./types";
import "./Profile.scss";

const Profile: React.FC<ProfileProps> = ({ userRole, walletAddress }) => {
  const {
    loading,
    saving,
    activeTab,
    ownerCertificates,
    certificatesLoading,
    certificatesError,
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
    setActiveTab,
    setMenuOpenFor,
    setEditingValue,
    startEditing,
    cancelEditing,
    saveField,
    deleteField,
    loadOwnerCertificates,
  } = useProfile({ userRole, walletAddress, fallbackAvatar: userIcon });

  const handleMenuToggle = (field: "name" | "email" | "bio") => {
    setMenuOpenFor(menuOpenFor === field ? null : field);
  };

  const [copiedAddress, setCopiedAddress] = useState(false);

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

  const handleTabChange = (tab: ProfileTab) => {
    setActiveTab(tab);

    if (tab === "certyfikat") {
      void loadOwnerCertificates(profileAddress);
    }
  };

  if (loading) {
    return (
      <section className="profile-mainlayout">
        <p>Ładowanie profilu...</p>
      </section>
    );
  }

  return (
    <section className="profile-mainlayout">
      <ProfileTabs activeTab={activeTab} onTabChange={handleTabChange} />

      {activeTab === "profile" ? (
        <ProfileTabContent
          avatar={avatar}
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
        />
      ) : activeTab === "certyfikat" ? (
        <section className="profile-certificates-tab" aria-live="polite">
          <header className="profile-certificates-header">
            <h2 className="profile-certificates-title">Certyfikaty właściciela</h2>
            {profileAddress ? <p className="profile-certificates-address">{profileAddress}</p> : null}
          </header>

          {certificatesLoading ? <p>Ładowanie certyfikatów...</p> : null}
          {!certificatesLoading && certificatesError ? <p>{certificatesError}</p> : null}
          {!certificatesLoading && !certificatesError && ownerCertificates.length === 0 ? (
            <p>Brak certyfikatów dla tego adresu.</p>
          ) : null}

          {!certificatesLoading && !certificatesError && ownerCertificates.length > 0 ? (
            <ul className="profile-certificates-list">
              {ownerCertificates.map(certificate => (
                <li key={certificate.hash} className="profile-certificate-card">
                  <p className="profile-certificate-label">Hash</p>
                  <p className="profile-certificate-value profile-certificate-value--mono">{certificate.hash}</p>
                  <p className="profile-certificate-label">Issuer</p>
                  <p className="profile-certificate-value profile-certificate-value--mono">{certificate.issuer}</p>
                  <p className="profile-certificate-label">Issued at</p>
                  <p className="profile-certificate-value">
                    {new Date(certificate.issuedAt).toLocaleString("pl-PL")}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : activeTab === "transactions" ? (
        <section className="profile-certificates-tab" aria-live="polite">
          <header className="profile-certificates-header">
            <h2 className="profile-certificates-title">Historia transakcji</h2>
            {profileAddress ? <p className="profile-certificates-address">{profileAddress}</p> : null}
          </header>
          <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
            <p>Brak historii transakcji dla tego adresu.</p>
          </div>
        </section>
      ) : (
        <div className="profile-empty-tab" />
      )}
    </section>
  );
};

export default Profile;
