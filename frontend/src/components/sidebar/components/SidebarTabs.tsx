import React from 'react';
import { tabs } from '../tabs';
import type { TabKey } from '../tabs';


interface SidebarTabsProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  userRole?: string | null;
}

import type { Tab } from '../tabs';

// Konfiguracja widocznych tabów dla ról
const visibleTabsByRole: Record<string, TabKey[]> = {
  Issuer: tabs.filter(tab => tab.key !== 'issuerRole').map(tab => tab.key),
  // Przykład: Admin: [...], User: [...]
  // Niezalogowany (null/undefined): traktujemy jak Issuer
};


function getVisibleTabs(userRole: string | null | undefined, tabs: Tab[]): Tab[] {
  if (!userRole || userRole === 'Issuer') {
    const allowed = visibleTabsByRole['Issuer'] ?? tabs.map(tab => tab.key);
    return tabs.filter(tab => allowed.includes(tab.key));
  }
  // Jeśli chcesz dodać inne role, dodaj do visibleTabsByRole
  return tabs;
}


const SidebarTabs: React.FC<SidebarTabsProps> = ({ activeTab, setActiveTab, userRole }) => {
  const visibleTabs = getVisibleTabs(userRole, tabs);
  return (
    <ul className="sidebar-list">
      {visibleTabs.map(tab => (
        <li
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          className={"sidebar-item" + (activeTab === tab.key ? " active" : "")}
        >
          {tab.label}
        </li>
      ))}
    </ul>
  );
};

export default SidebarTabs;
