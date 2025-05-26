import { render, screen } from '@testing-library/react';
import { ClientManagement } from '../ClientManagement';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock clientApi.getClients and addClient to avoid network and window errors
vi.mock('../../lib/api', () => ({
  clientApi: {
    getClients: () => Promise.resolve({ clients: [] }),
    addClient: () => Promise.resolve(),
  },
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

describe('ClientManagement', () => {
  it('renders the client management heading and table', async () => {
    renderWithProviders(<ClientManagement />);
    expect(screen.getByText(/client management/i)).toBeInTheDocument();
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    // Wait for the table to appear
    expect(await screen.findByRole('table')).toBeInTheDocument();
  });
}); 