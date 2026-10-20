import React from 'react';
import { tabSections, tabs } from '../tabs';
import type { Tab, TabKey } from '../tabs';
import { SidebarIcon } from './SidebarIcons';

interface SidebarTabsProps {
  activeTab: TabKey;
  onTabSelect: (tab: TabKey) => void;
  userRole?: string | null;
}

/** Regular user: apply for issuer, view own docs, verify. */
const userTabs: TabKey[] = ['dashboard', 'issuerRole', 'myDocuments', 'verify', 'profile', 'help'];

/** Issuer / admin / owner: upload + issued list (revoke) + own docs. */
const issuerToolTabs: TabKey[] = [
  'dashboard',
  'upload',
  'issuedDocuments',
  'myDocuments',
  'verify',
  'profile',
  'help',
];

/** Owner keeps issuer-role tab for visibility into the application flow. */
const ownerTabs: TabKey[] = [...issuerToolTabs, 'issuerRole'];

const visibleTabsByRole: Record<string, TabKey[]> = {
  issuer: issuerToolTabs,
  '2': issuerToolTabs,
  admin: issuerToolTabs,
  '1': issuerToolTabs,
  owner: ownerTabs,
  '4': ownerTabs,
  user: userTabs,
  member: userTabs,
  '3': userTabs,
};

const publicTabs: TabKey[] = ['verify'];

function getVisibleTabs(userRole: string | null | undefined, allTabs: Tab[]): Tab[] {
  const ensurePublicTabs = (tabKeys: TabKey[]) =>
    Array.from(new Set([...tabKeys, ...publicTabs]));

  const normalizedRole = userRole?.trim().toLowerCase();

  if (!normalizedRole) {
    const allowed = ensurePublicTabs(visibleTabsByRole.user);
    return allTabs.filter(tab => allowed.includes(tab.key));
  }

  const roleTabs = visibleTabsByRole[normalizedRole];
  if (roleTabs) {
    const allowed = ensurePublicTabs(roleTabs);
    return allTabs.filter(tab => allowed.includes(tab.key));
  }

  const allAllowed = ensurePublicTabs(allTabs.map(tab => tab.key));
  return allTabs.filter(tab => allAllowed.includes(tab.key));
}

const SidebarTabs: React.FC<SidebarTabsProps> = ({ activeTab, onTabSelect, userRole }) => {
  const visibleTabs = getVisibleTabs(userRole, tabs);

  return (
    <nav className="sidebar-nav" aria-label="Nawigacja aplikacji">
      {tabSections.map(section => {
        const sectionTabs = visibleTabs.filter(tab => tab.section === section.id);
        if (sectionTabs.length === 0) {
          return null;
        }

        return (
          <section key={section.id} className="sidebar-section">
            <h2 className="sidebar-section-title">{section.label}</h2>
            <ul className="sidebar-list">
              {sectionTabs.map(tab => {
                const isActive = activeTab === tab.key;
                return (
                  <li key={tab.key}>
                    <button
                      type="button"
                      onClick={() => onTabSelect(tab.key)}
                      className={`sidebar-item${isActive ? ' active' : ''}`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <SidebarIcon name={tab.icon} className="sidebar-item-icon" />
                      <span className="sidebar-item-label">{tab.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </nav>
  );
};

export default SidebarTabs;
