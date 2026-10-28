import { Link } from "react-router-dom";
import { Container } from "./ui";

export const LandingCta = () => (
  <section className="py-14 lg:py-20">
    <Container>
      <div className="relative overflow-hidden rounded-[20px] bg-neutral-950 px-6 py-14 text-center sm:px-12 lg:py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[640px] -translate-x-1/2 rounded-full bg-linear-to-l from-brand/40 to-brand-pink/40 blur-3xl"
        />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl lg:text-[44px] lg:leading-[1.15]">
            Masz dokument do sprawdzenia?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-neutral-400 sm:text-lg">
            Weryfikacja zajmuje kilka sekund. Konto przyda się dopiero wtedy, gdy zechcesz zbierać własne dokumenty lub je
            wystawiać.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="#verify"
              className="inline-flex items-center justify-center rounded bg-white px-5 py-3 text-sm font-medium text-neutral-900 transition hover:bg-neutral-200"
            >
              Zweryfikuj PDF
            </a>
            <Link
              to="/auth"
              className="inline-flex items-center justify-center rounded border border-neutral-700 px-5 py-3 text-sm font-medium text-white transition hover:border-neutral-500 hover:bg-neutral-900"
            >
              Załóż darmowe konto
            </Link>
          </div>
        </div>
      </div>
    </Container>
  </section>
);
