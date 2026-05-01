import React from 'react';
import { useFile } from './hooks/useFile';
import { useStatus } from './hooks/useStatus';
import { useVerifyResult } from './hooks/useVerifyResult';
import styles from './Verify.module.scss';

import { verifyDocument } from '../uploadFile/api/api';
import FilePicker from '../../components/FilePicker';
import CopyField from '../../components/ui/CopyField';

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

      if (data.isAuthentic) {
        setType('success');
        setStatus(data.message || 'Dokument jest autentyczny');
      } else {
        setType('error');
        setStatus(data.message || 'Dokument nie został odnaleziony w sieci');
      }

      setVerifyResult({
        hash: data.hash,
        isAuthentic: data.isAuthentic
      });

    } catch (err: any) {
      console.error(err);
      setType('error');
      setStatus(err.message || 'Błąd podczas weryfikacji');
    }
  };

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

      {verifyResult && (
        <>
          <div className={styles.divider}></div>

          <div className={styles['result-title']}>Szczegóły weryfikacji</div>

          <CopyField label="HASH" value={verifyResult.hash} />
          
          <div className="field">
             <label>Status autentyczności</label>
             <div style={{ 
               fontWeight: 600, 
               color: verifyResult.isAuthentic ? 'var(--success, #10b981)' : 'var(--error, #ef4444)',
               marginTop: '0.5rem',
               display: 'flex',
               alignItems: 'center',
               gap: '8px'
             }}>
                {verifyResult.isAuthentic ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Potwierdzona autentyczność
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    Nie odnaleziono w rejestrze
                  </>
                )}
             </div>
          </div>
        </>
      )}

    </div>
  );
};

export default Verify;
