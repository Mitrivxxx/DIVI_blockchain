export type TabKey = 'dashboard' | 'issuerRole' | 'upload' | 'myDocuments' | 'verify' | 'profile' | 'help' | 'notify';

export interface Tab {
  key: Exclude<TabKey, 'notify'>;
  label: string;
  path: string;
}

export const tabs: Tab[] = [
  { key: 'dashboard', label: 'Dashboard', path: 'dashboard' },
  { key: 'issuerRole', label: 'Apply for Issuer Role', path: 'issuer-role' },
  { key: 'upload', label: 'Dodaj Dokument', path: 'upload' },
  { key: 'myDocuments', label: 'Moje Dokumenty', path: 'my-documents' },
  { key: 'verify', label: 'Weryfikacja', path: 'verify' },
  { key: 'profile', label: 'Profil', path: 'profile' },
  { key: 'help', label: 'Pomoc', path: 'help' },
];

export const defaultTabKey: TabKey = 'dashboard';

const tabPathByKey: Record<TabKey, string> = {
  dashboard: 'dashboard',
  issuerRole: 'issuer-role',
  upload: 'upload',
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
