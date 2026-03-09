import React from 'react';
import { useFile } from './hooks/useFile';
import { useDocumentType } from './hooks/useDocumentType';
import { useOwner } from './hooks/useOwner';
import { useStatus } from './hooks/useStatus';
import { useHashResult } from './hooks/useHashResult';
import styles from './Upload.module.scss';
import { FileInput } from './components/FileInput';
import { TextInput } from './components/TextInput';
import { Status } from './components/Status';
import { HashResult } from './components/HashResult';
import { uploadDocument } from './api/api';

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
  const { status, setStatus } = useStatus();
  const { hashResult, setHashResult } = useHashResult();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setStatus('Wybierz plik przed wysłaniem');
      return;
    }
    if (!documentType) {
      setStatus('Podaj typ dokumentu');
      return;
    }
    if (!owner) {
      setStatus('Podaj właściciela dokumentu');
      return;
    }
    if (!ethereumAddressRegex.test(owner.trim())) {
      setStatus('Podaj poprawny adres Ethereum właściciela (format 0x...).');
      return;
    }

    try {
      setStatus('Wysyłanie pliku na backend (Pinata + blockchain)...');
      // Wysyłamy plik na backend, backend obsługuje Pinata i blockchain
      const { hash, cid, message } = await uploadDocument(file, documentType, owner);
      setHashResult({ hash, cid });

      if (!cid) {
        setStatus(message || 'Taki dokument już istnieje w blockchain, nie możesz go wrzucić jeszcze raz.');
        return;
      }

      setStatus(message || 'Dokument został zapisany w Pinata i blockchain.');
    } catch (err: any) {
      console.error(err);
      setStatus(err.message || 'Błąd podczas wysyłania dokumentu');
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Dodaj dokument z blockchain</h1>
      <form onSubmit={handleSubmit}>
        <FileInput
          value={file}
          onChange={setFile}
          label="Wybierz plik PDF:"
          className={styles.formGroup}
          labelClassName={styles.label}
          inputClassName={styles.input}
        />
        <TextInput
          value={owner}
          onChange={setOwner}
          label="Adres właściciela dokumentu (Ethereum):"
          required
          className={styles.formGroup}
          labelClassName={styles.label}
          inputClassName={styles.input}
        />
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="documentType">Typ dokumentu:</label>
          <select
            id="documentType"
            className={styles.input}
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            required
          >
            <option value="" disabled>
              Wybierz typ dokumentu
            </option>
            {documentTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <button className={styles.button} type="submit">Wyślij dokument</button>
      </form>
      <Status status={status} className={styles.status} />
      <HashResult hashResult={hashResult} titleClassName={styles.resultTitle} />
    </div>
  );
};

export default Upload;