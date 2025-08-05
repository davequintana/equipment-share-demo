import { useContext, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AuthProvider, AuthContext } from '../context/AuthContext';
import { Header } from '../components/Header';
import { Dashboard } from '../components/Dashboard';
import { LoginForm } from '../components/LoginForm';
import { RegisterForm } from '../components/RegisterForm';
import { ProfilePage } from '../components/ProfilePage';
import { isLocalOnlyMode } from '../utils/api-url';
import * as styles from '../styles/theme.css';

// Demo Mode Banner Component
function DemoBanner() {
  if (!isLocalOnlyMode()) return null;
  
  return (
    <div style={{
      background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '8px 16px',
      textAlign: 'center',
      fontSize: '14px',
      fontWeight: '500',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <span role="img" aria-label="theater mask">🎭</span> Demo Mode: This is a static demo with mock API responses. 
      <span style={{ marginLeft: '8px', opacity: 0.9 }}>
        Try: demo@example.com / any password
      </span>
    </div>
  );
}

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
      <DemoBanner />
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
                    Welcome to Enterprise NX Monorepo with SSR
                  </h1>
                  <p className={styles.heroSubtitle}>
                    Server-side rendered React application with modern technologies
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
                <div className={styles.featureCard}>
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

export { AppContent };

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
