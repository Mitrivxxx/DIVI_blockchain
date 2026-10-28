import { useState } from "react";
import { Link } from "react-router-dom";
import { Container, GradientButton, LogoLink } from "./ui";

const NAV_ITEMS = [
  { href: "#verify", label: "Weryfikacja" },
  { href: "#how-it-works", label: "Jak to działa" },
  { href: "#issuers", label: "Dla wystawców" },
  { href: "#faq", label: "FAQ" },
];

type LandingHeaderProps = {
  onConnect: () => void;
  isConnecting: boolean;
};

export const LandingHeader = ({ onConnect, isConnecting }: LandingHeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/70 bg-canvas/85 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-6">
        <LogoLink onClick={closeMenu} />

        <nav aria-label="Główna nawigacja" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="text-sm font-medium text-neutral-600 transition hover:text-neutral-950">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-5 md:flex">
          <Link to="/login" className="text-sm font-medium text-neutral-700 transition hover:text-neutral-950">
            Zaloguj się
          </Link>
          <Link to="/auth" className="text-sm font-medium text-neutral-700 transition hover:text-neutral-950">
            Rejestracja
          </Link>
          <GradientButton onClick={onConnect} disabled={isConnecting}>
            {isConnecting ? "Łączenie…" : "Podłącz portfel"}
          </GradientButton>
        </div>

        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded text-neutral-900 md:hidden"
          aria-expanded={isMenuOpen}
          aria-controls="landing-mobile-menu"
          aria-label={isMenuOpen ? "Zamknij menu" : "Otwórz menu"}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <svg viewBox="0 0 24 24" fill="none" className="size-6" aria-hidden="true">
            {isMenuOpen ? (
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </Container>

      {isMenuOpen && (
        <div id="landing-mobile-menu" className="border-t border-neutral-200 bg-canvas md:hidden">
          <Container className="py-4">
            <ul className="flex flex-col">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={closeMenu}
                    className="block py-3 text-base font-medium text-neutral-700 hover:text-neutral-950"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-col gap-3 border-t border-neutral-200 pt-4">
              <Link to="/login" className="py-2 text-base font-medium text-neutral-700">
                Zaloguj się
              </Link>
              <Link to="/auth" className="py-2 text-base font-medium text-neutral-700">
                Rejestracja
              </Link>
              <GradientButton onClick={onConnect} disabled={isConnecting}>
                {isConnecting ? "Łączenie…" : "Podłącz portfel MetaMask"}
              </GradientButton>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
};
