import React, { useState } from 'react';
import { useFile } from './hooks/useFile';
import { useDocumentType } from './hooks/useDocumentType';
import { useOwner } from './hooks/useOwner';
import { useStatus } from './hooks/useStatus';
import { useHashResult } from './hooks/useHashResult';

import { uploadDocument } from './api/api';
import FilePicker from '../../components/FilePicker';
import CopyField from '../../components/ui/CopyField';
import { AppCard, buttonDark } from '@/shared/ui';
import {
  DOCUMENT_TYPE_SECTIONS,
  isEducationDocumentType,
  isMetadataDocumentType,
} from '@/types/documents';

const documentTypeOptions = DOCUMENT_TYPE_SECTIONS.map(section => ({
  value: section.apiValue,
  label: section.label,
}));

const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;

const fieldClass =
  'mt-1.5 w-full rounded-lg border border-hairline bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-300';

const Upload = () => {
  const { file, setFile } = useFile();
  const { documentType, setDocumentType } = useDocumentType();
  const { owner, setOwner } = useOwner();
  const { status, setStatus, type, setType } = useStatus();
  const { hashResult, setHashResult } = useHashResult();
  const [periodFrom, setPeriodFrom] = useState('');
  const [periodTo, setPeriodTo] = useState('');
  const [title, setTitle] = useState('');

  const metadataMode = isMetadataDocumentType(documentType);
  const educationMode = isEducationDocumentType(documentType);

  const handleDocumentTypeChange = (value: string) => {
    setDocumentType(value);
    if (isMetadataDocumentType(value)) {
      setFile(null);
      if (!isEducationDocumentType(value)) {
        setTitle('');
      }
    } else {
      setPeriodFrom('');
      setPeriodTo('');
      setTitle('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    if (metadataMode) {
      if (educationMode && !title.trim()) {
        setType('error');
        return setStatus('Podaj tytuł/kierunek studiów');
      }
      if (!periodFrom || !periodTo) {
        setType('error');
        return setStatus('Podaj datę od i datę do');
      }
      if (periodFrom > periodTo) {
        setType('error');
        return setStatus('Data od nie może być późniejsza niż data do');
      }
    } else if (!file) {
      setType('error');
      return setStatus('Wybierz plik');
    }

    try {
      setType('info');
      setStatus('Wysyłanie...');

      const { hash, cid, message } = await uploadDocument({
        documentType,
        owner,
        file: metadataMode ? null : file,
        periodFrom: metadataMode ? periodFrom : undefined,
        periodTo: metadataMode ? periodTo : undefined,
        title: educationMode ? title.trim() : undefined,
      });

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
      const apiMessage = err?.response?.data?.message || err?.response?.data;
      setStatus(
        typeof apiMessage === 'string'
          ? apiMessage
          : err.message || 'Błąd krytyczny',
      );
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="text-sm font-medium text-neutral-500">Blockchain Upload</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-[-0.02em] text-neutral-900">
          Dodaj dokument
        </h1>
      </div>

      <AppCard>
        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block text-sm font-medium text-neutral-800">
            Typ dokumentu
            <select
              value={documentType}
              onChange={e => handleDocumentTypeChange(e.target.value)}
              className={fieldClass}
            >
              <option value="">Wybierz</option>
              {documentTypeOptions.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-neutral-800">
            Adres ETH właściciela
            <input
              type="text"
              value={owner}
              onChange={e => setOwner(e.target.value)}
              placeholder="0x..."
              className={fieldClass}
            />
          </label>

          {metadataMode ? (
            <div className="space-y-4">
              {educationMode ? (
                <label className="block text-sm font-medium text-neutral-800">
                  Tytuł / kierunek studiów
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="np. Licencjat, Informatyka"
                    maxLength={256}
                    className={fieldClass}
                  />
                </label>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-neutral-800">
                  Data od
                  <input
                    type="date"
                    value={periodFrom}
                    onChange={e => setPeriodFrom(e.target.value)}
                    className={fieldClass}
                  />
                </label>
                <label className="block text-sm font-medium text-neutral-800">
                  Data do
                  <input
                    type="date"
                    value={periodTo}
                    onChange={e => setPeriodTo(e.target.value)}
                    className={fieldClass}
                  />
                </label>
              </div>
            </div>
          ) : documentType ? (
            <FilePicker
              file={file}
              setFile={setFile}
              label="Plik dokumentu"
              accept=".pdf"
            />
          ) : null}

          <button type="submit" className={buttonDark}>
            Wyślij dokument
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

        {hashResult ? (
          <div className="mt-6 space-y-3 border-t border-hairline pt-5">
            <h2 className="text-lg font-semibold text-neutral-900">Wynik</h2>
            <CopyField label="HASH" value={hashResult.hash} />
            <CopyField label="CID" value={hashResult.cid} />
          </div>
        ) : null}
      </AppCard>
    </div>
  );
};

export default Upload;
