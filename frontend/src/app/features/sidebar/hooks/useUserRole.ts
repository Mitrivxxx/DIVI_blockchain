import { useEffect, useState } from 'react';

export function useUserRole(
  isAuthenticated: boolean,
  fetchUserRole: () => Promise<string | null>
): [string | null, React.Dispatch<React.SetStateAction<string | null>>] {
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setUserRole(null);
      return;
    }
    fetchUserRole().then(setUserRole);
  }, [isAuthenticated, fetchUserRole]);

  return [userRole, setUserRole];
}
