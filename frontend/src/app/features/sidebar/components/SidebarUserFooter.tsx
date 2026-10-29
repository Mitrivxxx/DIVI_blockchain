import React from 'react';

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
    <section>
      <h2>Sesja</h2>
      <ul>
        <li>
          <button type="button" onClick={onProfileClick} aria-label="Przejdź do profilu">
            Profil: {displayAddress} · {formatRole(userRole)}
          </button>
        </li>
        <li>
          <button type="button" onClick={onLogout}>
            Wyloguj się
          </button>
        </li>
      </ul>
    </section>
  );
};

export default SidebarUserFooter;
