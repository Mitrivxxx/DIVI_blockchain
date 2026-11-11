import { useState } from 'react';

export function useOwner() {
  const [owner, setOwner] = useState('');
  return { owner, setOwner };
}
