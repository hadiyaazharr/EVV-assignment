import { render, screen } from '@testing-library/react';
import { UserManagement } from '../UserManagement';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock clientApi.getUsers and getRoles to avoid network and window errors
vi.mock('../../lib/api', () => ({
  clientApi: {
    getUsers: () => Promise.resolve({ users: [] }),
    addUser: () => Promise.resolve(),
  },
  getRoles: () => Promise.resolve([]),
}));

// Mock Navbar to avoid rendering unrelated components
vi.mock('../../components/Navbar', () => ({
  Navbar: () => <div data-testid="navbar" />,
}));

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('UserManagement', () => {
  it('renders the user management heading and table', async () => {
    renderWithProviders(<UserManagement />);
    expect(screen.getByText(/user management/i)).toBeInTheDocument();
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    // Wait for the table to appear
    expect(await screen.findByRole('table')).toBeInTheDocument();
  });
}); 