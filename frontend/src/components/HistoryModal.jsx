import { useEffect, useState } from 'react';
import { getPlayerHistory } from '../api/dashboard';
import styles from './history-modal.module.css';

const SKILL_LABEL = {
  skill_speed:             'Velocidade',
  skill_stamina:           'Resistência',
  skill_play_intelligence: 'Inteligência',
  skill_passing:           'Passe',
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

function formatDay(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function groupByDay(history) {
  const groups = {};
  for (const c of history) {
    const day = formatDay(c.detected_at);
    if (!groups[day]) groups[day] = [];
    groups[day].push(c);
  }
  return Object.entries(groups); // [ [day, changes[]], ... ] já ordenado por DESC
}

function ChangeRow({ c }) {
  const label = SKILL_LABEL[c.skill] ?? c.skill;
  const isUp   = c.change_type === 'increased';
  const isDown = c.change_type === 'decreased';
  const isMax  = c.change_type === 'maxed';

  return (
    <div className={`${styles.changeRow} ${isUp ? styles.up : isDown ? styles.down : styles.max}`}>
      <span className={styles.changeIcon}>
        {isUp ? '▲' : isDown ? '▼' : '★'}
      </span>
      <span className={styles.changeSkill}>{label}</span>
      <span className={styles.changeVal}>
        {isMax
          ? <span className={styles.maxTag}>MAX</span>
          : <>{c.old_val} <span className={styles.arrow}>→</span> {c.new_val}</>
        }
      </span>
      <span className={styles.changeTime}>{formatTime(c.detected_at)}</span>
    </div>
  );
}

export default function HistoryModal({ playerId, onClose }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!playerId) return;
    setLoading(true);
    getPlayerHistory(playerId)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [playerId]);

  // Fecha com Esc
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const grouped = data?.history ? groupByDay(data.history) : [];
  const player  = data?.player;

  return (
    <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div>
            <div className={styles.playerName}>{player?.name ?? '—'}</div>
            <div className={styles.playerMeta}>
              {player?.age && <span>#{player.number} · {player.age} anos</span>}
              {player?.is_youth === 1 && <span className={styles.youthTag}>JUN</span>}
              {player?.training_speed && <span className={styles.speedTag}>{player.training_speed}</span>}
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Corpo */}
        <div className={styles.body}>
          {loading && <p className={styles.empty}>Carregando…</p>}
          {error   && <p className={styles.error}>{error}</p>}

          {!loading && !error && grouped.length === 0 && (
            <p className={styles.empty}>
              Nenhuma variação registrada ainda.<br />
              As mudanças são detectadas a cada sincronização de Elenco.
            </p>
          )}

          {!loading && grouped.map(([day, changes]) => (
            <div key={day} className={styles.dayGroup}>
              <div className={styles.dayLabel}>{day}</div>
              <div className={styles.dayChanges}>
                {changes.map((c, i) => <ChangeRow key={i} c={c} />)}
              </div>
            </div>
          ))}
        </div>

        {/* Rodapé com total */}
        {!loading && data?.history?.length > 0 && (
          <div className={styles.footer}>
            {data.history.length} evento{data.history.length !== 1 ? 's' : ''} registrado{data.history.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
