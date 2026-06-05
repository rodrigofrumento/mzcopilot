import { NavLink } from 'react-router-dom';
import { logout } from '../api/auth';
import styles from './layout.module.css';

const NAV_ITEMS = [
  { to: '/',        label: 'Dashboard' },
  { to: '/squad',   label: 'Elenco' },
  { to: '/youth',   label: 'Juniores' },
  { to: '/training',label: 'Treino' },
  { to: '/tactics', label: 'Táticas' },
];

export default function Layout({ children, onLogout }) {
  async function handleLogout() {
    await logout();
    onLogout();
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>MZ</span>
          <span className={styles.brandText}>Copilot</span>
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button className={styles.logoutBtn} onClick={handleLogout}>
          Desconectar
        </button>
      </aside>

      <main className={styles.main}>{children}</main>
    </div>
  );
}
