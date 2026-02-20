
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

  const handleUpdateStatus = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      const res = await fetch(`${API_URL}/api/issuer/${id}/status?status=${status}`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error(`Błąd zmiany statusu na ${status}`);
      setPending(pending => pending.filter(item => item.id !== id));
    } catch (e: any) {
      setError(e.message || `Błąd zmiany statusu na ${status}`);
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
              {pending.map((item) => (
                <li key={item.id}>
                  <b>{item.institutionName}</b> - {item.status}<br />
                  <span style={{ color: '#555' }}>Ethereum: {item.ethereumAddress}</span>
                  <button onClick={() => handleUpdateStatus(item.id, 'Approved')}>Akceptuj</button>
                  <button onClick={() => handleUpdateStatus(item.id, 'Rejected')}>Odrzuć</button>
                </li>
              ))}
          </ul>
        )
      )}
    </div>
  );
};

export default Notify;
