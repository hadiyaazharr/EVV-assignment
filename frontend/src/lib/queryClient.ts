import { QueryClient } from '@tanstack/react-query';

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// Query keys for type safety
export const queryKeys = {
  shifts: {
    all: ['shifts'] as const,
    list: () => [...queryKeys.shifts.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.shifts.all, 'detail', id] as const,
  },
  visits: {
    all: ['visits'] as const,
    list: () => [...queryKeys.visits.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.visits.all, 'detail', id] as const,
  },
} as const; 