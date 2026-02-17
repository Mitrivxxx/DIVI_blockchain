export type TabKey = 'dashboard' | 'issuerRole' | 'upload' | 'myDocuments' | 'verify' | 'profile' | 'help';

export interface Tab {
  key: TabKey;
  label: string;
}

export const tabs: Tab[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'issuerRole', label: 'Apply for Issuer Role' },
  { key: 'upload', label: 'Dodaj Dokument' },
  { key: 'myDocuments', label: 'Moje Dokumenty' },
  { key: 'verify', label: 'Weryfikacja' },
  { key: 'profile', label: 'Profil' },
  { key: 'help', label: 'Pomoc' },
];
