import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import * as styles from '../styles/theme.css';
import { getApiUrl, isLocalOnlyMode } from '../utils/api-url';
import { localAuth } from '../utils/local-auth';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
}

export const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const { token, logout } = useContext(AuthContext);

  const fetchProfile = React.useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      // Use local auth for GitHub Pages, API for development
      if (isLocalOnlyMode()) {
        const userData = await localAuth.getProfile();
        setProfile(userData);
        setName(userData.name);
      } else {
        // Original API logic for development
        const response = await fetch(`${getApiUrl()}/api/users/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        setProfile(data.user);
        setName(data.user.name);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !profile) return;

    setUpdateLoading(true);
    setError('');

    try {
      // Use local auth for GitHub Pages, API for development
      if (isLocalOnlyMode()) {
        const updatedUser = await localAuth.updateProfile({ name });
        setProfile(updatedUser);
        setIsEditing(false);
      } else {
        // Original API logic for development
        const response = await fetch(`${getApiUrl()}/api/users/profile`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name }),
        });

        if (!response.ok) {
          throw new Error('Failed to update profile');
        }

        const data = await response.json();
        setProfile(data.user);
        setIsEditing(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setUpdateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.container}>
        <div className={styles.featureCard}>
          <h1 style={{ marginBottom: '1rem' }}>Profile</h1>
          {error && <div className={styles.errorMessage}>{error}</div>}
          <p>Failed to load profile. Please try again.</p>
          <button
            className={styles.button}
            onClick={fetchProfile}
            style={{ marginTop: '1rem' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.featureCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1>User Profile</h1>
          <button
            className={styles.secondaryButton}
            onClick={logout}
            style={{ fontSize: '0.875rem' }}
          >
            Logout
          </button>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        {!isEditing ? (
          <div>
            <div className={styles.formGroup}>
              <div className={styles.label} style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Email
              </div>
              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '0.375rem',
                  color: '#6c757d'
                }}
              >
                {profile.email}
              </div>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.label} style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Full Name</div>
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '0.375rem'
              }}>
                {profile.name}
              </div>
            </div>

            {profile.createdAt && (
              <div className={styles.formGroup}>
                <div className={styles.label} style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Member Since</div>
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '0.375rem',
                  color: '#6c757d'
                }}>
                  {new Date(profile.createdAt).toLocaleDateString()}
                </div>
              </div>
            )}

            <button
              className={styles.button}
              onClick={() => setIsEditing(true)}
              style={{ marginTop: '1rem' }}
            >
              Edit Profile
            </button>
          </div>
        ) : (
          <form onSubmit={handleUpdateProfile}>
            <div className={styles.formGroup}>
              <div className={styles.label} style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Email</div>
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '0.375rem',
                color: '#6c757d'
              }}>
                {profile.email} (cannot be changed)
              </div>
            </div>

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

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button
                className={styles.button}
                type="submit"
                disabled={updateLoading}
                style={{ flex: 1 }}
              >
                {updateLoading ? 'Updating...' : 'Save Changes'}
              </button>
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setName(profile.name);
                  setError('');
                }}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
