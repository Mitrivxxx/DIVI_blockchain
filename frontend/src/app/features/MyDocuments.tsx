import React, { useEffect, useState } from "react";
import { useWeb3Auth } from "../../service/web3/useWeb3Auth";
import { fetchOwnerCertificatesApi, fetchProfileApi } from "./profile/api/profileApi";
import type { OwnerCertificate } from "./profile/types";
import {
  documentStatusLabel,
  documentTypeLabel,
  shortHex,
} from "@/types/documents";
import "./MyDocuments.scss";

const MyDocuments: React.FC = () => {
  const { address } = useWeb3Auth();
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
  const [documents, setDocuments] = useState<OwnerCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const resolveAddress = async () => {
      try {
        const profile = await fetchProfileApi("");
        setOwnerAddress(profile?.ethereumAddress || address || null);
      } catch {
        setOwnerAddress(address || null);
      }
    };

    void resolveAddress();
  }, [address]);

  useEffect(() => {
    if (!ownerAddress) {
      setLoading(false);
      setDocuments([]);
      return;
    }

    const loadDocuments = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchOwnerCertificatesApi(ownerAddress);
        setDocuments(data);
      } catch {
        setError("Nie udało się pobrać dokumentów.");
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };

    void loadDocuments();
  }, [ownerAddress]);

  return (
    <section className="my-documents" aria-live="polite">
      <header className="my-documents__header">
        <h1 className="my-documents__title">Moje dokumenty</h1>
        {ownerAddress ? <p className="my-documents__address">{ownerAddress}</p> : null}
      </header>

      {loading ? <p>Ładowanie dokumentów...</p> : null}
      {!loading && error ? <p>{error}</p> : null}
      {!loading && !error && !ownerAddress ? <p>Brak powiązanego adresu portfela.</p> : null}
      {!loading && !error && ownerAddress && documents.length === 0 ? (
        <p>Brak dokumentów dla tego adresu.</p>
      ) : null}

      {!loading && !error && documents.length > 0 ? (
        <div className="my-documents__table-wrap">
          <table className="my-documents__table">
            <thead>
              <tr>
                <th scope="col">Hash</th>
                <th scope="col">Issuer</th>
                <th scope="col">Typ</th>
                <th scope="col">Status</th>
                <th scope="col">Issued at</th>
              </tr>
            </thead>
            <tbody>
              {documents.map(document => (
                <tr key={document.hash}>
                  <td className="my-documents__mono" title={document.hash}>
                    {shortHex(document.hash)}
                  </td>
                  <td className="my-documents__mono" title={document.issuer}>
                    {shortHex(document.issuer)}
                  </td>
                  <td>{documentTypeLabel(document.documentType)}</td>
                  <td>{documentStatusLabel(document.status)}</td>
                  <td>{new Date(document.issuedAt).toLocaleString("pl-PL")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
};

export default MyDocuments;
