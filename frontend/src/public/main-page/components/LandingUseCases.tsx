import { Container, SectionHeading } from "./ui";

const USE_CASES = [
  {
    role: "Absolwent i pracownik",
    initials: "AB",
    text: "Wszystkie dyplomy i certyfikaty masz w jednym profilu. Wysyłasz PDF rekruterowi i nie musisz niczego dodatkowo poświadczać.",
  },
  {
    role: "Rekruter i HR",
    initials: "HR",
    text: "Kandydat przysłał certyfikat? Wrzucasz plik na tę stronę i w kilka sekund wiesz, czy jest autentyczny i ważny.",
  },
  {
    role: "Uczelnia i firma szkoleniowa",
    initials: "UC",
    text: "Wystawiasz dokumenty raz, a ich weryfikacja nie wymaga już obsługi zapytań ani prowadzenia osobnego rejestru.",
  },
];

export const LandingUseCases = () => (
  <section className="py-14 lg:py-20">
    <Container>
      <SectionHeading
        title="Komu DIVI oszczędza czas"
        description="Jeden rejestr, trzy perspektywy — właściciela dokumentu, osoby sprawdzającej i wystawcy."
      />
      <ul className="mt-12 grid gap-4 lg:mt-16 lg:grid-cols-3 lg:gap-6">
        {USE_CASES.map((useCase) => (
          <li key={useCase.role} className="flex flex-col justify-between gap-8 rounded-xl bg-white p-8 shadow-soft">
            <p className="text-lg leading-relaxed text-neutral-700">{useCase.text}</p>
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold text-neutral-600">
                {useCase.initials}
              </span>
              <span className="text-sm font-semibold text-neutral-900">{useCase.role}</span>
            </div>
          </li>
        ))}
      </ul>
    </Container>
  </section>
);
