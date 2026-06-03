const db = require('./schema');

function upsertPlayer(player) {
  const now = new Date().toISOString();

  // Calcula total_skill_balls somando as 13 skills
  const skillKeys = [
    'skill_speed','skill_stamina','skill_play_intelligence','skill_passing',
    'skill_shooting','skill_heading','skill_keeping','skill_ball_control',
    'skill_tackling','skill_aerial_passing','skill_set_plays',
    'skill_experience','skill_form',
  ];
  const total = skillKeys.reduce((sum, k) => sum + (player[k] || 0), 0);

  // Converte value/salary de string "1 876 539 R$" para número
  const parseVal = s => parseInt(String(s).replace(/[^\d]/g, ''), 10) || 0;

  db.run(`
    INSERT OR REPLACE INTO players (
      id, name, number, age, birth_season,
      value, salary, total_skill_balls, is_youth,
      skill_speed, skill_stamina, skill_play_intelligence, skill_passing,
      skill_shooting, skill_heading, skill_keeping, skill_ball_control,
      skill_tackling, skill_aerial_passing, skill_set_plays,
      skill_experience, skill_form,
      last_synced_at
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?,
      ?
    )
  `, [
    player.id, player.name, player.number, player.age, player.birth_season,
    parseVal(player.value), parseVal(player.salary), total, player.is_youth ?? 0,
    player.skill_speed, player.skill_stamina, player.skill_play_intelligence, player.skill_passing,
    player.skill_shooting, player.skill_heading, player.skill_keeping, player.skill_ball_control,
    player.skill_tackling, player.skill_aerial_passing, player.skill_set_plays,
    player.skill_experience, player.skill_form,
    now,
  ]);
}

function getAllPlayers() {
  return db.all('SELECT * FROM players WHERE is_youth = 0 ORDER BY number ASC');
}

function getPlayerById(id) {
  return db.get('SELECT * FROM players WHERE id = ?', [id]);
}

module.exports = { upsertPlayer, getAllPlayers, getPlayerById };
