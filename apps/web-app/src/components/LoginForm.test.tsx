import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthContext } from '../context/AuthContext';
import { LoginForm } from './LoginForm';

// Mock the AuthContext
const mockLogin = vi.fn();
const mockContextValue = {
  user: null,
  token: null,
  login: mockLogin,
  register: vi.fn(),
  logout: vi.fn(),
  loading: false,
};

const LoginFormWithMockContext = ({ onSuccess }: { onSuccess?: () => void }) => (
  <AuthContext.Provider value={mockContextValue}>
    <LoginForm onSuccess={onSuccess} />
  </AuthContext.Provider>
);

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form with all required fields', () => {
    render(<LoginFormWithMockContext />);

    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('displays demo credentials hint', () => {
    render(<LoginFormWithMockContext />);

    expect(screen.getByText(/demo credentials:/i)).toBeInTheDocument();
    expect(screen.getByText(/admin@example.com \/ password/i)).toBeInTheDocument();
  });

  it('handles user input correctly', async () => {
    const user = userEvent.setup();
    render(<LoginFormWithMockContext />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'testpassword');

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('testpassword');
  });

  it('calls login function on form submission', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(undefined);

    render(<LoginFormWithMockContext />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    await user.type(emailInput, 'admin@example.com');
    await user.type(passwordInput, 'password');
    await user.click(loginButton);

    expect(mockLogin).toHaveBeenCalledWith('admin@example.com', 'password');
  });

  it('displays loading state during login', async () => {
    const user = userEvent.setup();
    // Mock login to never resolve (simulating loading state)
    mockLogin.mockImplementation(() => new Promise((resolve) => {
      // This promise intentionally never resolves to test loading state
      setTimeout(() => resolve(undefined), 10000);
    }));

    render(<LoginFormWithMockContext />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    await user.type(emailInput, 'admin@example.com');
    await user.type(passwordInput, 'password');
    await user.click(loginButton);

    expect(screen.getByText(/logging in.../i)).toBeInTheDocument();
    expect(loginButton).toBeDisabled();
  });

  it('displays error message on login failure', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));

    render(<LoginFormWithMockContext />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    await user.type(emailInput, 'wrong@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('calls onSuccess callback on successful login', async () => {
    const user = userEvent.setup();
    const mockOnSuccess = vi.fn();
    mockLogin.mockResolvedValue(undefined);

    render(<LoginFormWithMockContext onSuccess={mockOnSuccess} />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    await user.type(emailInput, 'admin@example.com');
    await user.type(passwordInput, 'password');
    await user.click(loginButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('requires email and password fields', () => {
    render(<LoginFormWithMockContext />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });

  it('has correct input types', () => {
    render(<LoginFormWithMockContext />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    expect(emailInput).toHaveAttribute('type', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
