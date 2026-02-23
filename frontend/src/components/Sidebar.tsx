// Dodajemy deklarację typu dla window.ethereum, aby TypeScript nie zgłaszał błędu
declare global {
  interface Window {
    ethereum?: any;
  }
}

import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { tabs } from './tabs';
import type { TabKey } from './tabs';
import './Sidebar.scss';

type SidebarProps = {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
};



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
    <div className="sidebar-root">
      <div>
        <h2 className="sidebar-title">System</h2>
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
      </div>
      <div className="sidebar-footer">
        Adres ETH: {walletAddress ? <span>{shortAddress(walletAddress)}</span> : <span className="no-connection">Brak połączenia</span>}
      </div>
    </div>
  );
};

export default Sidebar;
