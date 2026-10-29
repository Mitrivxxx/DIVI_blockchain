import React from 'react';
import { AppCard, MissingBackendNote } from '@/shared/ui';

const Help: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.02em] text-neutral-900">Pomoc</h1>
        <p className="mt-2 text-base leading-relaxed text-neutral-500">
          FAQ i wsparcie dla użytkowników DIVI.
        </p>
      </div>
      <AppCard className="space-y-3">
        <p className="text-sm leading-relaxed text-neutral-500">
          Publiczne FAQ jest na stronie marketingowej (`/public#faq`). Tutaj docelowo znajdzie się
          kontekstowa pomoc aplikacji.
        </p>
        <MissingBackendNote>
          dedykowany helpdesk / ticketing oraz in-app FAQ (opcjonalnie CMS) — na razie tylko szkielet
        </MissingBackendNote>
      </AppCard>
    </div>
  );
};

export default Help;
