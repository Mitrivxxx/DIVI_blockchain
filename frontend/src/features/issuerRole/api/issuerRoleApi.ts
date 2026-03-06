import { API_URL } from '@/types/api';

export interface IssuerRoleApplication {
  institutionName: string;
  ethereumAddress: string;
  email: string;
  description: string;
}

export function submitIssuerRoleApplication(
  data: IssuerRoleApplication,
  jwt?: string
): Promise<{ success: boolean; message?: string }> {
  return (async () => {
    try {
      const res = await fetch(`${API_URL}/api/issuer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        return { success: true };
      } else {
        const result = await res.json();
        return { success: false, message: result?.message };
      }
    } catch (err) {
      return { success: false, message: 'Błąd sieci.' };
    }
  })();
}