const express = require('express');
const router = express.Router();
const { login } = require('../scraper/auth');
const { getSession, isSessionValid, clearSession } = require('../db/session');

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
  }

  try {
    await login(username, password);
    const session = getSession();
    res.json({
      success: true,
      expires_at: session.expires_at,
    });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// GET /api/v1/auth/status
router.get('/status', (req, res) => {
  const session = getSession();
  if (!session) return res.json({ authenticated: false });

  const valid = isSessionValid();
  res.json({
    authenticated: valid,
    captured_at: session.captured_at,
    expires_at: session.expires_at,
  });
});

// POST /api/v1/auth/logout
router.post('/logout', (req, res) => {
  clearSession();
  res.json({ success: true });
});

module.exports = router;
