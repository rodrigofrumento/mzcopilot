const db = require('./schema');

const SKILL_KEYS = [
  'skill_speed', 'skill_stamina', 'skill_play_intelligence', 'skill_passing',
  'skill_shooting', 'skill_heading', 'skill_keeping', 'skill_ball_control',
  'skill_tackling', 'skill_aerial_passing', 'skill_set_plays',
  'skill_experience', 'skill_form',
];

/**
 * Compara oldPlayer (do banco) com newPlayer (do scraper) e insere mudanças detectadas.
 * Deve ser chamado ANTES do upsertPlayer.
 */
function detectAndInsertChanges(oldPlayer, newPlayer) {
  if (!oldPlayer) return; // jogador novo, sem histórico
  const now = new Date().toISOString();

  const oldMaxed = new Set(JSON.parse(oldPlayer.maxed_skills || '[]'));
  const newMaxed = new Set(JSON.parse(newPlayer.maxed_skills || '[]'));

  for (const skill of SKILL_KEYS) {
    const oldVal = oldPlayer[skill] ?? 0;
    const newVal = newPlayer[skill] ?? 0;
    const wasMaxed = oldMaxed.has(skill);
    const isMaxed  = newMaxed.has(skill);

    let changeType = null;
    if (!wasMaxed && isMaxed) changeType = 'maxed';
    else if (newVal > oldVal)  changeType = 'increased';
    else if (newVal < oldVal)  changeType = 'decreased';

    if (changeType) {
      db.run(
        `INSERT INTO skill_changes
          (player_id, player_name, skill, change_type, old_val, new_val, detected_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [String(newPlayer.id), newPlayer.name, skill, changeType, oldVal, newVal, now]
      );
    }
  }
}

/**
 * Retorna mudanças das últimas N horas (padrão 72h = 3 dias).
 */
function getRecentChanges(hours = 72) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  return db.all(`
    SELECT sc.*, p.number, p.is_youth, p.age
    FROM skill_changes sc
    LEFT JOIN players p ON p.id = sc.player_id
    WHERE sc.detected_at >= ?
    ORDER BY sc.detected_at DESC
    LIMIT 500
  `, [since]);
}

/**
 * Retorna o último sync bem-sucedido de cada módulo.
 */
function getLastSyncTimes() {
  return db.all(`
    SELECT module, MAX(synced_at) AS last_sync
    FROM sync_log
    WHERE status = 'success'
    GROUP BY module
  `);
}

/**
 * Retorna todo o histórico de mudanças de um jogador específico.
 */
function getPlayerHistory(playerId) {
  return db.all(`
    SELECT skill, change_type, old_val, new_val, detected_at
    FROM skill_changes
    WHERE player_id = ?
    ORDER BY detected_at DESC
    LIMIT 500
  `, [String(playerId)]);
}

module.exports = { detectAndInsertChanges, getRecentChanges, getLastSyncTimes, getPlayerHistory };
