import { useEffect, useState } from 'react';
import { getSquad, syncSquad } from '../../api/squad';
import SkillBalls from '../../components/SkillBalls';
import { getPositions } from '../../utils/positions';
import styles from './squad.module.css';

const SKILLS = [
  { key: 'skill_speed',             label: 'Sp'  },
  { key: 'skill_stamina',           label: 'St'  },
  { key: 'skill_play_intelligence', label: 'PI'  },
  { key: 'skill_passing',           label: 'Pa'  },
  { key: 'skill_shooting',          label: 'Sh'  },
  { key: 'skill_heading',           label: 'He'  },
  { key: 'skill_keeping',           label: 'Ke'  },
  { key: 'skill_ball_control',      label: 'BC'  },
  { key: 'skill_tackling',          label: 'Ta'  },
  { key: 'skill_aerial_passing',    label: 'AP'  },
  { key: 'skill_set_plays',         label: 'SP'  },
  { key: 'skill_experience',        label: 'Ex'  },
  { key: 'skill_form',              label: 'Fo'  },
];

function formatMoney(val) {
  if (!val) return '—';
  return new Intl.NumberFormat('pt-BR').format(val) + ' R$';
}

function PlayerRow({ p, displayMode }) {
  const { primary, secondary } = getPositions(p);
  return (
    <tr>
      <td className={styles.num}>{p.number ?? '—'}</td>
      <td className={styles.name}>{p.name}</td>
      <td className={styles.pos}>{primary}</td>
      <td className={styles.pos2}>{secondary}</td>
      <td>{p.age}</td>
      <td className={styles.money}>{formatMoney(p.value)}</td>
      <td className={styles.money}>{formatMoney(p.salary)}</td>
      {SKILLS.map(s => (
        <td key={s.key} className={styles.skillCell}>
          {displayMode === 'balls'
            ? <SkillBalls value={p[s.key]} />
            : <span className={styles.skillNum}>{p[s.key] ?? 0}</span>
          }
        </td>
      ))}
      <td className={styles.total}>{p.total_skill_balls}</td>
    </tr>
  );
}

export default function Squad() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [displayMode, setDisplayMode] = useState('number'); // 'number' | 'balls'

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await getSquad();
      setPlayers(data);
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
      const result = await syncSquad();
      await load();
      // pequeno feedback
    } catch (e) {
      setError(e.message);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Elenco</h1>
          {players.length > 0 && (
            <span className={styles.count}>{players.length} jogadores</span>
          )}
        </div>
        <div className={styles.actions}>
          <div className={styles.toggleGroup}>
            <button
              className={`${styles.toggleBtn} ${displayMode === 'number' ? styles.active : ''}`}
              onClick={() => setDisplayMode('number')}
            >123</button>
            <button
              className={`${styles.toggleBtn} ${displayMode === 'balls' ? styles.active : ''}`}
              onClick={() => setDisplayMode('balls')}
            >●●●</button>
          </div>
          <button className={styles.syncBtn} onClick={handleSync} disabled={syncing}>
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
          </button>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <p className={styles.empty}>Carregando...</p>
      ) : players.length === 0 ? (
        <p className={styles.empty}>Nenhum jogador. Clique em Sincronizar.</p>
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
                <th>Valor</th>
                <th>Salário</th>
                {SKILLS.map(s => <th key={s.key} title={s.key}>{s.label}</th>)}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {players.map(p => <PlayerRow key={p.id} p={p} displayMode={displayMode} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
