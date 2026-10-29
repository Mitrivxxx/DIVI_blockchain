import React from 'react';
import IssuerRoleForm from './components/IssuerRoleForm';
import { AppCard } from '@/shared/ui';

const IssuerRole: React.FC = () => {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="text-sm font-medium text-neutral-500">Issuer Registration</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-[-0.02em] text-neutral-900">
          Wniosek o rolę Issuera
        </h1>
        <p className="mt-2 text-base leading-relaxed text-neutral-500">
          Po akceptacji admina backend wywoła `addIssuer` on-chain i ustawi rolę w bazie.
        </p>
      </div>
      <AppCard>
        <IssuerRoleForm />
      </AppCard>
    </div>
  );
};

export default IssuerRole;
