import { Link } from "react-router-dom";
import { Container, LogoLink } from "./ui";

const contractAddress = import.meta.env.VITE_BLOCKCHAIN_CONTRACT_ADDRESS as string | undefined;

const linkClass = "text-sm text-neutral-500 transition hover:text-neutral-900";

export const LandingFooter = () => (
  <footer className="border-t border-neutral-200/80 pt-14 pb-10">
    <Container>
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <div className="max-w-xs">
          <LogoLink to="/public" />
          <p className="mt-4 text-sm leading-relaxed text-neutral-500">
            Wystawianie i weryfikacja dokumentów z hashem zapisanym w blockchainie Ethereum.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-neutral-900">Produkt</h3>
          <ul className="mt-4 space-y-3">
            <li><a href="#verify" className={linkClass}>Weryfikacja PDF</a></li>
            <li><a href="#how-it-works" className={linkClass}>Jak to działa</a></li>
            <li><a href="#issuers" className={linkClass}>Dla wystawców</a></li>
            <li><a href="#profiles" className={linkClass}>Profile i osiągnięcia</a></li>
            <li><a href="#faq" className={linkClass}>FAQ</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-neutral-900">Konto</h3>
          <ul className="mt-4 space-y-3">
            <li><Link to="/login" className={linkClass}>Logowanie</Link></li>
            <li><Link to="/auth" className={linkClass}>Rejestracja</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-neutral-900">Blockchain</h3>
          <ul className="mt-4 space-y-3">
            <li>
              <a
                href={
                  contractAddress
                    ? `https://sepolia.etherscan.io/address/${contractAddress}`
                    : "https://sepolia.etherscan.io/"
                }
                target="_blank"
                rel="noreferrer"
                className={linkClass}
              >
                Smart kontrakt ↗
              </a>
            </li>
            <li>
              <a href="https://sepolia.etherscan.io/" target="_blank" rel="noreferrer" className={linkClass}>
                Sepolia Etherscan ↗
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-12 flex flex-col gap-2 border-t border-neutral-200/80 pt-6 text-sm text-neutral-400 sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} DIVI</p>
        <p>Sieć testowa Ethereum Sepolia</p>
      </div>
    </Container>
  </footer>
);
