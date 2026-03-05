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

export const useVerify = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<VerifyResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (selectedFile: File | null) => {
    if (!selectedFile) {
      return;
    }

    if (!isPdfFile(selectedFile)) {
      setFile(null);
      setResult(null);
      setStatus(PDF_ERROR_MESSAGE);
      return;
    }

    setFile(selectedFile);
    setResult(null);
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

    try {
      setStatus('Weryfikuję dokument w blockchain...');
      const response = await verifyDocument(file);
      setResult(response);
      setStatus(response.message);
    } catch (error) {
      setResult(null);
      setStatus(getErrorMessage(error));
    }
  };

  return {
    file,
    isDragging,
    status,
    result,
    fileInputRef,
    setIsDragging,
    handleFileSelect,
    openFileDialog,
    handleDrop,
    handleSubmit,
  };
};
