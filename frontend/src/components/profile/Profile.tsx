import React from "react";
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
          shortAddress={shortAddress}
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
        />
      ) : (
        <div className="profile-empty-tab" />
      )}
    </section>
  );
};

export default Profile;
