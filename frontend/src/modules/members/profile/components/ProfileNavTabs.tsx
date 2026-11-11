import type { ReactNode } from "react";

export type ProfileNavTab = {
  id: string;
  label: ReactNode;
};

type ProfileNavTabsProps = {
  tabs: ProfileNavTab[];
  activeId: string;
  onChange: (id: string) => void;
  "aria-label"?: string;
};

/** LinkedIn-style underline tabs for the bottom of ProfileHeroPanel. */
const ProfileNavTabs = ({
  tabs,
  activeId,
  onChange,
  "aria-label": ariaLabel = "Sekcje profilu",
}: ProfileNavTabsProps) => (
  <nav className="border-t border-hairline" aria-label={ariaLabel}>
    <ul className="flex gap-0 overflow-x-auto px-2 sm:px-4" role="tablist">
      {tabs.map(tab => {
        const active = tab.id === activeId;
        return (
          <li key={tab.id} role="presentation" className="shrink-0">
            <button
              type="button"
              role="tab"
              id={`profile-tab-${tab.id}`}
              aria-selected={active}
              aria-controls={`profile-panel-${tab.id}`}
              tabIndex={active ? 0 : -1}
              className={`relative px-3 py-3.5 text-sm font-medium transition sm:px-4 ${
                active
                  ? "text-neutral-900 after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:rounded-full after:bg-brand sm:after:inset-x-4"
                  : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
              }`}
              onClick={() => onChange(tab.id)}
            >
              {tab.label}
            </button>
          </li>
        );
      })}
    </ul>
  </nav>
);

export default ProfileNavTabs;
