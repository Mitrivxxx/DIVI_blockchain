import React from 'react';
import { useFile } from './hooks/useFile';
import { useDocumentType } from './hooks/useDocumentType';
import { useOwner } from './hooks/useOwner';
import { useStatus } from './hooks/useStatus';
import { useHashResult } from './hooks/useHashResult';
import styles from './Upload.module.scss';

import { uploadDocument } from './api/api';
import FilePicker from '../../components/FilePicker';
import CopyField from '../../components/ui/CopyField';

const documentTypeOptions = [
  { value: 'Education', label: 'Education' },
  { value: 'Professional certificates', label: 'Professional Certificates' },
  { value: 'Employment documents', label: 'Employment Documents' },
  { value: 'License', label: 'License' },
  { value: 'Other documents', label: 'Other Documents' },
] as const;

const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;

const Upload = () => {
  const { file, setFile } = useFile();
  const { documentType, setDocumentType } = useDocumentType();
  const { owner, setOwner } = useOwner();
  const { status, setStatus, type, setType } = useStatus();
  const { hashResult, setHashResult } = useHashResult();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setType('error');
      return setStatus('Wybierz plik');
    }
    if (!documentType) {
      setType('error');
      return setStatus('Podaj typ dokumentu');
    }
    if (!owner) {
      setType('error');
      return setStatus('Podaj właściciela');
    }

    if (!ethereumAddressRegex.test(owner.trim())) {
      setType('error');
      return setStatus('Niepoprawny adres ETH');
    }

    try {
      setType('info');
      setStatus('Wysyłanie...');

      const { hash, cid, message } = await uploadDocument(file, documentType, owner);

      setHashResult({ hash, cid });

      if (!cid) {
        setType('error');
        return setStatus(message || 'Dokument już istnieje');
      }

      setType('success');
      setStatus(message || 'Zapisano poprawnie');
    } catch (err: any) {
      console.error(err);
      setType('error');
      setStatus(err.message || 'Błąd krytyczny');
    }
  };

  return (
    <div className={styles.wrap}>
      
      <div className={styles['top-badge']}>
        <div className={styles.dot}></div>
        Blockchain Upload
      </div>

      <h1>Dodaj dokument</h1>

      <form onSubmit={handleSubmit}>
        
        <FilePicker 
          file={file} 
          setFile={setFile} 
          label="Plik dokumentu" 
          accept=".pdf"
        />

        <div className="field">
          <label>Adres ETH</label>
          <input
            type="text"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="0x..."
          />
        </div>

        <div className="field">
          <label>Typ dokumentu</label>

          <div className="select-wrap">
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
            >
              <option value="">Wybierz</option>
              {documentTypeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button className="btn" type="submit">
          Wyślij dokument
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

      {hashResult && (
        <>
          <div className={styles.divider}></div>

          <div className={styles['result-title']}>Wynik</div>

          <CopyField label="HASH" value={hashResult.hash} />
          <CopyField label="CID" value={hashResult.cid} />
        </>
      )}

    </div>
  );
};

export default Upload;