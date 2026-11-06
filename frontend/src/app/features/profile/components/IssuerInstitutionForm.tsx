import React, { useEffect, useState } from "react";
import {
  fetchIssuerInstitutionProfileApi,
  resolveAvatarSrc,
  updateIssuerInstitutionProfileApi,
} from "../api/profileApi";
import type { IssuerInstitutionProfile } from "../types";
import { AppCard, buttonDark, buttonLight } from "@/shared/ui";

const emptyForm = {
  institutionName: "",
  description: "",
  logoUrl: "",
  websiteUrl: "",
  country: "",
  taxId: "",
};

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-hairline bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-300";

type IssuerInstitutionFormProps = {
  /** When true, render only Witryna / Branża / Siedziba inside a parent Informacje card. */
  embedded?: boolean;
};

const IssuerInstitutionForm: React.FC<IssuerInstitutionFormProps> = ({ embedded = false }) => {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const profile = await fetchIssuerInstitutionProfileApi();
        if (cancelled) return;
        if (profile) {
          applyProfile(profile);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Nie udało się wczytać profilu instytucji.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyProfile = (profile: IssuerInstitutionProfile) => {
    setForm({
      institutionName: profile.institutionName ?? "",
      description: profile.description ?? "",
      logoUrl: profile.logoUrl ?? "",
      websiteUrl: profile.websiteUrl ?? "",
      country: profile.country ?? "",
      taxId: profile.taxId ?? "",
    });
  };

  const handleChange = (field: keyof typeof emptyForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      const updated = await updateIssuerInstitutionProfileApi({
        institutionName: form.institutionName,
        description: form.description,
        logoUrl: form.logoUrl,
        websiteUrl: form.websiteUrl,
        country: form.country,
        taxId: form.taxId,
      });
      applyProfile(updated);
      setMessage("Zapisano profil instytucji.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zapisać.");
    } finally {
      setSaving(false);
    }
  };

  const logoPreview = form.logoUrl.trim() ? resolveAvatarSrc(form.logoUrl.trim(), "") : "";
  const initial = (form.institutionName.trim()[0] ?? "I").toUpperCase();

  const fields = (
    <>
      {loading ? <p className="text-sm text-neutral-500">Ładowanie...</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

      {!loading ? (
        <form
          onSubmit={handleSubmit}
          className={embedded ? "space-y-4" : "space-y-5 border-t border-hairline pt-5"}
        >
          <div className={`grid gap-4 ${embedded ? "" : "sm:grid-cols-2"}`}>
            {!embedded ? (
              <>
                <label className="text-sm font-medium text-neutral-800 sm:col-span-2">
                  Nazwa instytucji
                  <input
                    value={form.institutionName}
                    onChange={e => handleChange("institutionName", e.target.value)}
                    required
                    className={fieldClass}
                  />
                </label>
                <label className="text-sm font-medium text-neutral-800 sm:col-span-2">
                  Logo URL
                  <input
                    value={form.logoUrl}
                    onChange={e => handleChange("logoUrl", e.target.value)}
                    placeholder="https://…"
                    className={fieldClass}
                  />
                </label>
                <label className="text-sm font-medium text-neutral-800 sm:col-span-2">
                  NIP / KRS
                  <input
                    value={form.taxId}
                    onChange={e => handleChange("taxId", e.target.value)}
                    className={fieldClass}
                  />
                </label>
              </>
            ) : null}

            <label className="text-sm font-medium text-neutral-800">
              Witryna
              <input
                value={form.websiteUrl}
                onChange={e => handleChange("websiteUrl", e.target.value)}
                placeholder="https://…"
                className={fieldClass}
              />
            </label>
            <label className="text-sm font-medium text-neutral-800">
              Branża
              <input
                value={form.description}
                onChange={e => handleChange("description", e.target.value)}
                placeholder="np. Usługi IT"
                className={fieldClass}
              />
            </label>
            <label className="text-sm font-medium text-neutral-800">
              Siedziba główna
              <input
                value={form.country}
                onChange={e => handleChange("country", e.target.value)}
                placeholder="Miasto, kraj"
                className={fieldClass}
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={saving} className={`${buttonDark} disabled:opacity-50`}>
              {saving ? "Zapisywanie..." : "Zapisz"}
            </button>
            <button
              type="button"
              className={buttonLight}
              disabled={saving || loading}
              onClick={() => {
                setMessage(null);
                setError(null);
                void fetchIssuerInstitutionProfileApi()
                  .then(profile => {
                    if (profile) applyProfile(profile);
                    else setForm(emptyForm);
                  })
                  .catch(err => {
                    setError(err instanceof Error ? err.message : "Nie udało się odświeżyć.");
                  });
              }}
            >
              Anuluj zmiany
            </button>
          </div>
        </form>
      ) : null}
    </>
  );

  if (embedded) {
    return (
      <div className="space-y-3 border-t border-hairline pt-5" aria-live="polite">
        <h3 className="text-sm font-semibold text-neutral-900">Instytucja</h3>
        {fields}
      </div>
    );
  }

  return (
    <AppCard className="space-y-6" aria-live="polite">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        {logoPreview ? (
          <img
            src={logoPreview}
            alt=""
            className="size-16 shrink-0 rounded-xl border border-hairline object-cover bg-neutral-100"
          />
        ) : (
          <span
            className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-neutral-950 text-sm font-semibold tracking-wide text-white"
            aria-hidden="true"
          >
            {initial}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xl font-semibold tracking-[-0.02em] text-neutral-900">
            {form.institutionName.trim() || "Profil instytucji"}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-neutral-500">
            Dane off-chain widoczne na publicznym profilu oraz przy dokumentach zamiast adresu
            hot-wallet.
          </p>
        </div>
      </div>
      {fields}
    </AppCard>
  );
};

export default IssuerInstitutionForm;
