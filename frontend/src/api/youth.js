const BASE = '/api/v1';

export async function syncYouth(pids = []) {
  const res = await fetch(`${BASE}/youth/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pids.length ? { pids } : {}),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || 'Erro ao sincronizar juniores');
    err.code = data.code;
    throw err;
  }
  return data;
}

export async function getYouth() {
  const res = await fetch(`${BASE}/youth`);
  return res.json();
}
