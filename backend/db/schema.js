const { Database } = require('node-sqlite3-wasm');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, '..', '..', 'db');
const DB_PATH = path.join(DB_DIR, 'mzcopilot.sqlite');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(DB_PATH);

db.run('PRAGMA journal_mode = WAL');
db.run('PRAGMA foreign_keys = ON');

db.run(`
  CREATE TABLE IF NOT EXISTS session (
    id          INTEGER PRIMARY KEY,
    cookie      TEXT NOT NULL,
    captured_at DATETIME NOT NULL,
    expires_at  DATETIME NOT NULL
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS players (
    id                        TEXT PRIMARY KEY,
    name                      TEXT,
    number                    INTEGER,
    age                       INTEGER,
    birth_season              INTEGER,
    foot                      TEXT,
    height                    INTEGER,
    weight                    INTEGER,
    nationality               TEXT,
    value                     INTEGER,
    salary                    INTEGER,
    total_skill_balls         INTEGER,
    is_youth                  BOOLEAN DEFAULT 0,
    training_area             TEXT,
    skill_speed               INTEGER,
    skill_stamina             INTEGER,
    skill_play_intelligence   INTEGER,
    skill_passing             INTEGER,
    skill_shooting            INTEGER,
    skill_heading             INTEGER,
    skill_keeping             INTEGER,
    skill_ball_control        INTEGER,
    skill_tackling            INTEGER,
    skill_aerial_passing      INTEGER,
    skill_set_plays           INTEGER,
    skill_experience          INTEGER,
    skill_form                INTEGER,
    potential_speed             TEXT,
    potential_stamina           TEXT,
    potential_play_intelligence TEXT,
    potential_passing           TEXT,
    potential_shooting          TEXT,
    potential_heading           TEXT,
    potential_keeping           TEXT,
    potential_ball_control      TEXT,
    potential_tackling          TEXT,
    potential_aerial_passing    TEXT,
    potential_set_plays         TEXT,
    training_speed            TEXT,
    last_synced_at            DATETIME
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS training_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id   TEXT REFERENCES players(id),
    log_date    DATE,
    skill       TEXT,
    improved    BOOLEAN,
    day_of_week TEXT
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS tactics (
    id          TEXT PRIMARY KEY,
    name        TEXT,
    formation   TEXT,
    passing     TEXT,
    mentality   TEXT,
    pressing    TEXT,
    players     TEXT,
    updated_at  DATETIME
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS sync_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    synced_at   DATETIME,
    module      TEXT,
    status      TEXT,
    message     TEXT
  )
`);

module.exports = db;
