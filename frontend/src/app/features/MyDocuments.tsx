import React, { useEffect, useState } from "react";
import { useWeb3Auth } from "../../service/web3/useWeb3Auth";
import { fetchOwnerCertificatesApi, fetchProfileApi } from "./profile/api/profileApi";
import type { OwnerCertificate } from "./profile/types";
import {
  documentStatusLabel,
  documentTypeLabel,
  formatDocumentPeriod,
  formatIssuerLabel,
  shortHex,
} from "@/types/documents";
import { AppCard } from "@/shared/ui";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.02em] text-neutral-900">Moje dokumenty</h1>
        {ownerAddress ? (
          <p className="mt-2 font-mono text-sm text-neutral-500">{ownerAddress}</p>
        ) : null}
      </div>

      <AppCard>
        {loading ? <p className="text-sm text-neutral-500">Ładowanie dokumentów...</p> : null}
        {!loading && error ? <p className="text-sm text-red-600">{error}</p> : null}
        {!loading && !error && !ownerAddress ? (
          <p className="text-sm text-neutral-500">Brak powiązanego adresu portfela.</p>
        ) : null}
        {!loading && !error && ownerAddress && documents.length === 0 ? (
          <p className="text-sm text-neutral-500">Brak dokumentów dla tego adresu.</p>
        ) : null}

        {!loading && !error && documents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="border-b border-hairline text-neutral-500">
                  <th className="py-2 pr-3 font-medium">Hash</th>
                  <th className="py-2 pr-3 font-medium">Issuer</th>
                  <th className="py-2 pr-3 font-medium">Typ</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 font-medium">Issued at</th>
                </tr>
              </thead>
              <tbody>
                {documents.map(document => (
                  <tr key={document.hash} className="border-b border-hairline last:border-0">
                    <td className="py-3 pr-3 font-mono text-xs" title={document.hash}>
                      {shortHex(document.hash)}
                    </td>
                    <td className="py-3 pr-3" title={document.issuer}>
                      {formatIssuerLabel(document.issuerDisplayName, document.issuer)}
                    </td>
                    <td className="py-3 pr-3">{documentTypeLabel(document.documentType)}</td>
                    <td className="py-3 pr-3">{documentStatusLabel(document.status)}</td>
                    <td className="py-3">
                      {formatDocumentPeriod(document.periodStart, document.expiresAt, document.issuedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </AppCard>
    </div>
  );
};

export default MyDocuments;
