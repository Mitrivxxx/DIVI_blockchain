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


type SidebarProps = {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  userRole?: string | null;
};



const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, userRole }) => {
  return (
    <div className="sidebar-root">
      <div>
        <h2 className="sidebar-title">System</h2>
        <SidebarTabs activeTab={activeTab} setActiveTab={setActiveTab} userRole={userRole} />
      </div>
    </div>
  );
};

export default Sidebar;
