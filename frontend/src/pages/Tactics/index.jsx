import { useEffect, useState } from 'react';
import { getTactics, syncTactics } from '../../api/tactics';
import { getDashboard } from '../../api/dashboard';
import { logout } from '../../api/auth';
import { rankTactics } from '../../utils/tacticSuggestion';
import styles from './tactics.module.css';

// Dimensões do pitch — scraper usa 220×350; exibimos em 240×380 (escala proporcional)
const PITCH_W = 220;
const PITCH_H = 350;
// Suplentes têm left ≥ 210 (ficam na borda direita fora do campo no MZ)
const SUB_X_THRESHOLD = 210;
// Estarters: left < 210 e isSub=false

const PASSING_LABEL = { wings: 'Pontas', longball: 'Longo', shortpass: 'Curto' };
const PASSING_CLASS = { wings: styles.badgeWings, longball: styles.badgeLong, shortpass: styles.badgeShort };
const PASSING_ICON  = { wings: '⚡', longball: '↗', shortpass: '↔' };

const MENTALITY_LABEL = { offensive: 'Ofensivo', normal: 'Equilibrado', defensive: 'Defensivo' };
const MENTALITY_CLASS = { offensive: styles.badgeAttack, normal: styles.badgeNormal, defensive: styles.badgeDefend };
const MENTALITY_ICON  = { offensive: '⚔', normal: '⚖', defensive: '🛡' };

const PRESSING_LABEL = { aggressive: 'Marcação Cerrada', normal: 'Normal', passive: 'Passivo' };
const PRESSING_CLASS = { aggressive: styles.badgeCommit, normal: styles.badgeNormal, passive: styles.badgePassive };
const PRESSING_ICON  = { aggressive: '🔥', normal: '·', passive: '🌿' };

function PlayerToken({ p, playerMap }) {
  const info = playerMap[p.pid];
  const isSub = p.isSub || p.left >= SUB_X_THRESHOLD;
  if (isSub) return null; // subs renderizados no bench abaixo

  const x = `${(p.left / PITCH_W) * 100}%`;
  const y = `${(p.top  / PITCH_H) * 100}%`;

  const cls = [styles.player, p.isGk ? styles.gk : ''].filter(Boolean).join(' ');
  const firstName = info?.name?.split(' ')[0] ?? '';

  return (
    <div className={cls} style={{ left: x, top: y }}>
      <div className={styles.playerCircle}>{p.shirtNr ?? '?'}</div>
      {firstName && <span className={styles.playerName}>{firstName}</span>}
    </div>
  );
}

function Pitch({ tactic, playerMap }) {
  const starters = (tactic.players || []).filter(p => !p.isSub && p.left < SUB_X_THRESHOLD);
  const subs     = (tactic.players || []).filter(p => p.isSub || p.left >= SUB_X_THRESHOLD);

  return (
    <div className={styles.pitchWrap}>
      <div className={styles.formationLabel}>{tactic.formation || '—'}</div>

      <div className={styles.pitch}>
        <div className={styles.pitchStripes} />
        <div className={styles.goalTop} />
        <div className={styles.goalBottom} />
        {starters.map((p, i) => (
          <PlayerToken key={p.pid ?? i} p={p} playerMap={playerMap} />
        ))}
      </div>

      {subs.length > 0 && (
        <div className={styles.bench}>
          <div className={styles.benchLabel}>Reservas</div>
          <div className={styles.benchPlayers}>
            {subs.map((p, i) => {
              const info = playerMap[p.pid];
              const firstName = info?.name?.split(' ')[0] ?? '';
              return (
                <div key={p.pid ?? i} className={styles.benchPlayer}>
                  <span className={styles.benchNr}>{p.shirtNr ?? '?'}</span>
                  <span className={styles.benchName}>{firstName || p.pid}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Settings({ tactic, playerMap }) {
  const captainInfo = tactic.captain && tactic.captain !== '0' ? playerMap[tactic.captain] : null;

  function Badge({ value, labelMap, classMap, iconMap }) {
    if (!value) return <span className={styles.noData}>—</span>;
    return (
      <span className={`${styles.badge} ${classMap[value] ?? styles.badgeNormal}`}>
        {iconMap[value] ?? ''} {labelMap[value] ?? value}
      </span>
    );
  }

  return (
    <div className={styles.settings}>
      <div className={styles.settingRow}>
        <div className={styles.settingLabel}>Tática</div>
        <div className={`${styles.settingValue} ${styles.formationLabel}`} style={{ fontSize: 24 }}>
          {tactic.formation ?? '—'}
        </div>
      </div>

      <hr className={styles.divider} />

      <div className={styles.settingRow}>
        <div className={styles.settingLabel}>Estilo de Jogo</div>
        <div className={styles.settingValue}>
          <Badge value={tactic.passing} labelMap={PASSING_LABEL} classMap={PASSING_CLASS} iconMap={PASSING_ICON} />
        </div>
      </div>

      <div className={styles.settingRow}>
        <div className={styles.settingLabel}>Mentalidade</div>
        <div className={styles.settingValue}>
          <Badge value={tactic.mentality} labelMap={MENTALITY_LABEL} classMap={MENTALITY_CLASS} iconMap={MENTALITY_ICON} />
        </div>
      </div>

      <div className={styles.settingRow}>
        <div className={styles.settingLabel}>Pressão</div>
        <div className={styles.settingValue}>
          <Badge value={tactic.pressing} labelMap={PRESSING_LABEL} classMap={PRESSING_CLASS} iconMap={PRESSING_ICON} />
        </div>
      </div>

      {captainInfo && (
        <>
          <hr className={styles.divider} />
          <div className={`${styles.settingRow} ${styles.captainRow}`}>
            <div className={styles.settingLabel}>Capitão</div>
            <div className={styles.captainName}>
              <span className={styles.captainStar}>★</span>{captainInfo.name}
            </div>
          </div>
        </>
      )}

      <hr className={styles.divider} />

      {/* Lista de jogadores na escalação */}
      <div className={styles.settingRow}>
        <div className={styles.settingLabel}>Escalação ({(tactic.players || []).filter(p => !p.isSub && p.left < SUB_X_THRESHOLD).length} titulares)</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
          {(tactic.players || [])
            .filter(p => !p.isSub && p.left < SUB_X_THRESHOLD)
            .sort((a, b) => (b.top || 0) - (a.top || 0)) // GK primeiro (maior top = fundo do campo)
            .map((p, i) => {
              const info = playerMap[p.pid];
              return (
                <div key={p.pid ?? i} style={{ display: 'flex', gap: 8, fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)', minWidth: 20 }}>{p.shirtNr}</span>
                  <span>{info?.name ?? p.pid}</span>
                  {p.isGk && <span style={{ fontSize: 10, color: 'var(--yellow)', fontWeight: 700 }}>GK</span>}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

const PASSING_LABEL_SHORT   = { wings: 'Pontas ⚡', longball: 'Longo ↗', shortpass: 'Curto ↔' };
const MENTALITY_LABEL_SHORT = { offensive: 'Ofensivo ⚔', normal: 'Equilibrado ⚖', defensive: 'Defensivo 🛡' };
const PRESSING_LABEL_SHORT  = { aggressive: 'Cerrada 🔥', normal: 'Normal ·', passive: 'Passivo 🌿' };

const PREFERRED = { passing: 'wings', mentality: 'offensive', pressing: 'aggressive' };

function StyleTag({ label, match }) {
  return (
    <span className={`${styles.styleTag} ${match ? styles.styleTagMatch : styles.styleTagMiss}`}>
      <span className={`${styles.styleDot} ${match ? styles.dotMatch : styles.dotMiss}`} />
      {label}
    </span>
  );
}

function SuggestionTab({ tactics, playerMap }) {
  const ranked = rankTactics(tactics, playerMap);

  if (ranked.length === 0) {
    return <p className={styles.suggestNote}>Sincronize as táticas para ver sugestões.</p>;
  }

  const RANK_BADGE = ['1º', '2º', '3º', '4º', '5º'];
  const RANK_CLS   = [styles.rank1, styles.rank2, styles.rank3, styles.rank3, styles.rank3];

  return (
    <div className={styles.suggestGrid}>
      <p className={styles.suggestNote}>
        Ranking das táticas pelo score médio dos titulares em suas posições.
        Estilo preferido: <strong>Pontas · Ofensivo · Cerrada</strong>.
      </p>

      {ranked.map((r, idx) => {
        const t = r.tactic;
        const isTop = idx === 0;
        const scoreDisplay = r.score.toFixed(1);
        const barW = Math.round((r.score / 10) * 100);

        // Três piores jogadores em posição
        const weakPlayers = [...r.playerScores].sort((a, b) => a.score - b.score).slice(0, 3);

        return (
          <div key={t.id} className={`${styles.rankCard} ${isTop ? styles.top1 : ''}`}>
            <div className={styles.rankHeader}>
              <span className={`${styles.rankBadge} ${RANK_CLS[idx]}`}>{RANK_BADGE[idx]}</span>
              <span className={styles.rankTacticId}>Tática {t.id}</span>
              <span className={styles.rankFormation}>{t.formation}</span>
              <div className={styles.rankScore}>
                {scoreDisplay}
                <span className={styles.rankScoreLabel}>score XI</span>
              </div>
            </div>

            {/* Barra de score */}
            <div style={{ background: 'var(--surface2)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
              <div className={styles.bar} style={{ width: `${barW}%` }} />
            </div>

            {/* Match de estilo */}
            <div className={styles.styleMatchRow}>
              <span className={styles.styleMatchLabel}>Estilo:</span>
              <StyleTag label={PASSING_LABEL_SHORT[t.passing]   ?? t.passing}   match={t.passing   === PREFERRED.passing}   />
              <StyleTag label={MENTALITY_LABEL_SHORT[t.mentality] ?? t.mentality} match={t.mentality === PREFERRED.mentality} />
              <StyleTag label={PRESSING_LABEL_SHORT[t.pressing]  ?? t.pressing}  match={t.pressing  === PREFERRED.pressing}  />
            </div>

            {/* Jogadores mais fracos na posição */}
            {weakPlayers.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
                  Jogadores a melhorar na posição
                </div>
                <table className={styles.playerScoreTable}>
                  <thead>
                    <tr><th>#</th><th>Nome</th><th>Posição</th><th>Score</th><th></th></tr>
                  </thead>
                  <tbody>
                    {weakPlayers.map((ps, i) => {
                      const barPW = Math.round((ps.score / 10) * 100);
                      const isWeak = ps.score < 5;
                      return (
                        <tr key={ps.pid} className={isWeak ? styles.weakRow : ''}>
                          <td>{ps.shirtNr}</td>
                          <td>{ps.name.split(' ')[0]}</td>
                          <td>{ps.pos}</td>
                          <td><strong>{ps.score.toFixed(1)}</strong></td>
                          <td style={{ width: 80 }}>
                            <span className={`${styles.bar} ${isWeak ? styles.barWeak : ''}`} style={{ width: barPW }} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return 'nunca';
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function Tactics({ onSessionExpired }) {
  const [tactics,   setTactics]   = useState([]);
  const [players,   setPlayers]   = useState([]); // todos jogadores do squad (para nomes)
  const [lastSync,  setLastSync]  = useState(null);
  const [active,    setActive]    = useState('A');
  const [loading,   setLoading]   = useState(true);
  const [syncing,   setSyncing]   = useState(false);
  const [error,     setError]     = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [tacs, sqRes, dash] = await Promise.all([
        getTactics(),
        fetch('/api/v1/squad').then(r => r.json()),
        getDashboard(48),
      ]);
      setTactics(tacs);
      setPlayers(sqRes);
      if (tacs.length > 0) setActive(tacs[0].id);
      const syncMap = Object.fromEntries((dash.lastSyncs ?? []).map(s => [s.module, s.last_sync]));
      setLastSync(syncMap['tactics'] ?? null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setError('');
    try {
      await syncTactics();
      await load();
    } catch (e) {
      if (e.code === 'SESSION_EXPIRED') { await logout(); onSessionExpired?.(); return; }
      setError(e.message);
    } finally {
      setSyncing(false);
    }
  }

  // Mapa pid → player info para lookup rápido
  const playerMap = Object.fromEntries(players.map(p => [String(p.id), p]));

  const currentTactic = tactics.find(t => t.id === active);
  const hasData = tactics.length > 0 && currentTactic?.players?.length > 0;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Táticas</h1>
          {lastSync && <span className={styles.lastSync}>Última sync: {formatDate(lastSync)}</span>}
        </div>
        <button className={styles.syncBtn} onClick={handleSync} disabled={syncing}>
          {syncing ? 'Sincronizando…' : 'Sincronizar'}
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {/* Tabs A-E + Sugestão */}
      <div className={styles.tabs}>
        {['A','B','C','D','E'].map(letter => {
          const t = tactics.find(x => x.id === letter);
          const hasPlayers = t?.players?.length > 0;
          return (
            <button
              key={letter}
              className={`${styles.tab} ${active === letter ? styles.active : ''} ${!hasPlayers ? styles.empty : ''}`}
              onClick={() => setActive(letter)}
            >
              {letter}
              {t?.formation && <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 400 }}>{t.formation}</span>}
            </button>
          );
        })}
        <button
          className={`${styles.tab} ${styles.suggest} ${active === 'SUGGEST' ? styles.active : ''}`}
          onClick={() => setActive('SUGGEST')}
          style={{ marginLeft: 8 }}
        >
          ★ Sugestão
        </button>
      </div>

      {loading ? (
        <p className={styles.empty}>Carregando…</p>
      ) : active === 'SUGGEST' ? (
        <SuggestionTab tactics={tactics} playerMap={playerMap} />
      ) : !hasData ? (
        <p className={styles.empty}>Nenhuma tática sincronizada. Clique em Sincronizar.</p>
      ) : (
        <div className={styles.content}>
          <Pitch tactic={currentTactic} playerMap={playerMap} />
          <Settings tactic={currentTactic} playerMap={playerMap} />
        </div>
      )}
    </div>
  );
}
