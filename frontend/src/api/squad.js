const BASE = '/api/v1';

export async function syncSquad() {
  const res = await fetch(`${BASE}/squad/sync`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao sincronizar');
  return data;
}

export async function getSquad() {
  const res = await fetch(`${BASE}/squad`);
  return res.json();
}
