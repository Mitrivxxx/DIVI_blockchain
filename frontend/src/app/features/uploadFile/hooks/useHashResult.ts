import { useState } from 'react';

export function useHashResult() {
  const [hashResult, setHashResult] = useState<{ hash: string, cid: string } | null>(null);
  return { hashResult, setHashResult };
}
