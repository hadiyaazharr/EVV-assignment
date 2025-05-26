import { render, screen } from '@testing-library/react';
import { RegisterPage } from '../RegisterPage';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

// Minimal mock for AuthContext to avoid window usage
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    register: () => Promise.resolve(),
    isAuthenticated: false,
    loading: false,
    user: null,
  }),
}));

// Mock getRoles to avoid network and window errors
vi.mock('../../lib/api', () => ({
  getRoles: () => Promise.resolve([]),
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('RegisterPage', () => {
  it('renders the register form', () => {
    renderWithRouter(<RegisterPage />);
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });
}); 