import React from 'react';
import { useFile } from './hooks/useFile';
import { useStatus } from './hooks/useStatus';
import { useVerifyResult } from './hooks/useVerifyResult';

import { verifyDocument } from '../uploadFile/api/api';
import FilePicker from '../../components/FilePicker';
import CopyField from '../../components/ui/CopyField';
import { documentStatusLabel, formatIssuerLabel, shortHex } from '@/types/documents';
import { AppCard, buttonDark } from '@/shared/ui';

const Verify = () => {
  const { file, setFile } = useFile();
  const { status, setStatus, type, setType } = useStatus();
  const { verifyResult, setVerifyResult } = useVerifyResult();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setType('error');
      return setStatus('Wybierz plik');
    }

    try {
      setType('info');
      setStatus('Weryfikowanie...');
      setVerifyResult(null);

      const data = await verifyDocument(file);

      if (data.isRevoked || data.status === 2) {
        setType('error');
        setStatus(data.message || 'Dokument został unieważniony');
      } else if (data.isAuthentic) {
        setType('success');
        setStatus(data.message || 'Dokument jest autentyczny');
      } else {
        setType('error');
        setStatus(data.message || 'Dokument nie został odnaleziony w sieci');
      }

      setVerifyResult({
        hash: data.hash,
        isAuthentic: data.isAuthentic,
        isRevoked: Boolean(data.isRevoked || data.status === 2),
        status: data.status,
        message: data.message,
        issuerAddress: data.issuerAddress,
        issuerDisplayName: data.issuerDisplayName,
      });
    } catch (err: unknown) {
      console.error(err);
      const message =
        typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Błąd podczas weryfikacji';
      setType('error');
      setStatus(message);
    }
  };

  const authenticityLabel = (() => {
    if (!verifyResult) return null;
    if (verifyResult.isRevoked) {
      return 'Dokument unieważniony (Revoked)';
    }
    if (verifyResult.isAuthentic) {
      return 'Potwierdzona autentyczność';
    }
    return 'Nie odnaleziono w rejestrze';
  })();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="text-sm font-medium text-neutral-500">Blockchain Verification</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-[-0.02em] text-neutral-900">
          Zweryfikuj dokument
        </h1>
      </div>

      <AppCard>
        <form onSubmit={handleSubmit} className="space-y-5">
          <FilePicker
            file={file}
            setFile={setFile}
            label="Plik do weryfikacji"
            accept=".pdf"
          />

          <button type="submit" disabled={!file} className={`${buttonDark} disabled:opacity-50`}>
            Weryfikuj dokument
          </button>
        </form>

        {status ? (
          <p
            className={`mt-5 text-sm font-medium ${
              type === 'error' ? 'text-red-600' : type === 'success' ? 'text-emerald-600' : 'text-neutral-600'
            }`}
          >
            [{type === 'error' ? 'Błąd' : type === 'success' ? 'Sukces' : 'Info'}] {status}
          </p>
        ) : null}

        {verifyResult && authenticityLabel ? (
          <div className="mt-6 space-y-3 border-t border-hairline pt-5">
            <h2 className="text-lg font-semibold text-neutral-900">Szczegóły weryfikacji</h2>
            <CopyField label="HASH" value={verifyResult.hash} />
            <p className="text-sm text-neutral-700">
              Status dokumentu:{' '}
              <strong>
                {documentStatusLabel(verifyResult.status ?? (verifyResult.isRevoked ? 2 : null))}
              </strong>
            </p>
            <p className="text-sm text-neutral-700">
              Status autentyczności: <strong>{authenticityLabel}</strong>
            </p>
            {(verifyResult.issuerDisplayName || verifyResult.issuerAddress) ? (
              <p className="text-sm text-neutral-700" title={verifyResult.issuerAddress ?? undefined}>
                Wystawca:{' '}
                <strong>
                  {formatIssuerLabel(verifyResult.issuerDisplayName, verifyResult.issuerAddress)}
                </strong>
                {verifyResult.issuerDisplayName && verifyResult.issuerAddress
                  ? ` (${shortHex(verifyResult.issuerAddress)})`
                  : null}
              </p>
            ) : null}
          </div>
        ) : null}
      </AppCard>
    </div>
  );
};

export default Verify;
