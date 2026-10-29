import { useState } from "react";
import { Container, SectionHeading } from "./ui";

const FAQ = [
  {
    question: "Czy muszę mieć konto, żeby zweryfikować dokument?",
    answer: "Nie. Weryfikacja jest publiczna i bezpłatna — wystarczy wrzucić plik PDF w formularzu na górze strony.",
  },
  {
    question: "Co dokładnie jest zapisane w blockchainie?",
    answer:
      "Hash SHA-256 pliku, jego CID w IPFS, adres wystawcy i właściciela, typ dokumentu, data wystawienia oraz aktualny status. Treść dokumentu nie jest zapisywana w kontrakcie.",
  },
  {
    question: "Dlaczego mój dokument ma status „Brak w blockchain”?",
    answer:
      "Plik różni się od tego, który wystawiono — wystarczy ponowny zapis, kompresja lub skan, aby zmienić hash. Do weryfikacji użyj oryginalnego PDF otrzymanego od wystawcy.",
  },
  {
    question: "Co oznacza status „Unieważniony”?",
    answer:
      "Dokument został wystawiony, ale wystawca lub administrator go unieważnił, np. z powodu błędu. Taki dokument nie powinien być uznawany.",
  },
  {
    question: "Kto może wystawiać dokumenty?",
    answer:
      "Tylko instytucje z rolą wystawcy. Rolę przyznaje administrator po akceptacji wniosku — wtedy adres portfela instytucji zostaje dopisany do smart kontraktu.",
  },
  {
    question: "Czym jest profil i jak pokazać swoje osiągnięcia?",
    answer:
      "Po zalogowaniu masz portfel credentials w pięciu sekcjach (wykształcenie, doświadczenie, licencje, rekomendacje, wyróżnienia). Każdy dokument możesz ustawić jako prywatny, udostępnić linkiem albo opublikować na profilu /u/… — widoczne są tylko potwierdzone wpisy.",
  },
  {
    question: "Na jakiej sieci działa DIVI?",
    answer: "Obecnie na sieci testowej Ethereum Sepolia. Każdą transakcję można podejrzeć w eksploratorze Etherscan.",
  },
];

export const LandingFaq = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-16 py-14 lg:py-20">
      <Container>
        <SectionHeading title="Najczęstsze pytania" description="Więcej odpowiedzi znajdziesz po zalogowaniu, w zakładce Pomoc." />
        <ul className="mx-auto mt-12 max-w-3xl space-y-3 lg:mt-16">
          {FAQ.map((item, index) => {
            const isOpen = openIndex === index;
            const panelId = `faq-panel-${index}`;
            return (
              <li
                key={item.question}
                className={`rounded-xl border bg-white/60 transition ${isOpen ? "border-neutral-300" : "border-hairline hover:border-neutral-300"}`}
              >
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-6 p-6 text-left text-lg font-medium text-neutral-900"
                  >
                    {item.question}
                    <span
                      aria-hidden="true"
                      className={`flex size-7 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition ${isOpen ? "rotate-45" : ""}`}
                    >
                      <svg viewBox="0 0 16 16" fill="none" className="size-3.5">
                        <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    </span>
                  </button>
                </h3>
                {isOpen && (
                  <p id={panelId} className="-mt-2 px-6 pb-6 text-base leading-relaxed text-neutral-500">
                    {item.answer}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
};
