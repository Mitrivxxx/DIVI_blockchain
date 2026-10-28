import { Link } from "react-router-dom";
import Verify from "@/shared/verify/Verify";
import { Container, buttonDark, buttonLight } from "./ui";

export const LandingHero = () => (
  <section id="top" className="relative overflow-hidden">
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-[640px] bg-[linear-gradient(to_right,#e7e7e7_1px,transparent_1px),linear-gradient(to_bottom,#e7e7e7_1px,transparent_1px)] bg-size-[64px_64px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]"
    />

    <Container className="relative">
      <div className="mx-auto max-w-3xl pt-14 pb-12 text-center sm:pt-20 lg:pt-24 lg:pb-16">
        <p className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-medium text-neutral-600 shadow-sm">
          <span className="size-1.5 rounded-full bg-linear-to-l from-brand to-brand-pink" />
          Dyplomy, certyfikaty i licencje zapisane w Ethereum
        </p>

        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.03em] text-neutral-900 sm:text-5xl lg:text-[64px] lg:leading-[1.08]">
          Sprawdź, czy dokument jest{" "}
          <span className="bg-linear-to-l from-brand to-brand-pink bg-clip-text text-transparent">prawdziwy</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-neutral-500 sm:text-lg">
          DIVI zapisuje odcisk SHA-256 każdego wystawionego dokumentu w smart kontrakcie. Wrzuć PDF, a w kilka sekund
          dowiesz się, czy pochodzi od zaufanego wystawcy i czy nadal jest ważny.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a href="#verify" className={buttonDark}>
            Zweryfikuj dokument
            <span aria-hidden="true">↓</span>
          </a>
          <Link to="/auth" className={buttonLight}>
            Wystawiaj dokumenty jako instytucja
          </Link>
        </div>
      </div>

      <div id="verify" className="relative scroll-mt-24 pb-16 lg:pb-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[10%] top-[12%] bottom-[18%] rounded-full bg-linear-to-l from-brand/25 to-brand-pink/25 blur-3xl"
        />
        <div className="relative mx-auto max-w-[1000px] rounded-[20px] border-[12px] border-white/50 bg-white bg-clip-padding shadow-soft">
          <Verify />
        </div>
        <ul className="mx-auto mt-6 flex max-w-[1000px] flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-neutral-500">
          <li>Bez konta i bez opłat</li>
          <li>Tylko pliki PDF do 5 MB</li>
          <li>Wynik prosto z blockchaina</li>
        </ul>
      </div>
    </Container>
  </section>
);
