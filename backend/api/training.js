const express = require('express');
const router = express.Router();
const { scrapeTrainingWeek } = require('../scraper/training');
const { insertTrainingLog, getRecentLog, getTrainingReference } = require('../db/training');
const { getAllPlayers, getAllYouthPlayers } = require('../db/players');
const db = require('../db/schema');

// POST /api/v1/training/sync — scrapa treinos da semana atual
router.post('/sync', async (req, res) => {
  const startedAt = new Date().toISOString();
  try {
    const entries = await scrapeTrainingWeek();
    insertTrainingLog(entries);

    db.run(
      `INSERT INTO sync_log (synced_at, module, status, message) VALUES (?, 'training', 'success', ?)`,
      [startedAt, `${entries.length} registros de treino sincronizados`]
    );

    res.json({ success: true, count: entries.length });
  } catch (err) {
    db.run(
      `INSERT INTO sync_log (synced_at, module, status, message) VALUES (?, 'training', 'error', ?)`,
      [startedAt, err.message]
    );
    const status = err.code === 'SESSION_EXPIRED' ? 401 : 500;
    res.status(status).json({ error: err.message, code: err.code });
  }
});

// GET /api/v1/training/reference — tabela de referência T1-T4 calculada do log
router.get('/reference', (req, res) => {
  res.json(getTrainingReference());
});

// GET /api/v1/training/log — histórico recente de treinos
router.get('/log', (req, res) => {
  const limit = parseInt(req.query.limit) || 200;
  res.json(getRecentLog(limit));
});

// GET /api/v1/training/players — todos os jogadores para sugestões
router.get('/players', (req, res) => {
  const seniors = getAllPlayers();
  const youth   = getAllYouthPlayers();
  res.json([...youth, ...seniors]);
});

module.exports = router;
