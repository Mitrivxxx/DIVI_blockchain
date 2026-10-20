import React from 'react';
import { SidebarIcon } from './SidebarIcons';

type SidebarUserFooterProps = {
  userRole?: string | null;
  walletAddress?: string | null;
  shortAddress?: (addr: string) => string;
  onLogout?: () => void;
  onProfileClick?: () => void;
};

const formatRole = (role: string | null | undefined): string => {
  if (!role) return 'Użytkownik';
  const normalized = role.trim().toLowerCase();
  const labels: Record<string, string> = {
    owner: 'Właściciel',
    '4': 'Właściciel',
    admin: 'Administrator',
    '1': 'Administrator',
    issuer: 'Wystawca',
    '2': 'Wystawca',
    user: 'Użytkownik',
    member: 'Użytkownik',
    '3': 'Użytkownik',
  };
  return labels[normalized] ?? role;
};

const SidebarUserFooter: React.FC<SidebarUserFooterProps> = ({
  userRole,
  walletAddress,
  shortAddress,
  onLogout,
  onProfileClick,
}) => {
  const displayAddress =
    walletAddress && shortAddress
      ? shortAddress(walletAddress)
      : 'Brak połączonego portfela';

  return (
    <div className="sidebar-user-footer">
      <section className="sidebar-section">
        <h2 className="sidebar-section-title">Sesja</h2>
        <ul className="sidebar-list">
          <li>
            <button
              type="button"
              className="sidebar-item sidebar-item--user"
              onClick={onProfileClick}
              aria-label="Przejdź do profilu"
            >
              <SidebarIcon name="user" className="sidebar-item-icon" />
              <span className="sidebar-user-info">
                <span className="sidebar-user-address">{displayAddress}</span>
                <span className="sidebar-user-role">{formatRole(userRole)}</span>
              </span>
            </button>
          </li>
          <li>
            <button type="button" className="sidebar-item" onClick={onLogout}>
              <SidebarIcon name="logout" className="sidebar-item-icon" />
              <span className="sidebar-item-label">Wyloguj się</span>
            </button>
          </li>
        </ul>
      </section>
    </div>
  );
};

export default SidebarUserFooter;
