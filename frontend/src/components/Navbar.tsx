import { useAuth } from '../contexts/AuthContext';
import { useNavigate, NavLink } from 'react-router-dom';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

export const Navbar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="w-full bg-white/90 backdrop-blur border-b border-gray-200 px-6 py-3 flex justify-between items-center shadow-sm rounded-b-xl">
      <div className="flex items-center space-x-8">
        <NavLink
          to="/"
          className="font-extrabold text-xl tracking-tight text-blue-900 hover:text-blue-700 transition"
          title="Go to Dashboard"
        >
          EVV Logger
        </NavLink>
        {user?.role === 'ADMIN' && (
          <>
            <NavLink
              to="/clients"
              className={({ isActive }) =>
                `transition px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 shadow'
                    : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50'
                }`
              }
            >
              Clients
            </NavLink>
            <NavLink
              to="/users"
              className={({ isActive }) =>
                `transition px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 shadow'
                    : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50'
                }`
              }
            >
              Users
            </NavLink>
          </>
        )}
      </div>
      {user && (
        <div className="flex items-center space-x-6">
          <span className="text-gray-700 font-medium hidden sm:inline">Welcome, {user.firstName}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-red-700 transition"
            title="Logout"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      )}
    </nav>
  );
}; 