const db = require('./schema');

const DAY_NAMES = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function insertTrainingLog(entries) {
  for (const e of entries) {
    db.run(
      `INSERT OR IGNORE INTO training_log (player_id, log_date, skill, improved, day_of_week)
       VALUES (?, ?, ?, ?, ?)`,
      [e.player_id, e.log_date, e.skill, e.improved ? 1 : 0, DAY_NAMES[e.mz_day] || '']
    );
  }
}

function getRecentLog(limit = 200) {
  return db.all(`
    SELECT tl.*, p.name, p.training_speed, p.is_youth
    FROM training_log tl
    JOIN players p ON p.id = tl.player_id
    ORDER BY tl.log_date DESC, tl.player_id
    LIMIT ?
  `, [limit]);
}

// Calcula média de dias entre bolinhas por Training Speed tier (T1-T4)
function getTrainingReference() {
  const logs = db.all(`
    SELECT tl.player_id, tl.log_date, tl.skill, p.training_speed
    FROM training_log tl
    JOIN players p ON p.id = tl.player_id
    WHERE tl.improved = 1 AND p.training_speed IS NOT NULL
    ORDER BY tl.player_id, tl.skill, tl.log_date ASC
  `);

  // Agrupa por jogador+skill
  const byKey = {};
  for (const row of logs) {
    const key = `${row.player_id}_${row.skill}`;
    if (!byKey[key]) byKey[key] = { tier: row.training_speed, dates: [] };
    byKey[key].dates.push(row.log_date);
  }

  // Calcula gaps entre melhorias consecutivas
  const gaps = {};
  for (const { tier, dates } of Object.values(byKey)) {
    if (dates.length < 2) continue;
    for (let i = 1; i < dates.length; i++) {
      const diff = (new Date(dates[i]) - new Date(dates[i - 1])) / 86400000;
      if (diff > 0 && diff < 90) {
        if (!gaps[tier]) gaps[tier] = [];
        gaps[tier].push(diff);
      }
    }
  }

  // Média por tier
  const ref = {};
  for (const [tier, list] of Object.entries(gaps)) {
    ref[tier] = {
      avg: Math.round((list.reduce((a, b) => a + b, 0) / list.length) * 10) / 10,
      samples: list.length,
    };
  }
  return ref;
}

module.exports = { insertTrainingLog, getRecentLog, getTrainingReference };
