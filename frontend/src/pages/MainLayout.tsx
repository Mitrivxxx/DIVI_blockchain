import React, { useState, useEffect } from "react";
import type { TabKey } from "../components/tabs";
import { tabs } from "../components/tabs";
import Sidebar from "../components/sidebar/Sidebar";
import Dashboard from "../components/Dashboard";
import Upload from "../features/uploadFile/Upload";
import MyDocuments from "../components/MyDocuments";
import Verify from "../components/Verify";
import Profile from "../components/Profile";
import Help from "../components/Help";
import IssuerRole from "../features/issuerRole/IssuerRole";
import Notify from "../features/notify/Notify";
import bell from "../assets/icons/bell.svg";
import user from "../assets/icons/user.svg";
import "./MainLayout.scss";

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [showNotify, setShowNotify] = useState(false);

  // Reset showNotify when activeTab changes
  useEffect(() => {
    setShowNotify(false);
  }, [activeTab]);

  const handleBellClick = () => setShowNotify(true);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "issuerRole":
        return <IssuerRole />;
      case "upload":
        return <Upload />;
      case "myDocuments":
        return <MyDocuments />;
      case "verify":
        return <Verify />;
      case "profile":
        return <Profile />;
      case "help":
        return <Help />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="mainlayout-root">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="mainlayout-content">
        {/* Header */}
        <div className="mainlayout-header">
          <div className="mainlayout-title">
            {showNotify
              ? "Powiadomienia"
              : (tabs.find(tab => tab.key === activeTab)?.label || "")}
          </div>
          <div className="mainlayout-header-icons">
            <img src={bell} alt="Notifications" className="-bellmainlayout" onClick={handleBellClick} />
            <img src={user} alt="User Profile" className="mainlayout-user" />
          </div>
        </div>
        {/* Main content */}
        <div className="mainlayout-main">
          {showNotify ? <Notify /> : renderContent()}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
