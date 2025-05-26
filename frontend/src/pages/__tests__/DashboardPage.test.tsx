import { render, screen } from '@testing-library/react';
import { DashboardPage } from '../DashboardPage';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

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

describe('DashboardPage', () => {
  it('renders the dashboard navbar and shift list', () => {
    renderWithRouter(<DashboardPage />);
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('shift-list')).toBeInTheDocument();
  });
}); 