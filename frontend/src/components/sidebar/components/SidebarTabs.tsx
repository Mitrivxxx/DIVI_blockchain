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
const tabsWithoutIssuerRole = tabs.filter(tab => tab.key !== 'issuerRole').map(tab => tab.key);
const adminTabs = tabs
  .filter(tab => tab.key !== 'issuerRole' && tab.key !== 'myDocuments')
  .map(tab => tab.key);

const visibleTabsByRole: Record<string, TabKey[]> = {
  issuer: tabsWithoutIssuerRole,
  admin: adminTabs,
  // Niezalogowany (null/undefined): traktujemy jak issuer
};

const publicTabs: TabKey[] = ['verify'];


function getVisibleTabs(userRole: string | null | undefined, tabs: Tab[]): Tab[] {
  const ensurePublicTabs = (tabKeys: TabKey[]) =>
    Array.from(new Set([...tabKeys, ...publicTabs]));

  const normalizedRole = userRole?.trim().toLowerCase();

  if (!normalizedRole || normalizedRole === 'issuer') {
    const allowed = ensurePublicTabs(visibleTabsByRole['issuer'] ?? tabs.map(tab => tab.key));
    return tabs.filter(tab => allowed.includes(tab.key));
  }

  const roleTabs = visibleTabsByRole[normalizedRole];
  if (roleTabs) {
    const allowed = ensurePublicTabs(roleTabs);
    return tabs.filter(tab => allowed.includes(tab.key));
  }

  const allTabs = ensurePublicTabs(tabs.map(tab => tab.key));
  return tabs.filter(tab => allTabs.includes(tab.key));

  // Jeśli chcesz dodać inne role, dodaj do visibleTabsByRole
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
