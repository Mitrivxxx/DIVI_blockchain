import React from 'react';
import { useFile } from './hooks/useFile';
import { useStatus } from './hooks/useStatus';
import { useVerifyResult } from './hooks/useVerifyResult';
import styles from './Verify.module.scss';

import { verifyDocument } from '../uploadFile/api/api';
import FilePicker from '../../components/FilePicker';
import CopyField from '../../components/ui/CopyField';
import { documentStatusLabel } from '@/types/documents';

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
      return { color: 'var(--warning, #b45309)', text: 'Dokument unieważniony (Revoked)' };
    }
    if (verifyResult.isAuthentic) {
      return { color: 'var(--success, #10b981)', text: 'Potwierdzona autentyczność' };
    }
    return { color: 'var(--error, #ef4444)', text: 'Nie odnaleziono w rejestrze' };
  })();

  return (
    <div className={styles.wrap}>
      <div className={styles['top-badge']}>
        <div className={styles.dot}></div>
        Blockchain Verification
      </div>

      <h1>Zweryfikuj dokument</h1>

      <form onSubmit={handleSubmit}>
        <FilePicker
          file={file}
          setFile={setFile}
          label="Plik do weryfikacji"
          accept=".pdf"
        />

        <button className="btn" type="submit" disabled={!file}>
          Weryfikuj dokument
        </button>
      </form>

      {status && (
        <div className={`validation-box ${type === 'error' ? 'is-error' : type === 'success' ? 'is-success' : ''}`}>
          <div className="validation-box-icon">
            {type === 'error' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            ) : type === 'success' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            )}
          </div>
          <div className="validation-box-content">
            <span className="validation-box-title">
              {type === 'error' ? 'Wystąpił błąd' : type === 'success' ? 'Sukces' : 'Informacja'}
            </span>
            <span className="validation-box-message">{status}</span>
          </div>
        </div>
      )}

      {verifyResult && authenticityLabel && (
        <>
          <div className={styles.divider}></div>

          <div className={styles['result-title']}>Szczegóły weryfikacji</div>

          <CopyField label="HASH" value={verifyResult.hash} />

          <div className="field">
            <label>Status dokumentu</label>
            <div style={{ fontWeight: 600, marginTop: '0.5rem' }}>
              {documentStatusLabel(verifyResult.status ?? (verifyResult.isRevoked ? 2 : null))}
            </div>
          </div>

          <div className="field">
            <label>Status autentyczności</label>
            <div
              style={{
                fontWeight: 600,
                color: authenticityLabel.color,
                marginTop: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {authenticityLabel.text}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Verify;
