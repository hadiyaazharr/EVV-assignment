export interface Location {
  latitude: number;
  longitude: number;
}

export interface VisitLog {
  id: string;
  shiftId: string;
  startTime: string;
  endTime?: string;
  startLocation: Location;
  endLocation?: Location;
  status: 'in_progress' | 'completed';
}

export interface Visit {
  id: string;
  type: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  shiftId: string;
  caregiverId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Shift {
  id: string;
  caregiverId: string;
  clientId: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  visits?: Visit[];
  caregiver?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role?: { id: string; name: string; description?: string };
  };
  client?: {
    id: string;
    name: string;
    address?: string;
  };
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'CAREGIVER' | 'CLIENT';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  firstName: string;
  lastName: string;
  roleId: string;
} 