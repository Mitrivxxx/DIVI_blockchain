import React, { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { AppCard } from "@/shared/ui";
import { getRoutePath } from "../navigation/routes";
import { fetchInstitutionApi, type InstitutionListItem } from "./api/institutionsApi";

/**
 * Legacy `/i/:memberId` — issuers are members (the company is the profile).
 * When ETH is known, redirect to `/u/:address` where Informacje shows Witryna / Branża / Siedziba.
 */
const InstitutionDetail: React.FC = () => {
  const { memberId: memberIdParam } = useParams<{ memberId: string }>();
  const memberId = Number(memberIdParam);
  const [institution, setInstitution] = useState<InstitutionListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isInteger(memberId) || memberId <= 0) {
      setError("Nieprawidłowy identyfikator instytucji.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchInstitutionApi(memberId);
        if (!cancelled) setInstitution(data);
      } catch (err) {
        if (!cancelled) {
          setInstitution(null);
          setError(err instanceof Error ? err.message : "Nie udało się załadować instytucji.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [memberId]);

  const eth = institution?.ethereumAddress?.trim() || "";
  if (!loading && !error && eth) {
    return <Navigate to={`/u/${encodeURIComponent(eth)}`} replace />;
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-neutral-500">
        <Link to={getRoutePath("institutions")} className="underline hover:text-neutral-800">
          Instytucje
        </Link>
      </p>

      {loading ? (
        <AppCard>
          <p className="text-sm text-neutral-500">Ładowanie…</p>
        </AppCard>
      ) : null}

      {error ? (
        <AppCard>
          <p className="text-sm font-medium text-red-600">{error}</p>
        </AppCard>
      ) : null}

      {!loading && !error && institution && !eth ? (
        <AppCard>
          <p className="text-sm text-neutral-600">
            Ten wystawca nie ma powiązanego adresu Ethereum — otwórz katalog Instytucje lub profil
            członka, gdy adres będzie dostępny.
          </p>
        </AppCard>
      ) : null}
    </div>
  );
};

export default InstitutionDetail;
