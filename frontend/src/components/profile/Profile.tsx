import React, { useState } from "react";
import userIcon from "../../assets/icons/user.svg";
import ProfileTabContent from "./components/ProfileTabContent";
import ProfileTabs from "./components/ProfileTabs";
import { useProfile } from "./hooks/useProfile";
import type { ProfileProps } from "./types";
import "./Profile.scss";

const Profile: React.FC<ProfileProps> = ({ userRole, walletAddress }) => {
  const {
    loading,
    saving,
    activeTab,
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

  if (loading) {
    return (
      <section className="profile-mainlayout">
        <p>Ładowanie profilu...</p>
      </section>
    );
  }

  return (
    <section className="profile-mainlayout">
      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

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
      ) : (
        <div className="profile-empty-tab" />
      )}
    </section>
  );
};

export default Profile;
