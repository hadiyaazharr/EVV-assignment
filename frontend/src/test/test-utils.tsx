import { createContext, type ReactNode } from 'react';
import { vi } from 'vitest';

// Create a mock auth context
const mockAuthContext = {
  user: {
    id: '1',
    email: 'admin@example.com',
    role: { name: 'ADMIN' }
  },
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn()
};

// Create a mock AuthContext
const AuthContext = createContext(mockAuthContext);

// Mock the AuthProvider component
const AuthProvider = ({ children }: { children: ReactNode }) => {
  return (
    <AuthContext.Provider value={mockAuthContext}>
      {children}
    </AuthContext.Provider>
  );
};

// Mock the useAuth hook
const useAuth = () => mockAuthContext;

// Export the mock components and hooks
export { AuthProvider, useAuth, AuthContext, mockAuthContext }; 