import React, { useCallback, useEffect, useState } from 'react';
import { fetchIssuedByMe, revokeDocument } from '../documents/api/documentsApi';
import { openDocumentPdfInNewTab } from '../profile/api/profileApi';
import type { DocumentListItem } from '@/types/documents';
import {
  DOCUMENT_STATUS,
  documentStatusLabel,
  documentTypeLabel,
  formatDocumentPeriod,
  hasDocumentPdfFile,
  shortHex,
} from '@/types/documents';
import { AppCard, buttonDark } from '@/shared/ui';

const IssuedDocuments: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingHash, setRevokingHash] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [openingPdfHash, setOpeningPdfHash] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

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

  const handleOpenPdf = async (hash: string) => {
    try {
      setPdfError(null);
      setOpeningPdfHash(hash);
      await openDocumentPdfInNewTab(hash);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : 'Nie udało się otworzyć PDF.');
    } finally {
      setOpeningPdfHash(null);
    }
  };

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.02em] text-neutral-900">
          Wystawione dokumenty
        </h1>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-neutral-500">
          Dokumenty IssuedByMember — możesz je unieważnić on-chain.
        </p>
      </div>

      <AppCard>
        {loading ? <p className="text-sm text-neutral-500">Ładowanie...</p> : null}
        {!loading && error ? <p className="text-sm text-red-600">{error}</p> : null}
        {actionMessage ? <p className="mb-4 text-sm text-neutral-700">{actionMessage}</p> : null}
        {pdfError ? <p className="mb-4 text-sm text-red-600">{pdfError}</p> : null}
        {!loading && !error && documents.length === 0 ? (
          <p className="text-sm text-neutral-500">Brak wystawionych dokumentów.</p>
        ) : null}

        {!loading && !error && documents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead>
                <tr className="border-b border-hairline text-neutral-500">
                  <th className="py-2 pr-3 font-medium">Hash</th>
                  <th className="py-2 pr-3 font-medium">Właściciel</th>
                  <th className="py-2 pr-3 font-medium">Typ</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 font-medium">Data</th>
                  <th className="py-2 pr-3 font-medium">PDF</th>
                  <th className="py-2 font-medium">Akcja</th>
                </tr>
              </thead>
              <tbody>
                {documents.map(document => {
                  const revoked = document.status === DOCUMENT_STATUS.Revoked;
                  return (
                    <tr key={document.hash} className="border-b border-hairline last:border-0">
                      <td className="py-3 pr-3 font-mono text-xs" title={document.hash}>
                        {shortHex(document.hash)}
                      </td>
                      <td className="py-3 pr-3 font-mono text-xs" title={document.ownerAddress ?? undefined}>
                        {shortHex(document.ownerAddress)}
                      </td>
                      <td className="py-3 pr-3">
                        {document.title?.trim()
                          ? `${documentTypeLabel(document.documentType)} · ${document.title.trim()}`
                          : documentTypeLabel(document.documentType)}
                      </td>
                      <td className="py-3 pr-3">{documentStatusLabel(document.status)}</td>
                      <td className="py-3 pr-3">
                        {formatDocumentPeriod(document.periodStart, document.expiresAt, document.issuedAt)}
                      </td>
                      <td className="py-3 pr-3">
                        {hasDocumentPdfFile(document.cid) ? (
                          <button
                            type="button"
                            className="underline disabled:opacity-50"
                            disabled={openingPdfHash === document.hash}
                            onClick={() => void handleOpenPdf(document.hash)}
                          >
                            {openingPdfHash === document.hash ? 'Otwieranie…' : 'Pokaż dokument'}
                          </button>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3">
                        {revoked ? (
                          <span className="text-neutral-400">—</span>
                        ) : (
                          <button
                            type="button"
                            className={`${buttonDark} !px-3 !py-2 text-xs`}
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
      </AppCard>
    </div>
  );
};

export default IssuedDocuments;
