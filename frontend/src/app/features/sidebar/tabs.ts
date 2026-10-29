/**
 * @deprecated Prefer `features/navigation/routes.ts` — kept for legacy sidebar files.
 */
export type TabKey =
  | 'home'
  | 'network'
  | 'institutions'
  | 'issuerRole'
  | 'upload'
  | 'issuedDocuments'
  | 'myDocuments'
  | 'verify'
  | 'profile'
  | 'help'
  | 'notify';

export const defaultTabKey: TabKey = 'home';

const tabPathByKey: Record<TabKey, string> = {
  home: '',
  network: 'network',
  institutions: 'institutions',
  issuerRole: 'issuer-role',
  upload: 'upload',
  issuedDocuments: 'issued-documents',
  myDocuments: 'my-documents',
  verify: 'verify',
  profile: 'profile',
  help: 'help',
  notify: 'notifications',
};

export const getTabPath = (tabKey: TabKey): string => tabPathByKey[tabKey];

export const getTabKeyByPath = (path: string | undefined): TabKey | undefined => {
  if (!path) return 'home';
  const entry = Object.entries(tabPathByKey).find(([, p]) => p === path);
  return entry ? (entry[0] as TabKey) : undefined;
};
