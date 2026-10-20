import { useState } from 'react';

export interface VerifyResult {
  hash: string;
  isAuthentic: boolean;
  isRevoked: boolean;
  status?: number | null;
  message?: string;
}

export const useVerifyResult = () => {
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  return { verifyResult, setVerifyResult };
};
