
import React from 'react';
import RefreshIcon from '../../../assets/icons/refresh.svg';

interface SidebarFooterProps {
  userRole: string | null;
  walletAddress: string | null;
  shortAddress: (addr: string) => string;
  connect: () => Promise<void>;
}

const SidebarFooter: React.FC<SidebarFooterProps> = ({ userRole, walletAddress, shortAddress, connect }) => (
  <div className="sidebar-footer-auth">
    <div className="sidebar-footer-auth-block">
      <div className="sidebar-footer-auth-title">Autoryzacja</div>
      <div className="sidebar-footer-auth-status">
        {walletAddress ? (
          <>
            <div className="sidebar-footer-auth-address">
              {shortAddress(walletAddress)}
              <button
                className="sidebar-footer-refresh-btn"
                title="Zmień portfel / Odśwież adres"
                onClick={connect}
                style={{ marginLeft: 8 }}
              >
                <img src={RefreshIcon} alt="refresh" width={18} height={18} />
              </button>
            </div>
            <div className="sidebar-footer-auth-role">{userRole ? `Rola: ${userRole}` : ''}</div>
          </>
        ) : (
          <button className="sidebar-footer-auth-btn" onClick={connect}>
            Połącz portfel
          </button>
        )}
      </div>
    </div>
  </div>
);

export default SidebarFooter;
