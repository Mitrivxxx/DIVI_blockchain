import { Link } from "react-router-dom";
import { Container, SectionHeading, buttonDark } from "./ui";

const STEPS = [
  {
    title: "Załóż konto i podłącz portfel",
    text: "E-mail, Google lub MetaMask. Do wystawiania potrzebny jest adres Ethereum instytucji.",
  },
  {
    title: "Złóż wniosek o rolę wystawcy",
    text: "Podajesz nazwę instytucji i adres portfela. Wniosek zatwierdza administrator DIVI.",
  },
  {
    title: "Wystawiaj i zarządzaj dokumentami",
    text: "Wgrywasz PDF i wskazujesz właściciela. Plik trafia do IPFS, hash do smart kontraktu.",
  },
];

const CHIPS = [
  "Edukacja",
  "Certyfikaty zawodowe",
  "Dokumenty zatrudnienia",
  "Licencje",
  "Inne dokumenty",
];

export const LandingIssuers = () => (
  <section id="issuers" className="scroll-mt-16 py-14 lg:py-20">
    <Container>
      <div className="rounded-[20px] border border-white bg-linear-to-b from-white to-white/30 p-6 sm:p-10 lg:p-14">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div>
            <SectionHeading
              align="left"
              title="Dla uczelni, szkoleniowców i pracodawców"
              description="Wydawaj dokumenty, których autentyczność każdy sprawdzi sam — bez maili z prośbą o potwierdzenie."
            />
            <div className="mt-8">
              <p className="text-sm font-medium text-neutral-500">Obsługiwane typy dokumentów</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {CHIPS.map((chip) => (
                  <li
                    key={chip}
                    className="rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-sm font-medium text-neutral-700"
                  >
                    {chip}
                  </li>
                ))}
              </ul>
            </div>
            <Link to="/auth" className={`${buttonDark} mt-10`}>
              Złóż wniosek o rolę wystawcy
            </Link>
          </div>

          <ol className="space-y-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-5 rounded-xl border border-hairline bg-white p-6">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-linear-to-l from-brand to-brand-pink text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">{step.title}</h3>
                  <p className="mt-1.5 text-base leading-relaxed text-neutral-500">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Container>
  </section>
);
