import styles from './skillballs.module.css';

// Exibe skill como bolinhas preenchidas (estilo MZ), máximo 10
export default function SkillBalls({ value = 0 }) {
  const filled = Math.min(Math.max(value, 0), 10);
  return (
    <span className={styles.balls}>
      {Array.from({ length: 10 }, (_, i) => (
        <span key={i} className={`${styles.ball} ${i < filled ? styles.filled : ''}`} />
      ))}
    </span>
  );
}
