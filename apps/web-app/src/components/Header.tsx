import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import * as styles from '../styles/theme.css';

export const Header: React.FC = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <div className={styles.logo}>
          Enterprise NX Monorepo
        </div>
        <ul className={styles.navLinks}>
          <li>
            <Link to="/" className={styles.navLink}>
              Home
            </Link>
          </li>
          {user ? (
            <>
              <li>
                <Link to="/profile" className={styles.navLink}>
                  Profile
                </Link>
              </li>
              <li>
                <span className={styles.navLink}>
                  Welcome, {user.name}
                </span>
              </li>
              <li>
                <button
                  onClick={logout}
                  className={styles.secondaryButton}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <li>
              <Link to="/login" className={styles.navLink}>
                Login
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
};
