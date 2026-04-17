import { type FormEvent, useRef, useState } from 'react';
import { verifyDocument, type VerifyResult } from '../api/verifyApi';

const PDF_ERROR_MESSAGE = 'Dozwolone są tylko pliki PDF';

const isPdfFile = (selectedFile: File): boolean => (
  selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf')
);

const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'object' && error !== null) {
    const apiMessage = (error as { response?: { data?: string } }).response?.data;
    if (typeof apiMessage === 'string' && apiMessage.length > 0) {
      return apiMessage;
    }

    const message = (error as { message?: string }).message;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }

  return 'Błąd podczas weryfikacji dokumentu';
};

type VerificationOutcome = {
  kind: 'verified' | 'missing' | 'error';
  title: string;
  description: string;
};

export const useVerify = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationOutcome, setVerificationOutcome] = useState<VerificationOutcome | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (selectedFile: File | null) => {
    if (!selectedFile) {
      return;
    }

    if (!isPdfFile(selectedFile)) {
      setFile(null);
      setVerificationOutcome(null);
      setStatus(PDF_ERROR_MESSAGE);
      return;
    }

    setFile(selectedFile);
    setVerificationOutcome(null);
    setStatus('');
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = (droppedFile: File | null) => {
    setIsDragging(false);
    handleFileSelect(droppedFile);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!file) {
      setStatus('Weryfikuj dokument');
      return;
    }

    if (!isPdfFile(file)) {
      setStatus(PDF_ERROR_MESSAGE);
      return;
    }

    setIsVerifying(true);
    setStatus('Weryfikuję dokument w blockchain...');
    setVerificationOutcome(null);

    try {
      const response = await verifyDocument(file);
      setVerificationOutcome(response.isAuthentic
        ? {
            kind: 'verified',
            title: 'ZWERYFIKOWANY',
            description: 'Dokument jest autentyczny i nie został zmodyfikowany.',
          }
        : {
            kind: 'missing',
            title: 'BRAK W BLOCKCHAIN',
            description: 'Nie mamy dowodu, że ten dokument został kiedykolwiek zarejestrowany.',
          });
      setStatus('');
    } catch (error) {
      setVerificationOutcome({
        kind: 'error',
        title: 'NIEZGODNY',
        description: getErrorMessage(error),
      });
      setStatus('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setIsDragging(false);
    setStatus('');
    setIsVerifying(false);
    setVerificationOutcome(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return {
    file,
    isDragging,
    status,
    isVerifying,
    verificationOutcome,
    fileInputRef,
    setIsDragging,
    handleFileSelect,
    openFileDialog,
    handleDrop,
    handleSubmit,
    handleReset,
  };
};
