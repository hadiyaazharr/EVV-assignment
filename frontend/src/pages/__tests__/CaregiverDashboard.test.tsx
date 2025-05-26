import { render, screen } from '@testing-library/react';
import { CaregiverDashboard } from '../CaregiverDashboard';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

// Mock AuthContext to avoid window usage
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '2', role: 'CAREGIVER', email: 'caregiver@example.com' },
  }),
}));

// Mock Navbar and ShiftList to avoid rendering unrelated components
vi.mock('../../components/Navbar', () => ({
  Navbar: () => <div data-testid="navbar" />,
}));
vi.mock('../../components/ShiftList', () => ({
  __esModule: true,
  default: () => <div data-testid="shift-list" />,
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('CaregiverDashboard', () => {
  it('renders the caregiver dashboard heading', () => {
    renderWithRouter(<CaregiverDashboard />);
    expect(screen.getByText(/caregiver dashboard/i)).toBeInTheDocument();
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('shift-list')).toBeInTheDocument();
  });
}); 