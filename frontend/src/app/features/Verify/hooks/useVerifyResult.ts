import { useState } from 'react';

interface VerifyResult {
  hash: string;
  isAuthentic: boolean;
}

export const useVerifyResult = () => {
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  return { verifyResult, setVerifyResult };
};
