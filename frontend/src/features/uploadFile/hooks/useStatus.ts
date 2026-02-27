import { useState } from 'react';

export function useStatus() {
  const [status, setStatus] = useState('');
  return { status, setStatus };
}
