const BASE = '/api/v1';

export async function syncTactics() {
  const res = await fetch(`${BASE}/tactics/sync`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || 'Erro ao sincronizar táticas');
    err.code = data.code;
    throw err;
  }
  return data;
}

export async function getTactics() {
  const res = await fetch(`${BASE}/tactics`);
  return res.json();
}
