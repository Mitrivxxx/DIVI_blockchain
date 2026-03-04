// Dodajemy deklarację typu dla window.ethereum, aby TypeScript nie zgłaszał błędu
declare global {
  interface Window {
    ethereum?: any;
  }
}

import React from 'react';
import type { TabKey } from './tabs';
import './Sidebar.scss';
import { fetchUserRole } from './api/api';
import { useWalletAddress } from './hooks/useWalletAddress';
import { useUserRole } from './hooks/useUserRole';
import { useWeb3Auth } from '../../app/hooks/useWeb3Auth';
import SidebarTabs from './components/SidebarTabs';
import SidebarFooter from './components/SidebarFooter';


type SidebarProps = {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
};



const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { address, connect, signAndVerifyNonce } = useWeb3Auth();
  const [userRole] = useUserRole(address, fetchUserRole);

  // Skraca adres do formatu 0x1234...abcd
  const shortAddress = (addr: string) => addr.slice(0, 6) + '...' + addr.slice(-4);


  // Połącz portfel (przycisk) i od razu odśwież token
  const connectWallet = async () => {
    await connect();
    // Po połączeniu od razu pobierz i zapisz nowy token
    await signAndVerifyNonce();
  };

  // Wywołaj signAndVerifyNonce automatycznie po ustawieniu address
  React.useEffect(() => {
    if (address) {
      signAndVerifyNonce();
    }
  }, [address, signAndVerifyNonce]);

  return (
    <div className="sidebar-root">
      <div>
        <h2 className="sidebar-title">System</h2>
        <SidebarTabs activeTab={activeTab} setActiveTab={setActiveTab} userRole={userRole} />
      </div>
      <SidebarFooter
        userRole={userRole}
        walletAddress={address}
        shortAddress={shortAddress}
        connect={connectWallet}
      />
    </div>
  );
};

export default Sidebar;
