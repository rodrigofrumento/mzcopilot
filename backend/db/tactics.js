const db = require('./schema');

function upsertTactic(tactic) {
  db.run(`
    INSERT OR REPLACE INTO tactics (id, formation, passing, mentality, pressing, players, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    tactic.id,
    tactic.formation,
    tactic.passing,
    tactic.mentality,
    tactic.pressing,
    JSON.stringify(tactic.players || []),
    new Date().toISOString(),
  ]);
}

function getAllTactics() {
  const rows = db.all('SELECT * FROM tactics ORDER BY id ASC');
  return rows.map(r => ({
    ...r,
    players: JSON.parse(r.players || '[]'),
  }));
}

module.exports = { upsertTactic, getAllTactics };
