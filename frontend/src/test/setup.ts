import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { vi } from 'vitest';
import { AuthProvider, useAuth, AuthContext } from './test-utils';

// Mock the auth context module
vi.mock('../contexts/AuthContext', () => ({
  AuthProvider,
  useAuth,
  AuthContext
}));

// Mock API handlers
export const handlers = [
  // Auth API mocks
  http.post('http://localhost:3000/api/auth/login', () => {
    return HttpResponse.json({
      token: 'test-token',
      user: {
        id: '1',
        email: 'admin@example.com',
        role: { name: 'ADMIN' }
      }
    });
  }),
  http.post('http://localhost:3000/api/auth/register', () => {
    return HttpResponse.json({
      token: 'test-token',
      user: {
        id: '1',
        email: 'admin@example.com',
        role: { name: 'ADMIN' }
      }
    });
  }),

  // User API mocks
  http.get('http://localhost:3000/api/users', () => {
    return HttpResponse.json({
      data: {
        users: [
          {
            id: '1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            role: { name: 'CAREGIVER' },
            shifts: [
              {
                id: '1',
                date: '2024-03-20',
                startTime: '2024-03-20T09:00:00Z',
                endTime: '2024-03-20T17:00:00Z',
                status: 'completed',
                client: {
                  name: 'Client A',
                  address: '123 Main St'
                },
                visits: [
                  {
                    type: 'START',
                    timestamp: '2024-03-20T09:00:00Z'
                  },
                  {
                    type: 'END',
                    timestamp: '2024-03-20T17:00:00Z'
                  }
                ]
              }
            ]
          }
        ],
        total: 1,
        page: 1,
        limit: 10
      }
    });
  }),
  http.get('http://localhost:3000/api/roles', () => {
    return HttpResponse.json([
      { id: '1', name: 'ADMIN' },
      { id: '2', name: 'CAREGIVER' }
    ]);
  })
];

// Setup MSW server
const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Close server after all tests
afterAll(() => server.close()); 