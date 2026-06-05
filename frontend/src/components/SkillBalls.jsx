import styles from './skillballs.module.css';

export default function SkillBalls({ value = 0, maxed = false }) {
  const filled = Math.min(Math.max(value, 0), 10);
  return (
    <span className={styles.balls}>
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className={`${styles.ball} ${i < filled ? (maxed ? styles.maxed : styles.filled) : ''}`}
        />
      ))}
    </span>
  );
}
