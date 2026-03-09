import React from "react";
import type { ProfileTab } from "../types";

type ProfileTabsProps = {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
};

const ProfileTabs: React.FC<ProfileTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="profile-tabs" aria-label="Sekcje profilu">
      <button
        type="button"
        className={`profile-tab-btn ${activeTab === "profile" ? "is-active" : ""}`}
        onClick={() => onTabChange("profile")}
      >
        Profile
      </button>
      <button
        type="button"
        className={`profile-tab-btn ${activeTab === "certyfikat" ? "is-active" : ""}`}
        onClick={() => onTabChange("certyfikat")}
      >
        Certyfikat
      </button>
      <button
        type="button"
        className={`profile-tab-btn ${activeTab === "transactions" ? "is-active" : ""}`}
        onClick={() => onTabChange("transactions")}
      >
        Transactions
      </button>
    </nav>
  );
};

export default ProfileTabs;
