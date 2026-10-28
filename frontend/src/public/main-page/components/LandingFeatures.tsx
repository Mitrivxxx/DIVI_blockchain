import type { ReactNode } from "react";
import { Container, SectionHeading } from "./ui";

const icon = (path: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden="true">
    {path}
  </svg>
);

const FEATURES = [
  {
    title: "Odcisk SHA-256",
    text: "Każdy plik ma unikalny hash. Podrobiony lub edytowany PDF po prostu nie znajdzie się w rejestrze.",
    icon: icon(<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" />),
  },
  {
    title: "Pliki w IPFS",
    text: "Oryginał jest przypięty w IPFS przez Pinata, a jego CID trafia do smart kontraktu razem z hashem.",
    icon: icon(<path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Zm0 0v18M4 7.5l8 4.5 8-4.5" />),
  },
  {
    title: "Smart kontrakt",
    text: "DocumentIssuer na sieci Ethereum Sepolia jest jedynym źródłem prawdy o statusie dokumentu.",
    icon: icon(<path d="M8 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M14 4h4a2 2 0 0 1 2 2v4M9 15l3-3m0 0 3-3m-3 3-3-3m3 3 3 3" />),
  },
  {
    title: "Zaufani wystawcy",
    text: "Dokumenty wystawia tylko adres z rolą issuer w kontrakcie — nadawaną po akceptacji wniosku.",
    icon: icon(<path d="M12 3 5 6v5c0 4.4 3 8.3 7 10 4-1.7 7-5.6 7-10V6l-7-3Zm-3 9 2 2 4-4" />),
  },
  {
    title: "Unieważnianie",
    text: "Wystawca lub administrator może unieważnić dokument. Weryfikacja pokaże wtedy status Revoked.",
    icon: icon(<path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM5.6 5.6l12.8 12.8" />),
  },
  {
    title: "Trzy sposoby logowania",
    text: "E-mail i hasło, konto Google albo podpis portfelem MetaMask — dowolnie łączone na jednym koncie.",
    icon: icon(<path d="M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM5 21a7 7 0 0 1 14 0" />),
  },
];

export const LandingFeatures = () => (
  <section className="py-14 lg:py-20">
    <Container>
      <SectionHeading
        title="Bezpieczeństwo w każdej warstwie"
        description="Od hasha pliku, przez rozproszony storage, po uprawnienia w smart kontrakcie."
      />
      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3 lg:gap-6">
        {FEATURES.map((feature) => (
          <li
            key={feature.title}
            className="rounded-xl border border-white bg-linear-to-b from-white to-white/20 p-7 transition hover:border-neutral-200"
          >
            <span className="flex size-11 items-center justify-center rounded-lg bg-brand/10 text-brand">{feature.icon}</span>
            <h3 className="mt-6 text-xl font-semibold tracking-tight text-neutral-800">{feature.title}</h3>
            <p className="mt-2 text-base leading-relaxed text-neutral-500">{feature.text}</p>
          </li>
        ))}
      </ul>
    </Container>
  </section>
);
