// Dodajemy deklarację typu dla window.ethereum, aby TypeScript nie zgłaszał błędu
declare global {
  interface Window {
    ethereum?: any;
  }
}
import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';

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
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    const getAddress = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.send('eth_requestAccounts', []);
          if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0]);
          }
        } catch (err) {
          setWalletAddress(null);
        }
      } else {
        setWalletAddress(null);
      }
    };
    getAddress();
  }, []);

  // Skraca adres do formatu 0x1234...abcd
  const shortAddress = (addr: string) => addr.slice(0, 6) + '...' + addr.slice(-4);

  return (
    <div style={{ width: '220px', background: '#f8f9fa', padding: '20px', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
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
      <div style={{ marginTop: 'auto', paddingTop: '24px', fontSize: '14px', color: '#666' }}>
        Adres ETH: {walletAddress ? <span style={{ fontWeight: 600 }}>{shortAddress(walletAddress)}</span> : <span style={{ color: '#bbb' }}>Brak połączenia</span>}
      </div>
    </div>
  );
};

export default Sidebar;
