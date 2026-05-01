import { useState } from 'react';

export const useStatus = () => {
  const [status, setStatus] = useState<string>('');
  const [type, setType] = useState<'info' | 'error' | 'success'>('info');

  return { status, setStatus, type, setType };
};
