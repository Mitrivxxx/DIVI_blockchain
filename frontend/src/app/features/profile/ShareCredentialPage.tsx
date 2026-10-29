import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchSharedCredentialApi } from "./api/profileApi";
import type { PublicCredential } from "./types";
import {
  documentStatusLabel,
  documentTypeLabel,
  formatDocumentPeriod,
  formatIssuerLabel,
  shortHex,
} from "@/types/documents";

const ShareCredentialPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [item, setItem] = useState<PublicCredential | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Brak tokenu.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchSharedCredentialApi(token);
        if (!cancelled) setItem(data);
      } catch (err) {
        if (!cancelled) {
          setItem(null);
          setError(err instanceof Error ? err.message : "Nie znaleziono.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <main style={{ padding: "2rem", maxWidth: 720, margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <h1>Shared credential</h1>
      {loading ? <p>Loading…</p> : null}
      {error ? <p>{error}</p> : null}
      {!loading && !error && item ? (
        <dl>
          <dt>Hash</dt>
          <dd title={item.hash}>{shortHex(item.hash)}</dd>
          <dt>Type</dt>
          <dd>{documentTypeLabel(item.documentType)}</dd>
          {item.title?.trim() ? (
            <>
              <dt>Title / field</dt>
              <dd>{item.title.trim()}</dd>
            </>
          ) : null}
          <dt>Status</dt>
          <dd>{documentStatusLabel(item.status)}</dd>
          <dt>Issuer</dt>
          <dd title={item.issuerAddress}>
            {formatIssuerLabel(item.issuerDisplayName, item.issuerAddress)}
          </dd>
          <dt>Owner</dt>
          <dd title={item.ownerAddress}>{shortHex(item.ownerAddress)}</dd>
          <dt>Period / issued</dt>
          <dd>{formatDocumentPeriod(item.periodStart, item.expiresAt, item.issuedAt)}</dd>
          <dt>Visibility</dt>
          <dd>{item.visibility}</dd>
        </dl>
      ) : null}
      <p>
        <Link to="/public#verify">Verify document</Link>
      </p>
    </main>
  );
};

export default ShareCredentialPage;
