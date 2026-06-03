import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { getAuthStatus } from './api/auth';
import Login from './pages/Login';
import Layout from './components/Layout';

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
        <Route path="/" element={<Navigate to="/squad" replace />} />
        <Route path="/squad" element={<Placeholder title="Elenco" />} />
        <Route path="/youth" element={<Placeholder title="Juniores" />} />
        <Route path="/training" element={<Placeholder title="Treino" />} />
        <Route path="/tactics" element={<Placeholder title="Táticas" />} />
      </Routes>
    </Layout>
  );
}
