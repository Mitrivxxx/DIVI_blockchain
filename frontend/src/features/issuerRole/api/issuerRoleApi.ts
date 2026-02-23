import { API_URL } from '@/types/api';

export interface IssuerRoleApplication {
  institutionName: string;
  ethereumAddress: string;
  email: string;
  description: string;
}

export async function submitIssuerRoleApplication(
  data: IssuerRoleApplication
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${API_URL}/api/issuer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
}