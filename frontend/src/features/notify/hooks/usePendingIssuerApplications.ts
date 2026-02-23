import { useEffect, useState } from "react";
import { fetchPendingIssuerApplications, updateIssuerApplicationStatus } from "../api/notifyApi";
import type { IssuerApplicationListDto } from "../api/notifyApi";

export function usePendingIssuerApplications() {
  const [pending, setPending] = useState<IssuerApplicationListDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingIssuerApplications()
      .then(setPending)
      .catch(e => setError(e.message || "Błąd"))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdateStatus = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      await updateIssuerApplicationStatus(id, status);
      setPending(pending => pending.filter(item => item.id !== id));
    } catch (e: any) {
      setError('Blockchain error');
    }
  };

  return { pending, loading, error, handleUpdateStatus };
}
