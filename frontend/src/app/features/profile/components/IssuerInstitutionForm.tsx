import React, { useEffect, useState } from "react";
import {
  fetchIssuerInstitutionProfileApi,
  updateIssuerInstitutionProfileApi,
} from "../api/profileApi";
import type { IssuerInstitutionProfile } from "../types";
import { AppCard, buttonDark } from "@/shared/ui";

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

const IssuerInstitutionForm: React.FC = () => {
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

  return (
    <AppCard className="space-y-4" aria-live="polite">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900">Profil instytucji</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Dane off-chain pokazywane zamiast adresu hot-wallet przy dokumentach.
        </p>
      </div>

      {loading ? <p className="text-sm text-neutral-500">Ładowanie...</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

      {!loading ? (
        <form onSubmit={handleSubmit} className="grid max-w-lg gap-4">
          <label className="text-sm font-medium text-neutral-800">
            Nazwa instytucji
            <input
              value={form.institutionName}
              onChange={e => handleChange("institutionName", e.target.value)}
              required
              className={fieldClass}
            />
          </label>
          <label className="text-sm font-medium text-neutral-800">
            Opis
            <textarea
              value={form.description}
              onChange={e => handleChange("description", e.target.value)}
              rows={3}
              className={fieldClass}
            />
          </label>
          <label className="text-sm font-medium text-neutral-800">
            Logo URL
            <input
              value={form.logoUrl}
              onChange={e => handleChange("logoUrl", e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="text-sm font-medium text-neutral-800">
            Strona WWW
            <input
              value={form.websiteUrl}
              onChange={e => handleChange("websiteUrl", e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="text-sm font-medium text-neutral-800">
            Kraj
            <input
              value={form.country}
              onChange={e => handleChange("country", e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="text-sm font-medium text-neutral-800">
            NIP / KRS
            <input
              value={form.taxId}
              onChange={e => handleChange("taxId", e.target.value)}
              className={fieldClass}
            />
          </label>
          <button type="submit" disabled={saving} className={`${buttonDark} disabled:opacity-50`}>
            {saving ? "Zapisywanie..." : "Zapisz profil instytucji"}
          </button>
        </form>
      ) : null}
    </AppCard>
  );
};

export default IssuerInstitutionForm;
