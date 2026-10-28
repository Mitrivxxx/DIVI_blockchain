import { CheckIcon, Container, SectionHeading } from "./ui";

const POINTS = [
  "Hash liczymy z całej zawartości pliku — zmiana jednego znaku daje zupełnie inny wynik.",
  "Smart kontrakt przechowuje hash, CID pliku w IPFS, wystawcę, właściciela, typ i status dokumentu.",
  "Wpisu w blockchainie nie da się po cichu podmienić — każda zmiana statusu zostaje w historii transakcji.",
  "Wystawca może dokument unieważnić, a weryfikacja od razu to pokaże.",
];

const FLOW = [
  { step: "01", label: "Plik PDF", value: "dyplom_inzynierski.pdf" },
  { step: "02", label: "Odcisk SHA-256", value: "9f2c4e…b81a41e", mono: true },
  { step: "03", label: "Smart kontrakt DocumentIssuer", value: "Status: Confirmed" },
];

export const LandingHowItWorks = () => (
  <section id="how-it-works" className="scroll-mt-16 py-14 lg:py-20">
    <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
      <div>
        <SectionHeading
          align="left"
          title="Jedno porównanie zamiast telefonów do uczelni"
          description="Weryfikacja nie polega na zaufaniu do pieczątki ani do skanu. Porównujemy matematyczny odcisk pliku z wpisem, który wystawca zostawił w blockchainie."
        />
        <ul className="mt-8 space-y-4">
          {POINTS.map((point) => (
            <li key={point} className="flex gap-3 text-base leading-relaxed text-neutral-600">
              <CheckIcon className="mt-0.5 size-5 shrink-0" />
              {point}
            </li>
          ))}
        </ul>
      </div>

      <figure className="rounded-[20px] border-[12px] border-white/50 bg-white bg-clip-padding p-6 shadow-soft sm:p-8">
        <figcaption className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
          Przykładowa weryfikacja
        </figcaption>
        <ol className="mt-6 space-y-3">
          {FLOW.map((item, index) => (
            <li key={item.step}>
              <div className="flex items-center gap-4 rounded-lg border border-hairline bg-neutral-50/60 p-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-white text-sm font-semibold text-neutral-900 shadow-sm">
                  {item.step}
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-neutral-500">{item.label}</p>
                  <p className={`truncate font-medium text-neutral-900 ${item.mono ? "font-mono text-sm" : ""}`}>
                    {item.value}
                  </p>
                </div>
              </div>
              {index < FLOW.length - 1 && <div aria-hidden="true" className="ml-9 h-3 w-px bg-neutral-200" />}
            </li>
          ))}
        </ol>
        <div className="mt-6 flex items-center gap-3 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <span className="size-2 rounded-full bg-emerald-500" />
          Hash zgodny — dokument autentyczny
        </div>
      </figure>
    </Container>
  </section>
);
