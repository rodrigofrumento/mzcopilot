const db = require('./schema');

function saveSession(cookie) {
  const now = new Date();
  const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  db.run(
    `INSERT OR REPLACE INTO session (id, cookie, captured_at, expires_at) VALUES (1, ?, ?, ?)`,
    [cookie, now.toISOString(), expires.toISOString()]
  );
}

function getSession() {
  return db.get('SELECT * FROM session WHERE id = 1');
}

function isSessionValid() {
  const session = getSession();
  if (!session) return false;
  return new Date(session.expires_at) > new Date();
}

function clearSession() {
  db.run('DELETE FROM session WHERE id = 1');
}

module.exports = { saveSession, getSession, isSessionValid, clearSession };
