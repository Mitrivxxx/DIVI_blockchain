import React from "react";
import { AppCard, MissingBackendNote } from "@/shared/ui";

const Institutions: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.02em] text-neutral-900">Instytucje</h1>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-neutral-500">
          Katalog zatwierdzonych wystawców — nazwa instytucji z `IssuerProfile` zamiast samego adresu
          hot-wallet.
        </p>
      </div>

      <AppCard className="space-y-4">
        <p className="text-sm leading-relaxed text-neutral-500">
          Lista instytucji jest pusta w tym szkielecie. Issuerzy edytują już własny profil
          (`GET/PATCH /api/issuer/profile`), ale publiczny katalog nie istnieje.
        </p>
        <MissingBackendNote>
          `GET /api/institutions` (lub podobny) — publiczny listing IssuerProfile (nazwa, kraj,
          strona, logo); opcjonalnie filtr/search oraz powiązanie z on-chain `authorizedIssuers`
        </MissingBackendNote>
      </AppCard>
    </div>
  );
};

export default Institutions;
