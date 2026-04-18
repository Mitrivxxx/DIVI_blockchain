import { type FormEvent, useRef, useState } from 'react';
import { verifyDocument, type VerifyResult } from '../api/verifyApi';

const PDF_ERROR_MESSAGE = 'Dozwolone są tylko pliki PDF';
const FILE_TOO_LARGE_MESSAGE = 'Maksymalny rozmiar pliku to 5 MB';
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const isPdfFile = (selectedFile: File): boolean => (
  selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf')
);

const isFileWithinLimit = (selectedFile: File): boolean => selectedFile.size <= MAX_FILE_SIZE_BYTES;

const validateSelectedFile = (selectedFile: File): string | null => {
  if (!isPdfFile(selectedFile)) {
    return PDF_ERROR_MESSAGE;
  }

  if (!isFileWithinLimit(selectedFile)) {
    return FILE_TOO_LARGE_MESSAGE;
  }

  return null;
};

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
  const [selectedAt, setSelectedAt] = useState<Date | null>(null);
  const [showFileInfo, setShowFileInfo] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationOutcome, setVerificationOutcome] = useState<VerificationOutcome | null>(null);
  const [verificationData, setVerificationData] = useState<VerifyResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (selectedFile: File | null) => {
    if (!selectedFile) {
      return;
    }

    const validationError = validateSelectedFile(selectedFile);

    if (validationError) {
      setFile(null);
      setSelectedAt(null);
      setShowFileInfo(false);
      setVerificationOutcome(null);
      setVerificationData(null);
      setStatus(validationError);
      return;
    }

    setFile(selectedFile);
    setSelectedAt(new Date());
    setShowFileInfo(false);
    setVerificationOutcome(null);
    setVerificationData(null);
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

    const validationError = validateSelectedFile(file);

    if (validationError) {
      setStatus(validationError);
      return;
    }

    setShowFileInfo(true);
    setIsVerifying(true);
    setStatus('Weryfikuję dokument w blockchain...');
    setVerificationOutcome(null);
    setVerificationData(null);

    try {
      const response = await verifyDocument(file);
      setVerificationData(response);
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
      setVerificationData(null);
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
    setSelectedAt(null);
    setShowFileInfo(false);
    setIsDragging(false);
    setStatus('');
    setIsVerifying(false);
    setVerificationOutcome(null);
    setVerificationData(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return {
    file,
    selectedAt,
    showFileInfo,
    isDragging,
    status,
    isVerifying,
    verificationOutcome,
    verificationData,
    fileInputRef,
    setIsDragging,
    handleFileSelect,
    openFileDialog,
    handleDrop,
    handleSubmit,
    handleReset,
  };
};
