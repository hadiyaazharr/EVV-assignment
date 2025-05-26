import { render, screen } from '@testing-library/react';
import { LoginPage } from '../LoginPage';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';

// Minimal mock for AuthContext to avoid window usage
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: () => Promise.resolve(),
    isAuthenticated: false,
    loading: false,
    user: null,
  }),
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('LoginPage', () => {
  it('renders the login form', () => {
    renderWithRouter(<LoginPage />);
    expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
}); 