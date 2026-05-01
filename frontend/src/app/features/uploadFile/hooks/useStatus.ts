import { useState } from 'react';

export type StatusType = 'error' | 'success' | 'info' | null;

export function useStatus() {
  const [status, setStatus] = useState('');
  const [type, setType] = useState<StatusType>(null);

  const clearStatus = () => {
    setStatus('');
    setType(null);
  };

  return { status, setStatus, type, setType, clearStatus };
}
