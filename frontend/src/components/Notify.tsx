
import React, { useEffect, useState } from "react";
import { API_URL } from "../api";

type IssuerApplicationListDto = {
  id: string;
  institutionName: string;
  ethereumAddress: string;
  status: string;
};

const Notify: React.FC = () => {
  const [pending, setPending] = useState<IssuerApplicationListDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await fetch(`${API_URL}/api/issuer`);
        if (!res.ok) throw new Error("Błąd pobierania danych");
        // Zakładamy, że backend zwraca id, jeśli nie, trzeba poprawić backend
        const data = await res.json();
        setPending(data);
      } catch (e: any) {
        setError(e.message || "Błąd");
      } finally {
        setLoading(false);
      }
    };
    fetchPending();
  }, []);

  const handleAccept = async (idx: number) => {
    const app = pending[idx];
    if (!app) return;
    try {
      const res = await fetch(`${API_URL}/api/IssuerApplication/${app.id}/status?status=Approved`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Błąd akceptacji');
      setPending(pending => pending.filter((_, i) => i !== idx));
    } catch (e: any) {
      setError(e.message || 'Błąd akceptacji');
    }
  };

  const handleReject = async (idx: number) => {
    const app = pending[idx];
    if (!app) return;
    try {
      const res = await fetch(`${API_URL}/api/IssuerApplication/${app.id}/status?status=Rejected`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Błąd odrzucenia');
      setPending(pending => pending.filter((_, i) => i !== idx));
    } catch (e: any) {
      setError(e.message || 'Błąd odrzucenia');
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Pending Issuer Applications</h2>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && (
        pending.length === 0 ? (
          <p>No pending applications.</p>
        ) : (
          <ul>
            {pending.map((item, idx) => (
              <li key={idx}>
                <b>{item.institutionName}</b> - {item.status}<br />
                <span style={{ color: '#555' }}>Ethereum: {item.ethereumAddress}</span>
                <button onClick={() => handleAccept(idx)}>Akceptuj</button>
                <button onClick={() => handleReject(idx)}>Odrzuć</button>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
};

export default Notify;
