const express = require('express');
const router = express.Router();
const { scrapeSquad } = require('../scraper/squad');
const { upsertPlayer, getAllPlayers } = require('../db/players');
const db = require('../db/schema');

// POST /api/v1/squad/sync — faz scraping e salva no banco
router.post('/sync', async (req, res) => {
  const startedAt = new Date().toISOString();
  try {
    const players = await scrapeSquad();

    for (const p of players) upsertPlayer(p);

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
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/squad — retorna jogadores do banco
router.get('/', (req, res) => {
  const players = getAllPlayers();
  res.json(players);
});

module.exports = router;
