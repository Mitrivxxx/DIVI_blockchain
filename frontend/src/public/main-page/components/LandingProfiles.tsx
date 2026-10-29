import { Link } from "react-router-dom";
import { CheckIcon, Container, SectionHeading, buttonDark, buttonLight } from "./ui";

const SECTIONS = [
  "Wykształcenie",
  "Doświadczenie",
  "Licencje i certyfikaty",
  "Rekomendacja",
  "Wyróżnienia i nagrody",
];

const HIGHLIGHTS = [
  "Publiczny adres profilu: /u/… — widoczne tylko potwierdzone dokumenty z widocznością publiczną.",
  "Każdy wpis możesz ustawić jako prywatny, niepubliczny link (unlisted) albo publiczny.",
  "Link /share/… udostępnia pojedyncze osiągnięcie bez ujawniania całego profilu.",
];

const MOCK_ITEMS = [
  { section: "Wykształcenie", title: "Inżynieria oprogramowania", meta: "2021 – 2025" },
  { section: "Licencje i certyfikaty", title: "Certyfikat zawodowy", meta: "Potwierdzony w łańcuchu" },
  { section: "Wyróżnienia i nagrody", title: "Nagroda dziekana", meta: "Widoczność: publiczna" },
];

export const LandingProfiles = () => (
  <section id="profiles" className="scroll-mt-16 py-14 lg:py-20">
    <Container>
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeading
            align="left"
            title="Profil z osiągnięciami w jednym miejscu"
            description="Każdy członek DIVI ma portfel credentials: dyplomy, doświadczenie, certyfikaty, rekomendacje i wyróżnienia — z kontrolą tego, co widzą inni."
          />

          <ul className="mt-8 flex flex-wrap gap-2">
            {SECTIONS.map((label) => (
              <li
                key={label}
                className="rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-sm font-medium text-neutral-700"
              >
                {label}
              </li>
            ))}
          </ul>

          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map((point) => (
              <li key={point} className="flex gap-3 text-base leading-relaxed text-neutral-600">
                <CheckIcon className="mt-0.5 size-5 shrink-0" />
                {point}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link to="/auth" className={buttonDark}>
              Załóż profil
            </Link>
            <Link to="/login" className={buttonLight}>
              Zaloguj się i otwórz profil
            </Link>
          </div>
        </div>

        <figure className="rounded-[20px] border-[12px] border-white/50 bg-white bg-clip-padding p-6 shadow-soft sm:p-8">
          <figcaption className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">Podgląd profilu</p>
              <p className="mt-1 text-lg font-semibold tracking-tight text-neutral-900">Portfel osiągnięć</p>
            </div>
            <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
              Confirmed
            </span>
          </figcaption>

          <div className="mt-6 flex items-center gap-4 rounded-xl border border-hairline bg-neutral-50/70 p-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-linear-to-l from-brand to-brand-pink text-sm font-semibold text-white">
              DV
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-neutral-900">Twój profil DIVI</p>
              <p className="truncate font-mono text-sm text-neutral-500">0x… · /u/adres</p>
            </div>
          </div>

          <ul className="mt-4 space-y-3">
            {MOCK_ITEMS.map((item) => (
              <li key={item.title} className="rounded-xl border border-hairline bg-white p-4">
                <p className="text-xs font-medium tracking-wide text-neutral-400 uppercase">{item.section}</p>
                <p className="mt-1 font-semibold text-neutral-900">{item.title}</p>
                <p className="mt-0.5 text-sm text-neutral-500">{item.meta}</p>
              </li>
            ))}
          </ul>

          <p className="mt-5 text-sm leading-relaxed text-neutral-500">
            Po zalogowaniu ustawiasz widoczność każdego dokumentu i udostępniasz cały profil albo pojedynczy link.
          </p>
        </figure>
      </div>
    </Container>
  </section>
);
