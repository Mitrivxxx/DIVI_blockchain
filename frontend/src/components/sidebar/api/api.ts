export async function fetchUserRole(address: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/user-role?address=${address}`);
    if (res.ok) {
      const data = await res.json();
      return data.role;
    }
    return null;
  } catch {
    return null;
  }
}
