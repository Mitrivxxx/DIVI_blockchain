import React, { useEffect, useState } from "react";
import { buttonDark, buttonLight } from "@/shared/ui";
import type { ProfileExternalLinks } from "../types";

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-hairline bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-300";

type ExternalLinksBlockProps = {
  linkedInUrl?: string | null;
  githubUrl?: string | null;
  websiteUrl?: string | null;
  /** When true, show editor; otherwise read-only links. */
  editable?: boolean;
  saving?: boolean;
  onSave?: (links: ProfileExternalLinks) => Promise<void>;
};

const ExternalLinksBlock: React.FC<ExternalLinksBlockProps> = ({
  linkedInUrl,
  githubUrl,
  websiteUrl,
  editable = false,
  saving = false,
  onSave,
}) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProfileExternalLinks>({
    linkedInUrl: linkedInUrl ?? "",
    githubUrl: githubUrl ?? "",
    websiteUrl: websiteUrl ?? "",
  });

  useEffect(() => {
    if (!editing) {
      setForm({
        linkedInUrl: linkedInUrl ?? "",
        githubUrl: githubUrl ?? "",
        websiteUrl: websiteUrl ?? "",
      });
    }
  }, [linkedInUrl, githubUrl, websiteUrl, editing]);

  const links = [
    { label: "LinkedIn", href: linkedInUrl },
    { label: "GitHub", href: githubUrl },
    { label: "Strona", href: websiteUrl },
  ].filter(item => Boolean(item.href?.trim()));

  if (!editable && links.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-hairline pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-neutral-900">Linki zewnętrzne</p>
        {editable && !editing ? (
          <button type="button" className="text-sm font-medium underline" onClick={() => setEditing(true)}>
            {links.length > 0 ? "Edytuj" : "Dodaj"}
          </button>
        ) : null}
      </div>
      <p className="mt-1 text-xs text-neutral-500">
        LinkedIn, GitHub i strona WWW — „żywy” profil poza Web3.
      </p>

      {editable && editing ? (
        <form
          className="mt-3 grid gap-3 sm:grid-cols-1"
          onSubmit={event => {
            event.preventDefault();
            void (async () => {
              await onSave?.(form);
              setEditing(false);
            })();
          }}
        >
          <label className="text-sm font-medium text-neutral-800">
            LinkedIn
            <input
              value={form.linkedInUrl}
              onChange={e => setForm(prev => ({ ...prev, linkedInUrl: e.target.value }))}
              placeholder="https://linkedin.com/in/…"
              className={fieldClass}
            />
          </label>
          <label className="text-sm font-medium text-neutral-800">
            GitHub
            <input
              value={form.githubUrl}
              onChange={e => setForm(prev => ({ ...prev, githubUrl: e.target.value }))}
              placeholder="https://github.com/…"
              className={fieldClass}
            />
          </label>
          <label className="text-sm font-medium text-neutral-800">
            Strona
            <input
              value={form.websiteUrl}
              onChange={e => setForm(prev => ({ ...prev, websiteUrl: e.target.value }))}
              placeholder="https://…"
              className={fieldClass}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={`${buttonDark} disabled:opacity-50`} disabled={saving}>
              {saving ? "Zapisywanie…" : "Zapisz"}
            </button>
            <button
              type="button"
              className={buttonLight}
              disabled={saving}
              onClick={() => {
                setForm({
                  linkedInUrl: linkedInUrl ?? "",
                  githubUrl: githubUrl ?? "",
                  websiteUrl: websiteUrl ?? "",
                });
                setEditing(false);
              }}
            >
              Anuluj
            </button>
          </div>
        </form>
      ) : links.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {links.map(item => (
            <li key={item.label}>
              <a
                href={item.href!}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-neutral-800 underline hover:text-neutral-950"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      ) : editable ? (
        <p className="mt-2 text-sm text-neutral-500">Brak linków zewnętrznych.</p>
      ) : null}
    </div>
  );
};

export default ExternalLinksBlock;
