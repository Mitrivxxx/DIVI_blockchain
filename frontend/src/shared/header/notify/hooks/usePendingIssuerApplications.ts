
import { useEffect, useState } from "react";
import { fetchPendingIssuerApplicationsWithJwt, updateIssuerApplicationStatusWithJwt } from "../api/notifyApi";
import type { IssuerApplicationListDto } from "../api/notifyApi";
import { useWeb3Auth } from "@/app/context/Web3AuthContext";


export function usePendingIssuerApplications() {
  const [pending, setPending] = useState<IssuerApplicationListDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { jwt } = useWeb3Auth();

  useEffect(() => {
    const token = jwt ?? localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchPendingIssuerApplicationsWithJwt(token)
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
