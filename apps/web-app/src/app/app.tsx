import { useContext } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AuthProvider, AuthContext } from '../context/AuthContext';
import { Header } from '../components/Header';
import { Dashboard } from '../components/Dashboard';
import { LoginForm } from '../components/LoginForm';
import { RegisterForm } from '../components/RegisterForm';
import { ProfilePage } from '../components/ProfilePage';
import { BehaviorTracker } from '../components/BehaviorTracker';
import { isLocalOnlyMode } from '../utils/api-url';
import * as styles from '../styles/theme.css';

// Demo Mode Banner Component
function DemoBanner() {
  if (!isLocalOnlyMode()) return null;

  return (
    <div
      style={{
        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '8px 16px',
        textAlign: 'center',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <img
        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Ctext x='0' y='16'%3E%F0%9F%8E%AD%3C/text%3E%3C/svg%3E"
        alt="theater mask"
        style={{ verticalAlign: 'middle', width: '20px', height: '20px', marginRight: '4px' }}
      />{' '}
      Demo Mode: This is a static demo with mock API responses.
      <span style={{ marginLeft: '8px', opacity: 0.9 }}>
        Try: demo@example.com / any password
      </span>
    </div>
  );
}


// Main AppContent component
export function AppContent() {
  const { user } = useContext(AuthContext);

  return (
    <div className={styles.appRoot}>
      <DemoBanner />
      <Header />
      <BehaviorTracker />
      <main>
        <Routes>
          <Route path="/" element={user ? <Dashboard /> : <LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </main>
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
