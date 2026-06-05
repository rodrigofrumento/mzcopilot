import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { getAuthStatus } from './api/auth';
import Login from './pages/Login';
import Layout from './components/Layout';
import Home     from './pages/Home';
import Squad    from './pages/Squad';
import Youth    from './pages/Youth';
import Training from './pages/Training';
import Tactics  from './pages/Tactics';

function Placeholder({ title }) {
  return (
    <div style={{ color: 'var(--text-muted)', paddingTop: 40 }}>
      <h2 style={{ color: 'var(--text)', marginBottom: 8 }}>{title}</h2>
      <p>Em desenvolvimento...</p>
    </div>
  );
}

export default function App() {
  const [authState, setAuthState] = useState('loading'); // loading | authenticated | unauthenticated

  useEffect(() => {
    getAuthStatus()
      .then(data => setAuthState(data.authenticated ? 'authenticated' : 'unauthenticated'))
      .catch(() => setAuthState('unauthenticated'));
  }, []);

  if (authState === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text-muted)' }}>
        Carregando...
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return <Login onSuccess={() => setAuthState('authenticated')} />;
  }

  return (
    <Layout onLogout={() => setAuthState('unauthenticated')}>
      <Routes>
        <Route path="/"        element={<Home     onSessionExpired={() => setAuthState('unauthenticated')} />} />
        <Route path="/squad"   element={<Squad    onSessionExpired={() => setAuthState('unauthenticated')} />} />
        <Route path="/youth"   element={<Youth    onSessionExpired={() => setAuthState('unauthenticated')} />} />
        <Route path="/training"element={<Training onSessionExpired={() => setAuthState('unauthenticated')} />} />
        <Route path="/tactics" element={<Tactics onSessionExpired={() => setAuthState('unauthenticated')} />} />
      </Routes>
    </Layout>
  );
}
