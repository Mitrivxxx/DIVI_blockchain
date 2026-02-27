
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
    if (!jwt) return;
    fetchPendingIssuerApplicationsWithJwt(jwt)
      .then(setPending)
      .catch(e => setError(e.message || "Błąd"))
      .finally(() => setLoading(false));
  }, [jwt]);

  const handleUpdateStatus = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      if (!jwt) throw new Error("Brak JWT");
      await updateIssuerApplicationStatusWithJwt(id, status, jwt);
      setPending(pending => pending.filter(item => item.id !== id));
    } catch (e: any) {
      setError('Blockchain error');
    }
  };

  return { pending, loading, error, handleUpdateStatus };
}
