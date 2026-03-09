import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { TabKey } from "../components/sidebar/tabs";
import Sidebar from "../components/sidebar/Sidebar";
import Dashboard from "../components/Dashboard";
import Upload from "../features/uploadFile/Upload";
import MyDocuments from "../components/MyDocuments";
import Verify from "../components/Verify";
import Profile from "../components/profile/Profile";
import Help from "../components/Help";
import IssuerRole from "../features/issuerRole/IssuerRole";
import Notify from "../shared/header/notify/Notify";
import Header from "../shared/header/Header";
import { fetchUserRole } from "../components/sidebar/api/api";
import { useUserRole } from "../components/sidebar/hooks/useUserRole";
import { useWeb3Auth } from "../app/hooks/useWeb3Auth";
import "./MainLayout.scss";

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const { address, jwt, logout } = useWeb3Auth();
  const [userRole] = useUserRole(address, fetchUserRole);

  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");

  const shortAddress = (addr: string) => addr.slice(0, 6) + "..." + addr.slice(-4);

  const handleBellClick = () => setActiveTab("notify");
  const handleUserClick = () => setActiveTab("profile");
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    if (!jwt) {
      navigate("/", { replace: true });
    }
  }, [jwt, navigate]);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "notify":
        return <Notify />;
      case "issuerRole":
        return <IssuerRole />;
      case "upload":
        return <Upload />;
      case "myDocuments":
        return <MyDocuments />;
      case "verify":
        return <Verify />;
      case "profile":
        return <Profile userRole={userRole} walletAddress={address} />;
      case "help":
        return <Help />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="mainlayout-root">
      <Header
        onBellClick={handleBellClick}
        onUserClick={handleUserClick}
        authMode="status"
        userRole={userRole}
        walletAddress={address}
        shortAddress={shortAddress}
        onLogout={handleLogout}
      />
      <div className="mainlayout-body">
        <nav className="mainlayout-nav">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole={userRole} />
        </nav>
        <main className="mainlayout-main">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
