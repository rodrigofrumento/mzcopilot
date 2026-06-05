const express = require('express');
const router = express.Router();
const { getRecentChanges, getLastSyncTimes, getPlayerHistory } = require('../db/changes');
const { getPlayerById } = require('../db/players');

// GET /api/v1/dashboard?hours=72
router.get('/', (req, res) => {
  const hours = parseInt(req.query.hours) || 72;
  res.json({
    changes:   getRecentChanges(hours),
    lastSyncs: getLastSyncTimes(),
  });
});

// GET /api/v1/dashboard/history/:playerId
router.get('/history/:playerId', (req, res) => {
  const player = getPlayerById(req.params.playerId);
  if (!player) return res.status(404).json({ error: 'Jogador não encontrado' });
  const history = getPlayerHistory(req.params.playerId);
  res.json({ player, history });
});

module.exports = router;
