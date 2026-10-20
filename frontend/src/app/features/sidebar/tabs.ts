import type { SidebarIconName } from './components/SidebarIcons';

export type TabKey =
  | 'dashboard'
  | 'issuerRole'
  | 'upload'
  | 'issuedDocuments'
  | 'myDocuments'
  | 'verify'
  | 'profile'
  | 'help'
  | 'notify';

export type TabSectionId = 'overview' | 'documents' | 'account';

export interface Tab {
  key: Exclude<TabKey, 'notify'>;
  label: string;
  path: string;
  section: TabSectionId;
  icon: SidebarIconName;
}

export const tabSections: { id: TabSectionId; label: string }[] = [
  { id: 'overview', label: 'Przegląd' },
  { id: 'documents', label: 'Dokumenty' },
  { id: 'account', label: 'Konto' },
];

export const tabs: Tab[] = [
  { key: 'dashboard', label: 'Dashboard', path: 'dashboard', section: 'overview', icon: 'dashboard' },
  { key: 'upload', label: 'Dodaj dokument', path: 'upload', section: 'documents', icon: 'upload' },
  { key: 'issuedDocuments', label: 'Wystawione', path: 'issued-documents', section: 'documents', icon: 'issuer' },
  { key: 'myDocuments', label: 'Moje dokumenty', path: 'my-documents', section: 'documents', icon: 'documents' },
  { key: 'verify', label: 'Weryfikacja', path: 'verify', section: 'documents', icon: 'verify' },
  { key: 'issuerRole', label: 'Rola wystawcy', path: 'issuer-role', section: 'account', icon: 'issuer' },
  { key: 'profile', label: 'Profil', path: 'profile', section: 'account', icon: 'profile' },
  { key: 'help', label: 'Pomoc', path: 'help', section: 'account', icon: 'help' },
];

export const defaultTabKey: TabKey = 'dashboard';

const tabPathByKey: Record<TabKey, string> = {
  dashboard: 'dashboard',
  issuerRole: 'issuer-role',
  upload: 'upload',
  issuedDocuments: 'issued-documents',
  myDocuments: 'my-documents',
  verify: 'verify',
  profile: 'profile',
  help: 'help',
  notify: 'notifications',
};

const tabKeyByPath = Object.entries(tabPathByKey).reduce<Record<string, TabKey>>((accumulator, [key, path]) => {
  accumulator[path] = key as TabKey;
  return accumulator;
}, {});

export const getTabPath = (tabKey: TabKey): string => tabPathByKey[tabKey];

export const getTabKeyByPath = (path: string | undefined): TabKey | undefined => {
  if (!path) {
    return undefined;
  }

  return tabKeyByPath[path];
};
