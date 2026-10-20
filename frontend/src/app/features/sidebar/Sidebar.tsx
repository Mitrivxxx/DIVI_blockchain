// Dodajemy deklarację typu dla window.ethereum, aby TypeScript nie zgłaszał błędu
declare global {
  interface Window {
    ethereum?: any;
  }
}

import React from 'react';
import type { TabKey } from './tabs';
import './Sidebar.scss';
import SidebarTabs from './components/SidebarTabs';
import SidebarUserFooter from './components/SidebarUserFooter';

type SidebarProps = {
  activeTab: TabKey;
  onTabSelect: (tab: TabKey) => void;
  userRole?: string | null;
  walletAddress?: string | null;
  shortAddress?: (addr: string) => string;
  onLogout?: () => void;
  onProfileClick?: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabSelect,
  userRole,
  walletAddress,
  shortAddress,
  onLogout,
  onProfileClick,
}) => {
  return (
    <div className="sidebar-root">
      <div className="sidebar-top">
        <SidebarTabs activeTab={activeTab} onTabSelect={onTabSelect} userRole={userRole} />
      </div>
      <SidebarUserFooter
        userRole={userRole}
        walletAddress={walletAddress}
        shortAddress={shortAddress}
        onLogout={onLogout}
        onProfileClick={onProfileClick}
      />
    </div>
  );
};

export default Sidebar;
