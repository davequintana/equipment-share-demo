import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import * as styles from '../styles/theme.css';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
  redirectTo?: string;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onSwitchToLogin,
  redirectTo = '/dashboard'
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength to match backend requirements
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter');
      setLoading(false);
      return;
    }

    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter');
      setLoading(false);
      return;
    }

    if (!/\d/.test(password)) {
      setError('Password must contain at least one number');
      setLoading(false);
      return;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setError('Password must contain at least one special character');
      setLoading(false);
      return;
    }

    try {
      await register(email, password, name);

      // Call onSuccess callback if provided
      onSuccess?.();

      // Navigate to dashboard or specified redirect URL
      navigate(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.authForm} onSubmit={handleSubmit}>
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Create Account</h2>

      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="name">
          Full Name
        </label>
        <input
          className={styles.input}
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Enter your full name"
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="email">
          Email
        </label>
        <input
          className={styles.input}
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="Enter your email"
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="password">
          Password
        </label>
        <input
          className={styles.input}
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Min 8 chars, uppercase, lowercase, number, special char"
          minLength={8}
        />
        <small style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem', display: 'block' }}>
          Password must contain: 8+ characters, uppercase, lowercase, number, and special character
        </small>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="confirmPassword">
          Confirm Password
        </label>
        <input
          className={styles.input}
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          placeholder="Confirm your password"
          minLength={6}
        />
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}

      <button
        className={styles.button}
        type="submit"
        disabled={loading}
        style={{ width: '100%', marginTop: '1rem' }}
      >
        {loading ? 'Creating Account...' : 'Create Account'}
      </button>

      <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: '#666' }}>
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          style={{
            background: 'none',
            border: 'none',
            color: '#007bff',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontSize: 'inherit',
          }}
        >
          Sign in here
        </button>
      </p>
    </form>
  );
};
