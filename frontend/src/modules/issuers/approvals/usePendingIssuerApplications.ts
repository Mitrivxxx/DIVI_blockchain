
import { useEffect, useState } from "react";
import { fetchPendingIssuerApplicationsWithJwt, updateIssuerApplicationStatusWithJwt } from "../api";
import type { IssuerApplicationListDto } from "../types";
import { useWeb3Auth } from "@/modules/identity";


export function usePendingIssuerApplications() {
  const [pending, setPending] = useState<IssuerApplicationListDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { jwt } = useWeb3Auth();

  useEffect(() => {
    if (loading === false && pending.length === 0 && !error) {
      return;
    }

    setLoading(true);
    fetchPendingIssuerApplicationsWithJwt(jwt || "")
      .then(setPending)
      .catch(e => setError(e.message || "Błąd"))
      .finally(() => setLoading(false));
  }, [jwt]);

  const handleUpdateStatus = async (id: number, status: 'Approved' | 'Rejected') => {
    try {
      if (!jwt) throw new Error("Brak JWT");
      const parsedId = Number(id);
      if (!Number.isFinite(parsedId)) throw new Error("Nieprawidłowe ID wniosku");
      await updateIssuerApplicationStatusWithJwt(parsedId, status, jwt);
      setPending(pending => pending.filter(item => item.id !== parsedId));
    } catch (e: any) {
      setError(e?.message || 'Błąd aktualizacji statusu');
    }
  };

  return { pending, loading, error, handleUpdateStatus };
}
