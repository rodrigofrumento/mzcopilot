const BASE = '/api/v1';

export async function getDashboard(hours = 72) {
  const res = await fetch(`${BASE}/dashboard?hours=${hours}`);
  return res.json();
}

export async function getPlayerHistory(playerId) {
  const res = await fetch(`${BASE}/dashboard/history/${playerId}`);
  if (!res.ok) throw new Error('Jogador não encontrado');
  return res.json();
}
