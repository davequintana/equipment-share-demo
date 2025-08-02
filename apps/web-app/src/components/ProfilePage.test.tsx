import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthContext } from '../context/AuthContext';
import { ProfilePage } from './ProfilePage';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock the AuthContext
const mockLogout = vi.fn();
const mockContextValue = {
  user: { id: 1, email: 'john@example.com', name: 'John Doe' },
  token: 'fake-jwt-token',
  login: vi.fn(),
  register: vi.fn(),
  logout: mockLogout,
  loading: false,
};

const ProfilePageWithMockContext = () => (
  <AuthContext.Provider value={mockContextValue}>
    <ProfilePage />
  </AuthContext.Provider>
);

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for successful profile fetch
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        user: {
          id: 1,
          email: 'john@example.com',
          name: 'John Doe',
          createdAt: '2024-01-15T10:30:00.000Z'
        }
      })
    });
  });

  it('renders profile page with user information', async () => {
    render(<ProfilePageWithMockContext />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /user profile/i })).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText(/1\/15\/2024/)).toBeInTheDocument();
    });
  });

  it('fetches profile data on mount', async () => {
    render(<ProfilePageWithMockContext />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3333/api/users/profile', {
        headers: {
          'Authorization': 'Bearer fake-jwt-token',
          'Content-Type': 'application/json',
        },
      });
    });
  });

  it('displays loading state while fetching profile', () => {
    mockFetch.mockImplementation(() => new Promise(() => {
      // Never resolves to simulate loading state
    }));

    render(<ProfilePageWithMockContext />);

    expect(screen.getByText(/loading profile.../i)).toBeInTheDocument();
  });

  it('displays error message when profile fetch fails', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500
    });

    render(<ProfilePageWithMockContext />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load profile/i)).toBeInTheDocument();
    });
  });

  it('enters edit mode when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(<ProfilePageWithMockContext />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /edit profile/i }));

    await waitFor(() => {
      // Name should be editable (input field)
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      // Email should be read-only text with security message
      expect(screen.getByText('john@example.com (cannot be changed)')).toBeInTheDocument();
    });
  });

  it('allows editing name in edit mode', async () => {
    const user = userEvent.setup();
    render(<ProfilePageWithMockContext />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const editButton = screen.getByRole('button', { name: /edit profile/i });
    await user.click(editButton);

    // Only name should be editable
    const nameInput = screen.getByDisplayValue('John Doe');
    await user.clear(nameInput);
    await user.type(nameInput, 'Jane Doe');

    expect(nameInput).toHaveValue('Jane Doe');

    // Email should still be read-only
    expect(screen.getByText('john@example.com (cannot be changed)')).toBeInTheDocument();
  });

  it('saves changes when save button is clicked', async () => {
    const user = userEvent.setup();
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          user: {
            id: 1,
            email: 'john@example.com',
            name: 'John Doe',
            createdAt: '2024-01-15T10:30:00.000Z'
          }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          user: {
            id: 1,
            email: 'john@example.com', // Email should not change
            name: 'Jane Doe',
            createdAt: '2024-01-15T10:30:00.000Z'
          }
        })
      });

    render(<ProfilePageWithMockContext />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const editButton = screen.getByRole('button', { name: /edit profile/i });
    await user.click(editButton);

    // Only edit the name
    const nameInput = screen.getByDisplayValue('John Doe');
    await user.clear(nameInput);
    await user.type(nameInput, 'Jane Doe');

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3333/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer fake-jwt-token',
        },
        body: JSON.stringify({
          name: 'Jane Doe',
        }),
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument();
    });
  });

  it('cancels edit mode when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<ProfilePageWithMockContext />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const editButton = screen.getByRole('button', { name: /edit profile/i });
    await user.click(editButton);

    const nameInput = screen.getByDisplayValue('John Doe');
    await user.clear(nameInput);
    await user.type(nameInput, 'Different Name');

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    // After cancel, should be back in view mode
    expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument(); // Back to view mode text
    expect(screen.queryByDisplayValue('Different Name')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('John Doe')).not.toBeInTheDocument(); // No input field
  });

  it('displays error message when save fails', async () => {
    const user = userEvent.setup();
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          user: {
            id: 1,
            email: 'john@example.com',
            name: 'John Doe',
            createdAt: '2024-01-15T10:30:00.000Z'
          }
        })
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 400
      });

    render(<ProfilePageWithMockContext />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const editButton = screen.getByRole('button', { name: /edit profile/i });
    await user.click(editButton);

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to update profile/i)).toBeInTheDocument();
    });
  });

  it('displays saving state while updating profile', async () => {
    const user = userEvent.setup();
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          user: {
            id: 1,
            email: 'john@example.com',
            name: 'John Doe',
            createdAt: '2024-01-15T10:30:00.000Z'
          }
        })
      })
      .mockImplementationOnce(() => new Promise(() => {
        // Never resolves to simulate loading state
      })); // Never resolves

    render(<ProfilePageWithMockContext />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const editButton = screen.getByRole('button', { name: /edit profile/i });
    await user.click(editButton);

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    expect(screen.getByText(/updating.../i)).toBeInTheDocument();
    expect(saveButton).toBeDisabled();
  });

  it('calls logout when logout button is clicked', async () => {
    const user = userEvent.setup();
    render(<ProfilePageWithMockContext />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    await user.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
  });

  it('requires name field and shows email as read-only', async () => {
    const user = userEvent.setup();
    render(<ProfilePageWithMockContext />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const editButton = screen.getByRole('button', { name: /edit profile/i });
    await user.click(editButton);

    const nameInput = screen.getByDisplayValue('John Doe');

    // Name field should be required
    expect(nameInput).toBeRequired();
    expect(nameInput).toHaveAttribute('type', 'text');

    // Email should be read-only text, not an input
    expect(screen.getByText('john@example.com (cannot be changed)')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('john@example.com')).not.toBeInTheDocument();
  });

  it('handles network error during profile fetch', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    render(<ProfilePageWithMockContext />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load profile/i)).toBeInTheDocument();
    });
  });

  it('handles network error during profile save', async () => {
    const user = userEvent.setup();
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          user: {
            id: 1,
            email: 'john@example.com',
            name: 'John Doe',
            createdAt: '2024-01-15T10:30:00.000Z'
          }
        })
      })
      .mockRejectedValueOnce(new Error('Network error'));

    render(<ProfilePageWithMockContext />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const editButton = screen.getByRole('button', { name: /edit profile/i });
    await user.click(editButton);

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });
});
