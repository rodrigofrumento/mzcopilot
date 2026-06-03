import { useState } from 'react';
import { login } from '../../api/auth';
import styles from './login.module.css';

export default function Login({ onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>MZ</span>
          <span className={styles.logoText}>Copilot</span>
        </div>

        <p className={styles.subtitle}>Conecte sua conta ManagerZone</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="username">Usuário</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Seu usuário do MZ"
              autoComplete="username"
              disabled={loading}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={loading}
              required
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? (
              <>
                <span className={styles.spinner} />
                Conectando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <p className={styles.note}>
          Sua senha não é armazenada — apenas o cookie de sessão.
        </p>
      </div>
    </div>
  );
}
