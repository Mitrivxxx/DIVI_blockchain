import React from 'react';
import { tabs } from '../../tabs';
import type { TabKey } from '../../tabs';

interface SidebarTabsProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
}

const SidebarTabs: React.FC<SidebarTabsProps> = ({ activeTab, setActiveTab }) => (
  <ul className="sidebar-list">
    {tabs.map(tab => (
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

export default SidebarTabs;
