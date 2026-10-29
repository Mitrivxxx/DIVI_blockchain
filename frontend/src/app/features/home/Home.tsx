import React from "react";
import { Link, useOutletContext } from "react-router-dom";
import { AppCard, MissingBackendNote, buttonDark, buttonLight } from "@/shared/ui";
import { getRoutePath, isIssuerToolRole, isPlainUserRole } from "../navigation/routes";

type AppOutletContext = {
  userRole: string | null;
  walletAddress: string | null;
};

const Home: React.FC = () => {
  const { userRole } = useOutletContext<AppOutletContext>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.02em] text-neutral-900">Strona główna</h1>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-neutral-500">
          Szybki dostęp do weryfikacji, dokumentów i narzędzi wystawcy — zgodnie z Twoją rolą.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AppCard>
          <h2 className="text-lg font-semibold text-neutral-900">Weryfikacja</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500">
            Sprawdź PDF względem hasha w rejestrze on-chain.
          </p>
          <Link to={getRoutePath("verify")} className={`${buttonDark} mt-5`}>
            Zweryfikuj teraz
          </Link>
        </AppCard>

        <AppCard>
          <h2 className="text-lg font-semibold text-neutral-900">Moje dokumenty</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500">
            Dokumenty powiązane z Twoim adresem Ethereum.
          </p>
          <Link to={getRoutePath("myDocuments")} className={`${buttonLight} mt-5`}>
            Otwórz listę
          </Link>
        </AppCard>

        {isPlainUserRole(userRole) ? (
          <AppCard>
            <h2 className="text-lg font-semibold text-neutral-900">Zostań wystawcą</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-500">
              Złóż wniosek o rolę issuer — po akceptacji admina zyskasz dostęp do wystawiania.
            </p>
            <Link to={getRoutePath("issuerRole")} className={`${buttonDark} mt-5`}>
              Chcę być issuerem
            </Link>
          </AppCard>
        ) : null}

        {isIssuerToolRole(userRole) ? (
          <>
            <AppCard>
              <h2 className="text-lg font-semibold text-neutral-900">Wystaw dokument</h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                Upload PDF → IPFS + `issueDocument` na Sepolii.
              </p>
              <Link to={getRoutePath("upload")} className={`${buttonDark} mt-5`}>
                Dodaj dokument
              </Link>
            </AppCard>
            <AppCard>
              <h2 className="text-lg font-semibold text-neutral-900">Wystawione</h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                Lista dokumentów IssuedByMember z opcją unieważnienia.
              </p>
              <Link to={getRoutePath("issuedDocuments")} className={`${buttonLight} mt-5`}>
                Zarządzaj
              </Link>
            </AppCard>
          </>
        ) : null}
      </div>

      <AppCard className="space-y-3">
        <h2 className="text-lg font-semibold text-neutral-900">Feed aktywności</h2>
        <p className="text-sm leading-relaxed text-neutral-500">
          Tu pojawi się spersonalizowany przegląd: nowe dokumenty w Twojej sieci, rekomendowane
          instytucje i ostatnie weryfikacje.
        </p>
        <MissingBackendNote>
          feed społecznościowy / rekomendacje instytucji (brak API agregującego aktywność poza
          `GET /api/profiles/me/activity`)
        </MissingBackendNote>
      </AppCard>
    </div>
  );
};

export default Home;
