export async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {
  }

  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  } catch {
  }
}


