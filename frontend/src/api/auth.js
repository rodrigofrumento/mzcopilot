const BASE = '/api/v1';

export async function login(username, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao fazer login');
  return data;
}

export async function getAuthStatus() {
  const res = await fetch(`${BASE}/auth/status`);
  return res.json();
}

export async function logout() {
  await fetch(`${BASE}/auth/logout`, { method: 'POST' });
}
