import { useEffect, useState } from 'react';
import { getYouth, syncYouth } from '../../api/youth';
import { getDashboard } from '../../api/dashboard';
import { logout } from '../../api/auth';
import SkillBalls from '../../components/SkillBalls';
import HistoryModal from '../../components/HistoryModal';
import { getPositions } from '../../utils/positions';
import styles from './youth.module.css';

const SKILLS = [
  { key: 'skill_speed',             label: 'Sp',  potKey: 'potential_speed'             },
  { key: 'skill_stamina',           label: 'St',  potKey: 'potential_stamina'           },
  { key: 'skill_play_intelligence', label: 'PI',  potKey: 'potential_play_intelligence' },
  { key: 'skill_passing',           label: 'Pa',  potKey: 'potential_passing'           },
  { key: 'skill_shooting',          label: 'Sh',  potKey: 'potential_shooting'          },
  { key: 'skill_heading',           label: 'He',  potKey: 'potential_heading'           },
  { key: 'skill_keeping',           label: 'Ke',  potKey: 'potential_keeping'           },
  { key: 'skill_ball_control',      label: 'BC',  potKey: 'potential_ball_control'      },
  { key: 'skill_tackling',          label: 'Ta',  potKey: 'potential_tackling'          },
  { key: 'skill_aerial_passing',    label: 'AP',  potKey: 'potential_aerial_passing'    },
  { key: 'skill_set_plays',         label: 'SP',  potKey: 'potential_set_plays'         },
];

function PotentialBadge({ value }) {
  if (!value) return null;
  const type = value[0]; // H, L ou T
  const cls = type === 'H' ? styles.potHigh : type === 'L' ? styles.potLow : styles.potSpeed;
  return <span className={`${styles.badge} ${cls}`}>{value}</span>;
}

const TRAINING_AREA_PT = {
  'Any': 'Qualquer',
  'Speed': 'Velocidade',
  'Stamina': 'Resistência',
  'Play Intelligence': 'Inteligência',
  'Passing': 'Passe',
  'Shooting': 'Chute',
  'Heading': 'Cabeceio',
  'Keeping': 'Defesa',
  'Ball Control': 'Controle',
  'Tackling': 'Desarme',
  'Aerial Passing': 'P. Longo',
  'Set Plays': 'B. Parada',
  'Experience': 'Experiência',
  'Form': 'Forma',
};

function TrainingAreaCell({ value }) {
  if (!value) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  const label = TRAINING_AREA_PT[value] ?? value;
  const isAny = value === 'Any';
  return (
    <span style={{ color: isAny ? 'var(--text-muted)' : 'var(--accent)', fontWeight: isAny ? 400 : 600, fontSize: 12 }}>
      {label}
    </span>
  );
}

function TrainingSpeedBadge({ value }) {
  if (!value) return <span className={styles.badgeEmpty}>—</span>;
  return <span className={`${styles.badge} ${styles.potSpeed}`}>{value}</span>;
}

function DeltaBadge({ type }) {
  if (!type) return null;
  if (type === 'increased') return <span className={styles.deltaUp}>▲</span>;
  if (type === 'decreased') return <span className={styles.deltaDown}>▼</span>;
  if (type === 'maxed')     return <span className={styles.deltaMax}>★</span>;
  return null;
}

function PlayerRow({ p, displayMode, changeMap, onHistory }) {
  const { primary, secondary } = getPositions(p);
  const maxedSet = new Set(JSON.parse(p.maxed_skills || '[]'));
  const playerChanges = changeMap[p.id] || {};
  const hasAnyChange = Object.keys(playerChanges).length > 0;
  return (
    <tr className={hasAnyChange ? styles.changedRow : ''}>
      <td className={styles.num}>{p.number ?? '—'}</td>
      <td className={styles.name}>
        <button className={styles.nameBtn} onClick={() => onHistory(p.id)} title="Ver histórico">{p.name}</button>
      </td>
      <td className={styles.pos}>{primary}</td>
      <td className={styles.pos2}>{secondary}</td>
      <td>{p.age}</td>
      <td className={styles.ts}><TrainingSpeedBadge value={p.training_speed} /></td>
      <td className={styles.trainingArea}><TrainingAreaCell value={p.training_area} /></td>
      {SKILLS.map(s => {
        const val = p[s.key] ?? 0;
        const maxed = maxedSet.has(s.key);
        const pot = p[s.potKey];
        const delta = playerChanges[s.key];
        return (
          <td key={s.key} className={styles.skillCell}>
            <div className={styles.skillInner}>
              {displayMode === 'balls'
                ? <SkillBalls value={val} maxed={maxed} />
                : <span className={`${styles.skillNum} ${maxed ? styles.skillMaxed : ''}`}>{val}</span>
              }
              <PotentialBadge value={pot} />
              <DeltaBadge type={delta} />
            </div>
          </td>
        );
      })}
      <td className={styles.total}>{p.total_skill_balls}</td>
    </tr>
  );
}


function formatDate(iso) {
  if (!iso) return 'nunca';
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function Youth({ onSessionExpired }) {
  const [players,   setPlayers]   = useState([]);
  const [changeMap, setChangeMap] = useState({});
  const [lastSync,  setLastSync]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [syncing,   setSyncing]   = useState(false);
  const [showAll,   setShowAll]   = useState(true);
  const [error,     setError]     = useState('');
  const [displayMode, setDisplayMode] = useState('number');
  const [historyId, setHistoryId] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [data, dash] = await Promise.all([getYouth(), getDashboard(48)]);
      setPlayers(data);
      const map = {};
      for (const c of dash.changes) {
        if (!map[c.player_id]) map[c.player_id] = {};
        map[c.player_id][c.skill] = c.change_type;
      }
      setChangeMap(map);
      const syncMap = Object.fromEntries((dash.lastSyncs ?? []).map(s => [s.module, s.last_sync]));
      setLastSync(syncMap['youth'] ?? null);
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
      const result = await syncYouth([]);
      if (result.errors?.length) {
        setError(`${result.errors.length} erro(s): ${result.errors.map(e => e.pid).join(', ')}`);
      }
      await load();
    } catch (e) {
      if (e.code === 'SESSION_EXPIRED') { await logout(); onSessionExpired?.(); return; }
      setError(e.message);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Juniores</h1>
          {players.length > 0 && <span className={styles.count}>{players.length} jogadores</span>}
          {lastSync && <span className={styles.lastSync}>Última sync: {formatDate(lastSync)}</span>}
        </div>
        <div className={styles.actions}>
          {Object.keys(changeMap).length > 0 && (
            <div className={styles.toggleGroup}>
              <button className={`${styles.toggleBtn} ${showAll ? styles.active : ''}`} onClick={() => setShowAll(true)}>Todos</button>
              <button className={`${styles.toggleBtn} ${!showAll ? styles.active : ''}`} onClick={() => setShowAll(false)}>Com mudanças</button>
            </div>
          )}
          <div className={styles.toggleGroup}>
            <button className={`${styles.toggleBtn} ${displayMode === 'number' ? styles.active : ''}`} onClick={() => setDisplayMode('number')}>123</button>
            <button className={`${styles.toggleBtn} ${displayMode === 'balls'  ? styles.active : ''}`} onClick={() => setDisplayMode('balls')}>●●●</button>
          </div>
          <button className={styles.syncBtn} onClick={handleSync} disabled={syncing}>
            {syncing ? 'Sincronizando…' : 'Sincronizar do Elenco'}
          </button>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.legend}>
        <span className={`${styles.badge} ${styles.potHigh}`}>H1–H4</span> alto potencial &nbsp;
        <span className={`${styles.badge} ${styles.potLow}`}>L1–L2</span> baixo potencial &nbsp;
        <span className={`${styles.badge} ${styles.potSpeed}`}>T1–T4</span> velocidade de treino
      </div>

      {loading ? (
        <p className={styles.empty}>Carregando...</p>
      ) : players.length === 0 ? (
        <p className={styles.empty}>Nenhum junior. Sincronize o Elenco e clique em Sincronizar do Elenco.</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Nome</th>
                <th>Pos.</th>
                <th>Pos. 2</th>
                <th>Idade</th>
                <th>Vel. Treino</th>
                <th>Treino</th>
                {SKILLS.map(s => <th key={s.key}>{s.label}</th>)}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {(showAll ? players : players.filter(p => changeMap[p.id]))
                .map(p => <PlayerRow key={p.id} p={p} displayMode={displayMode} changeMap={changeMap} onHistory={setHistoryId} />)}
            </tbody>
          </table>
        </div>
      )}

      {historyId && (
        <HistoryModal playerId={historyId} onClose={() => setHistoryId(null)} />
      )}
    </div>
  );
}
