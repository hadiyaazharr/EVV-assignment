import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { CaregiverDashboard } from './pages/CaregiverDashboard';
import { ClientManagement } from './pages/ClientManagement';
import { UserManagement } from './pages/UserManagement';
import { queryClient } from './lib/queryClient';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const RoleBasedRoute = () => {
  const { user } = useAuth();
  
  if (user?.role === 'ADMIN') {
    return <AdminDashboard />;
  } else if (user?.role === 'CAREGIVER') {
    return <CaregiverDashboard />;
  }
  
  // If role is not recognized, redirect to login
  return <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/clients"
        element={
          <PrivateRoute>
            <AdminRoute>
              <ClientManagement />
            </AdminRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/users"
        element={
          <PrivateRoute>
            <AdminRoute>
              <UserManagement />
            </AdminRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <RoleBasedRoute />
          </PrivateRoute>
        }
      />
    </Routes>
  );
};

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
        <ToastContainer position="top-right" autoClose={4000} />
      </AuthProvider>
    </QueryClientProvider>
  );
};
