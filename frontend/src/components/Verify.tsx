import React from 'react';
import { useState } from 'react';
import styles from '../features/uploadFile/Upload.module.scss';
import { verifyDocument } from '../features/uploadFile/api/api';

const Verify: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<{ hash: string; isAuthentic: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setStatus('Wybierz plik PDF do weryfikacji');
      return;
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setStatus('Dozwolone są tylko pliki PDF');
      return;
    }

    try {
      setStatus('Weryfikuję dokument w blockchain...');
      const response = await verifyDocument(file);
      setResult(response);
      setStatus(response.message);
    } catch (error: any) {
      console.error(error);
      setResult(null);
      setStatus(error?.response?.data || error?.message || 'Błąd podczas weryfikacji dokumentu');
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Weryfikacja dokumentu</h1>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="verify-file">Wybierz plik PDF:</label>
          <input
            id="verify-file"
            type="file"
            accept="application/pdf,.pdf"
            className={styles.input}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <button className={styles.button} type="submit">Sprawdź autentyczność</button>
      </form>

      {status && <p className={styles.status}>{status}</p>}

      {result && (
        <div>
          <h2 className={styles.resultTitle}>Wynik weryfikacji</h2>
          <p><strong>Hash:</strong> {result.hash}</p>
          <p><strong>Status:</strong> {result.isAuthentic ? 'Autentyczny' : 'Nieautentyczny'}</p>
        </div>
      )}
    </div>
  );
};

export default Verify;
