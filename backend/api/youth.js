const express = require('express');
const router = express.Router();
const { scrapePlayerProfile } = require('../scraper/youth');
const { updatePlayerPotential, getAllYouthPlayers } = require('../db/players');
const db = require('../db/schema');

// POST /api/v1/youth/sync
// Body: { pids: ["123", "456"] }  → scrapa os PIDs fornecidos
// Sem body → scrapa todos os is_youth=1 já no banco
router.post('/sync', async (req, res) => {
  const startedAt = new Date().toISOString();

  let pids = req.body?.pids;
  if (!pids || pids.length === 0) {
    // Auto-detect: todos os jogadores do squad com age <= 18
    const fromSquad = db.all('SELECT id FROM players WHERE age <= 18');
    pids = fromSquad.map(p => p.id);
  }

  if (pids.length === 0) {
    return res.status(400).json({ error: 'Nenhum junior encontrado no elenco. Sincronize o Elenco primeiro.' });
  }

  const results = { success: [], errors: [] };

  for (const pid of pids) {
    try {
      const data = await scrapePlayerProfile(pid);
      updatePlayerPotential(data);
      results.success.push(pid);
    } catch (err) {
      if (err.code === 'SESSION_EXPIRED') {
        db.run(
          `INSERT INTO sync_log (synced_at, module, status, message) VALUES (?, 'youth', 'error', ?)`,
          [startedAt, err.message]
        );
        return res.status(401).json({ error: err.message, code: err.code });
      }
      results.errors.push({ pid, error: err.message });
    }
    // Delay entre requisições para não ser bloqueado
    await new Promise(r => setTimeout(r, 1200));
  }

  db.run(
    `INSERT INTO sync_log (synced_at, module, status, message) VALUES (?, 'youth', 'success', ?)`,
    [startedAt, `${results.success.length} juniors sincronizados, ${results.errors.length} erros`]
  );

  res.json({ success: true, ...results });
});

// GET /api/v1/youth
router.get('/', (req, res) => {
  res.json(getAllYouthPlayers());
});

module.exports = router;
