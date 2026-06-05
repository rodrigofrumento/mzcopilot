const express = require('express');
const router = express.Router();
const { scrapeTactics } = require('../scraper/tactics');
const { upsertTactic, getAllTactics } = require('../db/tactics');
const db = require('../db/schema');

// POST /api/v1/tactics/sync
router.post('/sync', async (req, res) => {
  const startedAt = new Date().toISOString();
  try {
    const tactics = await scrapeTactics();

    for (const t of tactics) upsertTactic(t);

    db.run(
      `INSERT INTO sync_log (synced_at, module, status, message) VALUES (?, 'tactics', 'success', ?)`,
      [startedAt, `${tactics.length} táticas sincronizadas`]
    );

    res.json({ success: true, count: tactics.length });
  } catch (err) {
    db.run(
      `INSERT INTO sync_log (synced_at, module, status, message) VALUES (?, 'tactics', 'error', ?)`,
      [startedAt, err.message]
    );
    const status = err.code === 'SESSION_EXPIRED' ? 401 : 500;
    res.status(status).json({ error: err.message, code: err.code });
  }
});

// GET /api/v1/tactics
router.get('/', (req, res) => {
  res.json(getAllTactics());
});

module.exports = router;
