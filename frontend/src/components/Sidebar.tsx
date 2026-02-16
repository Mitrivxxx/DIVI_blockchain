import React from 'react';

type SidebarProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

const tabs = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'upload', label: 'Dodaj Dokument' },
  { key: 'myDocuments', label: 'Moje Dokumenty' },
  { key: 'verify', label: 'Weryfikacja' },
  { key: 'profile', label: 'Profil' },
  { key: 'help', label: 'Pomoc' },
];

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div style={{ width: '220px', background: '#f8f9fa', padding: '20px', minHeight: '100vh' }}>
      <h2>System</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {tabs.map(tab => (
          <li
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '12px 16px',
              margin: '6px 0',
              cursor: 'pointer',
              borderRadius: '6px',
              background: activeTab === tab.key ? '#007bff' : 'transparent',
              color: activeTab === tab.key ? '#fff' : '#333',
            }}
          >
            {tab.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
