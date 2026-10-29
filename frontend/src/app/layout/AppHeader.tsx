import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Container, LogoLink } from "@/shared/ui";
import {
  getRoutePath,
  isAdminReviewRole,
  isIssuerToolRole,
  isPlainUserRole,
  primaryNav,
} from "../features/navigation/routes";
import {
  resolveAvatarSrc,
  searchMembersApi,
  type MemberSearchResult,
} from "../features/profile/api/profileApi";
import { shortHex } from "@/types/documents";
import userIcon from "../../assets/icons/user.svg";

type AppHeaderProps = {
  userRole?: string | null;
  walletAddress?: string | null;
  shortAddress?: (addr: string) => string;
  onLogout: () => void;
};

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
    <path
      d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

const NetworkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
    <circle cx="12" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="6" cy="17" r="2.5" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="18" cy="17" r="2.5" stroke="currentColor" strokeWidth="1.6" />
    <path d="M10 8.5 7.5 14.5M14 8.5l2.5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const InstitutionsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
    <path
      d="M4 20h16M6 20V9l6-4 6 4v11M10 20v-5h4v5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const navIcons: Record<string, React.ReactNode> = {
  home: <HomeIcon />,
  network: <NetworkIcon />,
  institutions: <InstitutionsIcon />,
};

const AppHeader: React.FC<AppHeaderProps> = ({
  userRole,
  walletAddress,
  shortAddress,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MemberSearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target)) {
        setMenuOpen(false);
      }
      if (!searchRef.current?.contains(target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearchError(null);
      setSearchLoading(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          setSearchLoading(true);
          setSearchError(null);
          const results = await searchMembersApi(q);
          if (!cancelled) {
            setSearchResults(results);
            setSearchOpen(true);
          }
        } catch (err) {
          if (!cancelled) {
            setSearchResults([]);
            setSearchError(err instanceof Error ? err.message : "Błąd wyszukiwania.");
            setSearchOpen(true);
          }
        } finally {
          if (!cancelled) setSearchLoading(false);
        }
      })();
    }, 280);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [searchQuery]);

  const displayAddress =
    walletAddress && shortAddress ? shortAddress(walletAddress) : "Profil";

  const go = (path: string) => {
    setMenuOpen(false);
    navigate(path);
  };

  const openMemberProfile = (address: string) => {
    const normalized = address.trim().toLowerCase();
    const mine = walletAddress?.trim().toLowerCase();
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    if (mine && normalized === mine) {
      navigate(getRoutePath("profile"));
      return;
    }
    navigate(`/u/${encodeURIComponent(normalized)}`);
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const first = searchResults[0];
    if (first?.ethereumAddress) {
      openMemberProfile(first.ethereumAddress);
    } else {
      setSearchOpen(true);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/70 bg-canvas/85 backdrop-blur-md">
      <Container className="flex h-[4.5rem] items-center gap-4 lg:gap-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <LogoLink to="/" />
          <div ref={searchRef} className="relative hidden min-w-0 max-w-xs flex-1 sm:block">
            <form onSubmit={handleSearch}>
              <label className="sr-only" htmlFor="app-search">
                Szukaj użytkowników
              </label>
              <input
                id="app-search"
                type="search"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => {
                  if (searchQuery.trim().length >= 2) setSearchOpen(true);
                }}
                placeholder="Szukaj po nazwie lub adresie ETH…"
                autoComplete="off"
                className="w-full rounded-lg border border-hairline bg-white px-3 py-2 text-sm text-neutral-900 shadow-soft outline-none transition placeholder:text-neutral-400 focus:border-neutral-300"
              />
            </form>

            {searchOpen && searchQuery.trim().length >= 2 ? (
              <div
                role="listbox"
                aria-label="Wyniki wyszukiwania"
                className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-auto rounded-xl border border-hairline bg-white p-1.5 shadow-soft"
              >
                {searchLoading ? (
                  <p className="px-3 py-2 text-sm text-neutral-500">Szukam…</p>
                ) : null}
                {searchError ? (
                  <p className="px-3 py-2 text-sm text-red-600">{searchError}</p>
                ) : null}
                {!searchLoading && !searchError && searchResults.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-neutral-500">Brak wyników</p>
                ) : null}
                {!searchLoading &&
                  searchResults.map(result => {
                    const label =
                      result.name?.trim() || shortHex(result.ethereumAddress);
                    return (
                      <button
                        key={result.memberId}
                        type="button"
                        role="option"
                        className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition hover:bg-neutral-50"
                        onClick={() => openMemberProfile(result.ethereumAddress)}
                      >
                        <img
                          src={resolveAvatarSrc(result.avatarUrl, userIcon)}
                          alt=""
                          className="size-8 shrink-0 rounded-lg border border-hairline object-cover bg-neutral-100"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-neutral-900">
                            {label}
                          </span>
                          <span
                            className="block truncate font-mono text-xs text-neutral-500"
                            title={result.ethereumAddress}
                          >
                            {shortHex(result.ethereumAddress)}
                          </span>
                        </span>
                        {result.role ? (
                          <span className="shrink-0 text-[11px] uppercase tracking-wide text-neutral-400">
                            {result.role}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
              </div>
            ) : null}
          </div>
        </div>

        <nav aria-label="Główna nawigacja aplikacji" className="hidden md:block">
          <ul className="flex items-end gap-6 lg:gap-8">
            {primaryNav.map(item => (
              <li key={item.key}>
                <NavLink
                  to={item.path}
                  end={item.path === "/"}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1 text-neutral-500 transition hover:text-neutral-950 ${
                      isActive ? "text-neutral-950" : ""
                    }`
                  }
                >
                  {navIcons[item.key]}
                  <span className="text-[11px] font-medium leading-none">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="relative flex flex-1 justify-end" ref={menuRef}>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-white px-3 py-2 text-sm font-medium text-neutral-900 shadow-soft transition hover:bg-neutral-50"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => setMenuOpen(open => !open)}
          >
            <span className="max-w-[9rem] truncate">{displayAddress}</span>
            <span aria-hidden="true" className="text-neutral-400">
              ▾
            </span>
          </button>

          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-hairline bg-white p-2 shadow-soft"
            >
              <p className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
                Mój profil
              </p>
              <button
                type="button"
                role="menuitem"
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-50"
                onClick={() => go(getRoutePath("profile"))}
              >
                Wyświetl profil
              </button>
              <button
                type="button"
                role="menuitem"
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-50"
                onClick={() => go(getRoutePath("verify"))}
              >
                Zweryfikuj teraz
              </button>
              <button
                type="button"
                role="menuitem"
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-50"
                onClick={() => go(getRoutePath("myDocuments"))}
              >
                Moje dokumenty
              </button>

              {isPlainUserRole(userRole) ? (
                <button
                  type="button"
                  role="menuitem"
                  className="mt-1 block w-full rounded-lg bg-neutral-950 px-3 py-2.5 text-left text-sm font-medium text-white hover:bg-neutral-700"
                  onClick={() => go(getRoutePath("issuerRole"))}
                >
                  Chcę być issuerem
                </button>
              ) : null}

              {isIssuerToolRole(userRole) ? (
                <>
                  <hr className="my-2 border-hairline" />
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-50"
                    onClick={() => go(getRoutePath("upload"))}
                  >
                    Dodaj dokument
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-50"
                    onClick={() => go(getRoutePath("issuedDocuments"))}
                  >
                    Wystawione dokumenty
                  </button>
                  {isAdminReviewRole(userRole) ? (
                    <button
                      type="button"
                      role="menuitem"
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-50"
                      onClick={() => go(getRoutePath("notify"))}
                    >
                      Powiadomienia
                    </button>
                  ) : null}
                </>
              ) : null}

              <hr className="my-2 border-hairline" />
              <button
                type="button"
                role="menuitem"
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
              >
                Wyloguj
              </button>
            </div>
          ) : null}
        </div>
      </Container>

      {/* Mobile primary nav */}
      <nav aria-label="Nawigacja mobilna" className="border-t border-hairline md:hidden">
        <Container>
          <ul className="flex justify-around py-2">
            {primaryNav.map(item => (
              <li key={item.key}>
                <Link
                  to={item.path}
                  className="flex flex-col items-center gap-1 text-[11px] font-medium text-neutral-600"
                >
                  {navIcons[item.key]}
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </nav>
    </header>
  );
};

export default AppHeader;
