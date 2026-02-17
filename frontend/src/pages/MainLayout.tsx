import React, { useState } from "react";
import type { TabKey } from "../components/tabs";
import Sidebar from "../components/Sidebar";
import Dashboard from "../components/Dashboard";
import Upload from "../components/Upload";
import MyDocuments from "../components/MyDocuments";
import Verify from "../components/Verify";
import Profile from "../components/Profile";
import Help from "../components/Help";
import IssuerRole from "../components/IssuerRole";
import Notify from "../components/Notify";
import bell from "../assets/icons/bell.svg";
import user from "../assets/icons/user.svg";

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [showNotify, setShowNotify] = useState(false);

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
    <div style={{ display: "flex" }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div
        style={{
          flex: 1,
          background: "#f0f2f5",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px 20px", background: "#fff", alignItems: "center" }}>
          <img src={bell} alt="Notifications" style={{ width: "24px", height: "24px", marginRight: "20px", cursor: "pointer" }} onClick={handleBellClick} />
          <img src={user} alt="User Profile" style={{ width: "24px", height: "24px", cursor: "pointer" }} />
        </div>
        {/* Main content */}
        <div style={{ flex: 1, padding: "20px" }}>
          {showNotify ? <Notify /> : renderContent()}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
