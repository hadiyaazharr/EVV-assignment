import axios from 'axios';
import type { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { AuthResponse, LoginCredentials, RegisterCredentials, Shift, VisitLog } from '../types/auth';
import { queryClient, queryKeys } from './queryClient';
import { useNavigate } from 'react-router-dom';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout to prevent hanging requests
  timeout: 10000,
});

// Request queue for offline support with priority levels
type Priority = 'high' | 'medium' | 'low';
interface QueuedRequest {
  config: AxiosRequestConfig;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
  priority: Priority;
  timestamp: number;
}

const requestQueue: QueuedRequest[] = [];

// Process queued requests when online
window.addEventListener('online', () => {
  // Sort by priority and timestamp
  requestQueue.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return a.timestamp - b.timestamp;
  });

  while (requestQueue.length > 0) {
    const { config, resolve, reject } = requestQueue.shift()!;
    api(config).then(resolve).catch(reject);
  }
});

// Batch helper for multiple requests
const batchRequests = async <T>(requests: Promise<T>[]): Promise<T[]> => {
  return Promise.all(requests);
};

// Debounce helper
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Request interceptor for adding auth token and request ID
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Add request ID for tracking
  config.headers['X-Request-ID'] = crypto.randomUUID();
  
  // Log request
  console.log(`🚀 [${config.method?.toUpperCase()}] ${config.url}`, {
    headers: config.headers,
    data: config.data,
  });

  // Queue request if offline
  if (!navigator.onLine) {
    return new Promise((resolve, reject) => {
      const priority: Priority = config.url?.includes('/visits') ? 'high' : 'medium';
      requestQueue.push({
        config,
        resolve,
        reject,
        priority,
        timestamp: Date.now(),
      });
    });
  }
  
  return config;
});

// Response interceptor for handling errors and logging
api.interceptors.response.use(
  (response) => {
    // Log successful response
    console.log(`✅ [${response.config.method?.toUpperCase()}] ${response.config.url}`, {
      status: response.status,
      data: response.data,
    });
    return response.data;
  },
  async (error: AxiosError) => {
    // Log error response
    console.error(`❌ [${error.config?.method?.toUpperCase()}] ${error.config?.url}`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    // Handle unauthorized access
    if (error.response?.status === 401) {
      // Only treat as session expiration if it's not a login attempt
      if (!error.config?.url?.includes('/auth/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        return Promise.reject(new Error('Session expired. Please login again.'));
      }
      // For login attempts, pass through the original error message
      const errorMessage = error.response?.data && typeof error.response.data === 'object' && 'message' in error.response.data
        ? String(error.response.data.message)
        : 'Invalid credentials';
      return Promise.reject(new Error(errorMessage));
    }

    // Handle network errors with retry
    if (error.code === 'ECONNABORTED' || !error.response) {
      const config = error.config as AxiosRequestConfig & { _retry?: number };
      config._retry = (config._retry || 0) + 1;

      if (config._retry <= 3) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, config._retry - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return api(config);
      }
    }

    const errorMessage = error.response?.data && typeof error.response.data === 'object' && 'message' in error.response.data
      ? String(error.response.data.message)
      : 'An error occurred';

    return Promise.reject(new Error(errorMessage));
  }
);

// Helper function to create a cancel token
const createCancelToken = () => {
  const source = axios.CancelToken.source();
  return {
    token: source.token,
    cancel: source.cancel,
  };
};

// Cache helper
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCachedData = (key: string) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key: string, data: any) => {
  cache.set(key, { data, timestamp: Date.now() });
};

export const authApi = {
  async register(credentials: RegisterCredentials) {
    const { token, cancel } = createCancelToken();
    try {
      const response = await api.post('/auth/register', credentials, { cancelToken: token });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request cancelled:', error.message);
      }
      throw error;
    }
  },

  async login(credentials: LoginCredentials) {
    const { token, cancel } = createCancelToken();
    try {
      const response = await api.post('/auth/login', credentials, { cancelToken: token });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request cancelled:', error.message);
      }
      throw error;
    }
  },
};

export const caregiverApi = {
  async getShifts(): Promise<{ shifts: Shift[] }> {
    const { token, cancel } = createCancelToken();
    try {
      const response = await api.get<{ shifts: Shift[] }>('/caregiver/shifts', { cancelToken: token });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request cancelled:', error.message);
      }
      throw error;
    }
  },

  // Debounced visit logging to prevent rapid API calls
  logVisitStart: debounce(async (shiftId: string, latitude: number, longitude: number): Promise<{ visitLog: VisitLog }> => {
    const { token, cancel } = createCancelToken();
    try {
      const response = await api.post<{ visitLog: VisitLog }>('/visits/start', 
        { shiftId, latitude, longitude },
        { cancelToken: token }
      );
      // Invalidate shifts cache
      queryClient.invalidateQueries({ queryKey: queryKeys.shifts.list() });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request cancelled:', error.message);
      }
      throw error;
    }
  }, 1000),

  logVisitEnd: debounce(async (shiftId: string, latitude: number, longitude: number): Promise<{ visitLog: VisitLog }> => {
    const { token, cancel } = createCancelToken();
    try {
      const response = await api.post<{ visitLog: VisitLog }>('/visits/end',
        { shiftId, latitude, longitude },
        { cancelToken: token }
      );
      // Invalidate shifts cache
      queryClient.invalidateQueries({ queryKey: queryKeys.shifts.list() });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request cancelled:', error.message);
      }
      throw error;
    }
  }, 1000),

  // Batch multiple visit logs
  async batchVisitLogs(logs: Array<{ shiftId: string; latitude: number; longitude: number; type: 'start' | 'end' }>): Promise<{ visitLogs: VisitLog[] }> {
    const requests = logs.map(log => {
      const endpoint = log.type === 'start' ? '/caregiver/visits/start' : '/caregiver/visits/end';
      return api.post<{ visitLog: VisitLog }>(endpoint, {
        shiftId: log.shiftId,
        latitude: log.latitude,
        longitude: log.longitude,
      });
    });

    try {
      const responses = await batchRequests(requests);
      // Invalidate shifts cache
      queryClient.invalidateQueries({ queryKey: queryKeys.shifts.list() });
      return { visitLogs: responses.map(r => r.data.visitLog) };
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request cancelled:', error.message);
      }
      throw error;
    }
  },
};

export const getRoles = async () => {
  const response = await api.get('/roles');
  return response.data.roles || response.data.data.roles;
};

export const clientApi = {
  async getClients() {
    const { token, cancel } = createCancelToken();
    try {
      const response = await api.get('/clients', { cancelToken: token });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request cancelled:', error.message);
      }
      throw error;
    }
  },

  async addClient(data: {
    name: string;
    address: string;
  }) {
    const { token, cancel } = createCancelToken();
    try {
      const response = await api.post('/clients', data, { cancelToken: token });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request cancelled:', error.message);
      }
      throw error;
    }
  },

  async getUsers() {
    const { token, cancel } = createCancelToken();
    try {
      const response = await api.get('/users', { cancelToken: token });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request cancelled:', error.message);
      }
      throw error;
    }
  },

  async addUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    roleId: string;
  }) {
    const { token, cancel } = createCancelToken();
    try {
      const response = await api.post('/users', data, { cancelToken: token });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request cancelled:', error.message);
      }
      throw error;
    }
  },

  async getAllCaregiverShifts() {
    const { token, cancel } = createCancelToken();
    try {
      const response = await api.get('/shifts/caregivers', { cancelToken: token });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request cancelled:', error.message);
      }
      throw error;
    }
  },
}; 