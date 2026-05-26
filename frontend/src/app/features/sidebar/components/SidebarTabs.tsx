import React from 'react';
import { tabs } from '../tabs';
import type { TabKey } from '../tabs';


interface SidebarTabsProps {
  activeTab: TabKey;
  onTabSelect: (tab: TabKey) => void;
  userRole?: string | null;
}

import type { Tab } from '../tabs';

// Konfiguracja widocznych tabów dla ról
const tabsWithoutIssuerRole = tabs.filter(tab => tab.key !== 'issuerRole').map(tab => tab.key);
const memberTabs = tabs.map(tab => tab.key); // Member widzi wszystko (w tym issuerRole)
const adminTabs = tabs
  .filter(tab => tab.key !== 'issuerRole' && tab.key !== 'myDocuments')
  .map(tab => tab.key);

const visibleTabsByRole: Record<string, TabKey[]> = {
  'issuer': tabsWithoutIssuerRole,
  '2': tabsWithoutIssuerRole, // 2 to zazwyczaj Issuer w bazie
  'admin': adminTabs,
  '1': adminTabs, // 1 to zazwyczaj Admin w bazie
  'member': memberTabs,
  '3': memberTabs, // 3 to zazwyczaj Member w bazie
};

const publicTabs: TabKey[] = ['verify'];


function getVisibleTabs(userRole: string | null | undefined, tabs: Tab[]): Tab[] {
  const ensurePublicTabs = (tabKeys: TabKey[]) =>
    Array.from(new Set([...tabKeys, ...publicTabs]));

  const normalizedRole = userRole?.trim().toLowerCase();

  // Jeśli brak roli (niezalogowany) -> pokazujemy taby dla 'member' (możliwość wnioskowania) 
  // LUB ograniczamy tylko do publicznych, zależnie od polityki.
  // Załóżmy, że role 3 (member) powinna widzieć issuerRole.
  
  if (!normalizedRole) {
    const allowed = ensurePublicTabs(visibleTabsByRole['member'] || memberTabs);
    return tabs.filter(tab => allowed.includes(tab.key));
  }

  const roleTabs = visibleTabsByRole[normalizedRole];
  if (roleTabs) {
    const allowed = ensurePublicTabs(roleTabs);
    return tabs.filter(tab => allowed.includes(tab.key));
  }


  // Fallback: pokaż wszystko co publiczne + resztę jeśli rola jest nieznana
  const allTabs = ensurePublicTabs(tabs.map(tab => tab.key));
  return tabs.filter(tab => allTabs.includes(tab.key));
}



const SidebarTabs: React.FC<SidebarTabsProps> = ({ activeTab, onTabSelect, userRole }) => {
  const visibleTabs = getVisibleTabs(userRole, tabs);
  return (
    <ul className="sidebar-list">
      {visibleTabs.map(tab => (
        <li
          key={tab.key}
          onClick={() => onTabSelect(tab.key)}
          className={"sidebar-item" + (activeTab === tab.key ? " active" : "")}
        >
          {tab.label}
        </li>
      ))}
    </ul>
  );
};

export default SidebarTabs;
