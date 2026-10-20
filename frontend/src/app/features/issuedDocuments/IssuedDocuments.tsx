import React, { useCallback, useEffect, useState } from 'react';
import { fetchIssuedByMe, revokeDocument } from '../documents/api/documentsApi';
import type { DocumentListItem } from '@/types/documents';
import {
  DOCUMENT_STATUS,
  documentStatusLabel,
  documentTypeLabel,
  shortHex,
} from '@/types/documents';
import '../MyDocuments.scss';

const IssuedDocuments: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingHash, setRevokingHash] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchIssuedByMe();
      setDocuments(data);
    } catch {
      setError('Nie udało się pobrać wystawionych dokumentów.');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRevoke = async (hash: string) => {
    const confirmed = window.confirm(
      'Czy na pewno chcesz unieważnić ten dokument? Operacja zapisze status Revoked w blockchainie.',
    );
    if (!confirmed) return;

    setRevokingHash(hash);
    setActionMessage(null);
    try {
      await revokeDocument(hash);
      setActionMessage('Dokument został unieważniony.');
      await load();
    } catch (err: unknown) {
      const apiMessage =
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { data?: unknown } }).response?.data === 'string'
          ? ((err as { response: { data: string } }).response.data)
          : 'Nie udało się unieważnić dokumentu.';
      setActionMessage(apiMessage);
    } finally {
      setRevokingHash(null);
    }
  };

  return (
    <section className="my-documents" aria-live="polite">
      <header className="my-documents__header">
        <h1 className="my-documents__title">Wystawione dokumenty</h1>
        <p className="my-documents__address">
          Lista dokumentów wystawionych przez Twoje konto (IssuedByMember). Możesz je unieważnić.
        </p>
      </header>

      {loading ? <p>Ładowanie...</p> : null}
      {!loading && error ? <p>{error}</p> : null}
      {actionMessage ? <p>{actionMessage}</p> : null}
      {!loading && !error && documents.length === 0 ? <p>Brak wystawionych dokumentów.</p> : null}

      {!loading && !error && documents.length > 0 ? (
        <div className="my-documents__table-wrap">
          <table className="my-documents__table">
            <thead>
              <tr>
                <th scope="col">Hash</th>
                <th scope="col">Właściciel</th>
                <th scope="col">Typ</th>
                <th scope="col">Status</th>
                <th scope="col">Data</th>
                <th scope="col">Akcja</th>
              </tr>
            </thead>
            <tbody>
              {documents.map(document => {
                const revoked = document.status === DOCUMENT_STATUS.Revoked;
                return (
                  <tr key={document.hash}>
                    <td className="my-documents__mono" title={document.hash}>
                      {shortHex(document.hash)}
                    </td>
                    <td className="my-documents__mono" title={document.ownerAddress ?? undefined}>
                      {shortHex(document.ownerAddress)}
                    </td>
                    <td>{documentTypeLabel(document.documentType)}</td>
                    <td>{documentStatusLabel(document.status)}</td>
                    <td>{new Date(document.issuedAt).toLocaleString('pl-PL')}</td>
                    <td>
                      {revoked ? (
                        <span>—</span>
                      ) : (
                        <button
                          type="button"
                          className="btn"
                          disabled={revokingHash === document.hash}
                          onClick={() => void handleRevoke(document.hash)}
                        >
                          {revokingHash === document.hash ? 'Unieważnianie…' : 'Unieważnij'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
};

export default IssuedDocuments;
