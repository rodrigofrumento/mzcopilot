const BASE = '/api/v1';

export async function syncTraining() {
  const res = await fetch(`${BASE}/training/sync`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || 'Erro ao sincronizar treinos');
    err.code = data.code;
    throw err;
  }
  return data;
}

export async function getTrainingReference() {
  const res = await fetch(`${BASE}/training/reference`);
  return res.json();
}

export async function getTrainingPlayers() {
  const res = await fetch(`${BASE}/training/players`);
  return res.json();
}
