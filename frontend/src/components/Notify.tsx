
import React, { useEffect, useState } from "react";
import { API_URL } from "../api";

type IssuerApplicationListDto = {
  institutionName: string;
  status: string;
};

const Notify: React.FC = () => {
  const [pending, setPending] = useState<IssuerApplicationListDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await fetch(`${API_URL}/api/IssuerApplication`);
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
                <b>{item.institutionName}</b> - {item.status}
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
};

export default Notify;
