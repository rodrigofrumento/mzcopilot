import { useEffect, useState } from 'react';
import { syncTraining, getTrainingReference, getTrainingPlayers } from '../../api/training';
import { getDashboard } from '../../api/dashboard';
import { logout } from '../../api/auth';
import { getPositions } from '../../utils/positions';
import { getSuggestions, estDays, SKILLS } from '../../utils/training';
import styles from './training.module.css';

const TIERS = ['T1', 'T2', 'T3', 'T4'];

function ReferenceTable({ reference, samples }) {
  return (
    <div className={styles.refCard}>
      <h2 className={styles.sectionTitle}>Velocidade de Treino — Dias por Bolinha</h2>
      <p className={styles.refDesc}>Calculado automaticamente a partir do histórico de melhorias. Sincronize treinos regularmente para acumular dados.</p>
      <table className={styles.refTable}>
        <thead>
          <tr>
            <th>Tier</th>
            <th>Média (dias/bolinha)</th>
            <th>Amostras</th>
          </tr>
        </thead>
        <tbody>
          {TIERS.map(t => (
            <tr key={t}>
              <td><span className={styles.tierBadge}>{t}</span></td>
              <td>{reference[t] ? <strong>{reference[t].avg}</strong> : <span className={styles.noData}>aguardando dados…</span>}</td>
              <td className={styles.samples}>{reference[t]?.samples ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PotentialBadge({ value }) {
  if (!value) return null;
  const cls = value.startsWith('H') ? styles.potHigh : styles.potLow;
  return <span className={`${styles.badge} ${cls}`}>{value}</span>;
}

function SuggestionRow({ player, reference, recentMaxed }) {
  const { primary } = getPositions(player);
  const suggestions = getSuggestions(player, primary);
  const top = suggestions[0];
  const second = suggestions[1];

  if (!top) return null;

  const days = player.training_speed ? estDays(player.training_speed, reference) : null;
  // Skills recém-maxadas neste jogador (nas últimas 48h)
  const newlyMaxed = recentMaxed ? [...recentMaxed].map(k => SKILL_LABEL_MAP[k] || k) : [];

  return (
    <>
    <tr className={player.is_youth ? styles.youthRow : ''}>
      <td className={styles.num}>{player.number ?? '—'}</td>
      <td className={styles.name}>
        {player.name}
        {player.is_youth && <span className={styles.youthTag}>JUN</span>}
        {newlyMaxed.length > 0 && (
          <span className={styles.maxedAlert} title={`Maximizou: ${newlyMaxed.join(', ')}`}>★ MAX</span>
        )}
      </td>
      <td className={styles.pos}>{primary}</td>
      {player.training_speed
        ? <td><span className={`${styles.badge} ${styles.potSpeed}`}>{player.training_speed}</span></td>
        : <td className={styles.noData}>—</td>
      }
      <td className={styles.suggest}>
        <span className={styles.skillName}>{top.label}</span>
        {top.potential && <PotentialBadge value={top.potential} />}
        <span className={styles.weight}>w:{top.weight}</span>
      </td>
      <td className={styles.currentVal}>{top.val}</td>
      <td className={styles.suggest2}>
        {second && <>
          <span className={styles.skillName}>{second.label}</span>
          {second.potential && <PotentialBadge value={second.potential} />}
        </>}
      </td>
      <td className={styles.estDays}>
        {days != null ? `~${days}d` : <span className={styles.noData}>—</span>}
      </td>
    </tr>
    {newlyMaxed.length > 0 && (
      <tr className={styles.maxedRow}>
        <td colSpan={8} className={styles.maxedMsg}>
          ⚠ Maximizou <strong>{newlyMaxed.join(', ')}</strong> — considere trocar a skill de treino para <strong>{top.label}</strong>
        </td>
      </tr>
    )}
    </>
  );
}

// Retorna o label legível de uma skill key
const SKILL_LABEL_MAP = Object.fromEntries(SKILLS.map(s => [s.key, s.label]));

function formatDate(iso) {
  if (!iso) return 'nunca';
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function Training({ onSessionExpired }) {
  const [players,   setPlayers]   = useState([]);
  const [reference, setReference] = useState({});
  const [maxedMap,  setMaxedMap]  = useState({}); // { playerId: Set<skillKey> } — skills recém-maxadas
  const [lastSync,  setLastSync]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [syncing,   setSyncing]   = useState(false);
  const [error,     setError]     = useState('');
  const [filter,    setFilter]    = useState('all'); // all | youth | senior

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [p, r, dash] = await Promise.all([getTrainingPlayers(), getTrainingReference(), getDashboard(48)]);
      setPlayers(p);
      setReference(r);
      // Monta mapa de skills recém-maxadas por jogador
      const mm = {};
      for (const c of dash.changes) {
        if (c.change_type === 'maxed') {
          if (!mm[c.player_id]) mm[c.player_id] = new Set();
          mm[c.player_id].add(c.skill);
        }
      }
      setMaxedMap(mm);
      const syncMap = Object.fromEntries((dash.lastSyncs ?? []).map(s => [s.module, s.last_sync]));
      setLastSync(syncMap['training'] ?? null);
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
      const result = await syncTraining();
      await load();
      setError(''); // limpa após sucesso
    } catch (e) {
      if (e.code === 'SESSION_EXPIRED') { await logout(); onSessionExpired?.(); return; }
      setError(e.message);
    } finally {
      setSyncing(false);
    }
  }

  const filtered = players.filter(p => {
    if (filter === 'youth')  return p.is_youth === 1;
    if (filter === 'senior') return p.is_youth === 0;
    return true;
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Treino</h1>
          {lastSync && <span className={styles.lastSync}>Última sync: {formatDate(lastSync)}</span>}
        </div>
        <button className={styles.syncBtn} onClick={handleSync} disabled={syncing}>
          {syncing ? 'Sincronizando…' : 'Sincronizar Semana'}
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <ReferenceTable reference={reference} />

      <div className={styles.suggestCard}>
        <div className={styles.suggestHeader}>
          <h2 className={styles.sectionTitle}>Sugestões de Treino</h2>
          <div className={styles.filterGroup}>
            {['all','youth','senior'].map(f => (
              <button key={f} className={`${styles.filterBtn} ${filter === f ? styles.active : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? 'Todos' : f === 'youth' ? 'Juniores' : 'Seniores'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className={styles.empty}>Carregando…</p>
        ) : filtered.length === 0 ? (
          <p className={styles.empty}>Nenhum jogador. Sincronize o Elenco primeiro.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nome</th>
                  <th>Pos.</th>
                  <th>T</th>
                  <th>1ª Opção</th>
                  <th>Val.</th>
                  <th>2ª Opção</th>
                  <th>Est. dias</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <SuggestionRow key={p.id} player={p} reference={reference} recentMaxed={maxedMap[p.id]} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
