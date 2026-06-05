const BASE = '/api/v1';

export async function syncSquad() {
  const res = await fetch(`${BASE}/squad/sync`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || 'Erro ao sincronizar');
    err.code = data.code;
    throw err;
  }
  return data;
}

export async function getSquad() {
  const res = await fetch(`${BASE}/squad`);
  return res.json();
}
