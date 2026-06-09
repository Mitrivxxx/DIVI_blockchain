export async function fetchUserRole(): Promise<string | null> {
  try {
    const res = await fetch(`/api/user-role`, {
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      return data.role;
    }
    return null;
  } catch {
    return null;
  }
}
