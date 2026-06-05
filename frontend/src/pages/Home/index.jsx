import { useEffect, useState } from 'react';
import { getDashboard } from '../../api/dashboard';
import { syncSquad } from '../../api/squad';
import { syncYouth } from '../../api/youth';
import { syncTraining } from '../../api/training';
import { syncTactics } from '../../api/tactics';
import { logout } from '../../api/auth';
import styles from './home.module.css';

const SKILL_LABEL = {
  skill_speed:             'Velocidade',
  skill_stamina:           'Resistência',
  skill_play_intelligence: 'Inteligência',
  skill_passing:           'Passe Curto',
  skill_shooting:          'Chute',
  skill_heading:           'Cabeceio',
  skill_keeping:           'Defesa a Gol',
  skill_ball_control:      'Controle de Bola',
  skill_tackling:          'Desarme',
  skill_aerial_passing:    'Passe Longo',
  skill_set_plays:         'Bola Parada',
  skill_experience:        'Experiência',
  skill_form:              'Forma',
};

const HOURS_OPTIONS = [24, 48, 72];

function ChangeBadge({ c }) {
  const cls = styles[c.change_type] ?? '';
  const label = SKILL_LABEL[c.skill] ?? c.skill;
  return (
    <span className={`${styles.change} ${cls}`}>
      <span className={styles.arrow}>
        {c.change_type === 'increased' ? '▲' : c.change_type === 'decreased' ? '▼' : '★'}
      </span>
      {label}
      {c.change_type === 'maxed'
        ? <span className={styles.val}>MAX</span>
        : <span className={styles.val}>{c.old_val}→{c.new_val}</span>
      }
    </span>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

const STEPS = [
  { key: 'squad',    label: 'Elenco' },
  { key: 'youth',    label: 'Juniores' },
  { key: 'training', label: 'Treino' },
  { key: 'tactics',  label: 'Táticas' },
];

export default function Home({ onSessionExpired }) {
  const [data,    setData]    = useState({ changes: [], lastSyncs: [] });
  const [loading, setLoading] = useState(true);
  const [hours,   setHours]   = useState(48);
  const [syncing, setSyncing] = useState(false);
  const [step,    setStep]    = useState(null); // null | 'squad' | 'youth' | 'training' | 'done'
  const [stepErrors, setStepErrors] = useState({});
  const [error,   setError]   = useState('');

  useEffect(() => { load(); }, [hours]);

  async function load() {
    setLoading(true);
    try {
      setData(await getDashboard(hours));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSyncAll() {
    setSyncing(true);
    setStepErrors({});
    setError('');

    // Squad
    setStep('squad');
    try {
      await syncSquad();
    } catch (e) {
      if (e.code === 'SESSION_EXPIRED') { await logout(); onSessionExpired?.(); return; }
      setStepErrors(prev => ({ ...prev, squad: e.message }));
    }

    // Juniores
    setStep('youth');
    try {
      await syncYouth([]);
    } catch (e) {
      if (e.code === 'SESSION_EXPIRED') { await logout(); onSessionExpired?.(); return; }
      setStepErrors(prev => ({ ...prev, youth: e.message }));
    }

    // Treino
    setStep('training');
    try {
      await syncTraining();
    } catch (e) {
      if (e.code === 'SESSION_EXPIRED') { await logout(); onSessionExpired?.(); return; }
      setStepErrors(prev => ({ ...prev, training: e.message }));
    }

    // Táticas
    setStep('tactics');
    try {
      await syncTactics();
    } catch (e) {
      if (e.code === 'SESSION_EXPIRED') { await logout(); onSessionExpired?.(); return; }
      setStepErrors(prev => ({ ...prev, tactics: e.message }));
    }

    setStep('done');
    setSyncing(false);
    await load();
  }

  // Agrupa mudanças por jogador
  const grouped = data.changes.reduce((acc, c) => {
    if (!acc[c.player_id]) acc[c.player_id] = { name: c.player_name, is_youth: c.is_youth, changes: [] };
    acc[c.player_id].changes.push(c);
    return acc;
  }, {});

  const lastSyncMap = Object.fromEntries(data.lastSyncs.map(s => [s.module, s.last_sync]));

  function stepClass(key) {
    if (stepErrors[key]) return styles.error;
    if (step === 'done' || (STEPS.findIndex(s => s.key === step) > STEPS.findIndex(s => s.key === key))) return styles.done;
    if (step === key) return styles.active;
    return '';
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>Variações de skills do elenco e juniores</p>
        </div>
        <button className={styles.syncAllBtn} onClick={handleSyncAll} disabled={syncing}>
          {syncing ? 'Sincronizando…' : 'Sincronizar Tudo'}
        </button>
      </div>

      {/* Progress steps */}
      {(syncing || step === 'done') && (
        <div className={styles.steps}>
          {STEPS.map(s => (
            <div key={s.key} className={`${styles.step} ${stepClass(s.key)}`}>
              {step === s.key && !stepErrors[s.key]
                ? <span className={styles.spinning}>↻</span>
                : <span className={styles.stepDot} />
              }
              {s.label}
              {stepErrors[s.key] && ' ✗'}
              {!stepErrors[s.key] && (step === 'done' || (STEPS.findIndex(x => x.key === step) > STEPS.findIndex(x => x.key === s.key))) && ' ✓'}
            </div>
          ))}
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}

      {/* Last sync times */}
      <div className={styles.syncMeta}>
        {STEPS.map(s => (
          <span key={s.key} className={styles.syncMetaItem}>
            <strong>{s.label}:</strong> {formatDate(lastSyncMap[s.key])}
          </span>
        ))}
      </div>

      {/* Changes feed */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.sectionTitle}>Variações de Skills</h2>
          <div className={styles.hoursGroup}>
            {HOURS_OPTIONS.map(h => (
              <button
                key={h}
                className={`${styles.hoursBtn} ${hours === h ? styles.active : ''}`}
                onClick={() => setHours(h)}
              >
                {h}h
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className={styles.empty}>Carregando…</p>
        ) : Object.keys(grouped).length === 0 ? (
          <p className={styles.empty}>Nenhuma variação nas últimas {hours}h. Sincronize para ver mudanças.</p>
        ) : (
          Object.values(grouped).map((group, i) => (
            <div key={i} className={styles.playerGroup}>
              <div className={styles.playerName}>
                {group.name}
                {group.is_youth === 1 && <span className={styles.playerTag}>JUN</span>}
              </div>
              <div className={styles.changesList}>
                {group.changes.map((c, j) => <ChangeBadge key={j} c={c} />)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
