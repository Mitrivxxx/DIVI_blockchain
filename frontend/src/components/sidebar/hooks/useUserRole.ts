import { useEffect, useState } from 'react';

export function useUserRole(
  walletAddress: string | null,
  fetchUserRole: (address: string) => Promise<string | null>
): [string | null, React.Dispatch<React.SetStateAction<string | null>>] {
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) {
      setUserRole(null);
      return;
    }
    fetchUserRole(walletAddress).then(setUserRole);
  }, [walletAddress, fetchUserRole]);

  return [userRole, setUserRole];
}
