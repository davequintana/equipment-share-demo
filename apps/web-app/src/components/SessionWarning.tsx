import React, { useState, useEffect } from 'react';
import * as styles from '../styles/theme.css';

interface SessionWarningProps {
  show: boolean;
  timeRemaining: number; // in seconds
  onExtendSession: () => void;
  onLogout: () => void;
}

export const SessionWarning: React.FC<SessionWarningProps> = ({
  show,
  timeRemaining,
  onExtendSession,
  onLogout
}) => {
  const [remainingTime, setRemainingTime] = useState(timeRemaining);

  useEffect(() => {
    setRemainingTime(timeRemaining);
  }, [timeRemaining]);

  useEffect(() => {
    if (!show) return;

    const interval = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [show, onLogout]);

  if (!show) return null;

  // Ensure time doesn't go negative for display
  const displayTime = Math.max(remainingTime, 0);
  const minutes = Math.floor(displayTime / 60);
  const seconds = displayTime % 60;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <dialog
        open
        aria-labelledby="session-warning-title"
        style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          maxWidth: '400px',
          width: '90%',
          textAlign: 'center',
          border: 'none',
        }}
      >
        <h3 id="session-warning-title" style={{ marginTop: 0, color: '#dc3545' }}>
          Session Expiring Soon
        </h3>
        <p style={{ margin: '1rem 0', color: '#666' }}>
          Your session will expire in{' '}
          <strong>
            {minutes}:{seconds.toString().padStart(2, '0')}
          </strong>
        </p>
        <p style={{ margin: '1rem 0', fontSize: '0.875rem', color: '#666' }}>
          You will be automatically logged out due to inactivity.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={onExtendSession}
            className={styles.button}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Stay Logged In
          </button>
          <button
            type="button"
            onClick={onLogout}
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Logout Now
          </button>
        </div>
      </dialog>
    </div>
  );
};
