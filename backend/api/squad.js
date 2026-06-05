const express = require('express');
const router = express.Router();
const { scrapeSquad } = require('../scraper/squad');
const { upsertPlayer, getAllPlayers, getPlayerById } = require('../db/players');
const { detectAndInsertChanges } = require('../db/changes');
const db = require('../db/schema');

// POST /api/v1/squad/sync — faz scraping e salva no banco
router.post('/sync', async (req, res) => {
  const startedAt = new Date().toISOString();
  try {
    const players = await scrapeSquad();

    for (const p of players) {
      const old = getPlayerById(p.id);
      detectAndInsertChanges(old, p);
      upsertPlayer(p);
    }

    db.run(
      `INSERT INTO sync_log (synced_at, module, status, message) VALUES (?, 'squad', 'success', ?)`,
      [startedAt, `${players.length} jogadores sincronizados`]
    );

    res.json({ success: true, count: players.length });
  } catch (err) {
    db.run(
      `INSERT INTO sync_log (synced_at, module, status, message) VALUES (?, 'squad', 'error', ?)`,
      [startedAt, err.message]
    );
    const status = err.code === 'SESSION_EXPIRED' ? 401 : 500;
    res.status(status).json({ error: err.message, code: err.code });
  }
});

// GET /api/v1/squad — retorna jogadores do banco
router.get('/', (req, res) => {
  const players = getAllPlayers();
  res.json(players);
});

module.exports = router;
