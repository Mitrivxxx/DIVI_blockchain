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
          value={documentType}
          onChange={setDocumentType}
          label="Typ dokumentu:"
          required
          className={styles.formGroup}
          labelClassName={styles.label}
          inputClassName={styles.input}
        />
        <TextInput
          value={owner}
          onChange={setOwner}
          label="Właściciel dokumentu:"
          required
          className={styles.formGroup}
          labelClassName={styles.label}
          inputClassName={styles.input}
        />
        <button className={styles.button} type="submit">Wyślij dokument</button>
      </form>
      <Status status={status} className={styles.status} />
      <HashResult hashResult={hashResult} titleClassName={styles.resultTitle} />
    </div>
  );
};

export default Upload;