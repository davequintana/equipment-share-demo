import { useContext, useState } from 'react';
import { Route, Routes, Link } from 'react-router-dom';
import { AuthProvider, AuthContext } from '../context/AuthContext';
import { Header } from '../components/Header';
import { Dashboard } from '../components/Dashboard';
import { LoginForm } from '../components/LoginForm';
import { RegisterForm } from '../components/RegisterForm';
import { ProfilePage } from '../components/ProfilePage';
import * as styles from '../styles/theme.css';

function AppContent() {
  const { user, loading } = useContext(AuthContext);
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Header />
      <Routes>
        <Route
          path="/"
          element={
            user ? (
              <Dashboard />
            ) : authMode === 'login' ? (
              <div className={styles.main}>
                <LoginForm
                  onSuccess={() => setAuthMode(null)}
                />
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <button
                    onClick={() => setAuthMode('register')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#007bff',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      marginRight: '1rem'
                    }}
                  >
                    Create Account
                  </button>
                  <button
                    onClick={() => setAuthMode(null)}
                    className={styles.secondaryButton}
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            ) : authMode === 'register' ? (
              <div className={styles.main}>
                <RegisterForm
                  onSuccess={() => setAuthMode(null)}
                  onSwitchToLogin={() => setAuthMode('login')}
                />
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <button
                    onClick={() => setAuthMode(null)}
                    className={styles.secondaryButton}
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.main}>
                <div className={styles.hero}>
                  <h1 className={styles.heroTitle}>
                    Welcome to Enterprise NX Monorepo
                  </h1>
                  <p className={styles.heroSubtitle}>
                    A comprehensive full-stack application with modern technologies
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
                    <button
                      onClick={() => setAuthMode('login')}
                      className={styles.button}
                    >
                      Login
                    </button>
                    <button
                      onClick={() => setAuthMode('register')}
                      className={styles.secondaryButton}
                    >
                      Create Account
                    </button>
                  </div>
                </div>
              </div>
            )
          }
        />
        <Route
          path="/profile"
          element={
            user ? (
              <ProfilePage />
            ) : (
              <div className={styles.main}>
                <div className={styles.card}>
                  <h2>Access Denied</h2>
                  <p>Please log in to view your profile.</p>
                  <button
                    onClick={() => setAuthMode('login')}
                    className={styles.button}
                    style={{ marginTop: '1rem' }}
                  >
                    Login
                  </button>
                </div>
              </div>
            )
          }
        />
        <Route
          path="/login"
          element={
            <div className={styles.main}>
              <LoginForm />
            </div>
          }
        />
        <Route
          path="/register"
          element={
            <div className={styles.main}>
              <RegisterForm onSwitchToLogin={() => setAuthMode('login')} />
            </div>
          }
        />
      </Routes>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
