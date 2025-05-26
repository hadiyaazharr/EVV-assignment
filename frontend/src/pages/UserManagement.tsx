import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '../components/Navbar';
import { clientApi, getRoles } from '../lib/api';
import classNames from 'classnames';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: { name: string } | null;
  shifts: Array<{
    id: string;
    date: string;
    startTime: string | null;
    endTime: string | null;
    status: string;
    client: {
      name: string;
      address: string;
    };
    visits: Array<{
      type: string;
      timestamp: string;
    }>;
  }>;
}

interface Role {
  id: string;
  name: string;
}

interface UserFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId: string;
}

interface ShiftDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

const ShiftDetailsModal = ({ isOpen, onClose, user }: ShiftDetailsModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Shifts for {user.firstName} {user.lastName}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 focus:outline-none text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-8rem)]">
          {user.shifts && user.shifts.length > 0 ? (
            <div className="space-y-6">
              {user.shifts.map((shift) => (
                <div key={shift.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {new Date(shift.date).toLocaleDateString()}
                      </h3>
                      <p className="text-gray-600">Client: {shift.client.name}</p>
                      <p className="text-gray-600">Address: {shift.client.address}</p>
                    </div>
                    <span className={classNames(
                      'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                      {
                        'bg-yellow-100 text-yellow-800': shift.status === 'pending',
                        'bg-green-100 text-green-800': shift.status === 'completed',
                        'bg-red-100 text-red-800': shift.status === 'cancelled'
                      }
                    )}>
                      {shift.status}
                    </span>
                  </div>
                  
                  {shift.startTime && (
                    <div className="text-sm text-gray-600 mb-2">
                      Start: {new Date(shift.startTime).toLocaleTimeString()}
                    </div>
                  )}
                  {shift.endTime && (
                    <div className="text-sm text-gray-600 mb-2">
                      End: {new Date(shift.endTime).toLocaleTimeString()}
                    </div>
                  )}
                  
                  {shift.visits.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Visits:</h4>
                      <div className="space-y-2">
                        {shift.visits.map((visit) => (
                          <div key={visit.timestamp} className="flex items-center text-sm">
                            <span className={classNames(
                              'inline-flex items-center px-2 py-1 rounded text-xs font-medium mr-2',
                              {
                                'bg-blue-100 text-blue-800': visit.type === 'START',
                                'bg-purple-100 text-purple-800': visit.type === 'END'
                              }
                            )}>
                              {visit.type}
                            </span>
                            <span className="text-gray-600">
                              {new Date(visit.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No shifts assigned to this user
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const UserManagement = () => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    roleId: '',
  });
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => clientApi.getUsers(),
  });

  const users = response?.users || [];

  // Filter users by search
  const filteredUsers = users.filter((user: User) =>
    (user.firstName ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (user.lastName ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (user.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
    ((user.role?.name ?? '').toLowerCase().includes(search.toLowerCase()))
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  // Fetch roles for dropdown
  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
  });
  const roles: Role[] = rolesData || [];

  // Add user mutation
  const addUserMutation = useMutation({
    mutationFn: clientApi.addUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowAddForm(false);
      setFormData({ email: '', password: '', firstName: '', lastName: '', roleId: '' });
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to add user');
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    addUserMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-extrabold text-gray-900">User Management</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold shadow hover:bg-blue-700 transition text-base"
          >
            <span className="hidden sm:inline">Add New User</span>
            <span className="sm:hidden">+</span>
          </button>
        </div>
        <div className="relative flex justify-between items-center mb-4">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-1/3 pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:border-blue-300 bg-white"
          />
        </div>
        {showAddForm && (
          <div className="relative max-w-lg mx-auto bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-200">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 focus:outline-none text-2xl font-bold"
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold mb-6 text-gray-900 border-b pb-2">Add New User</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition px-4 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition px-4 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition px-4 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition px-4 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  name="roleId"
                  value={formData.roleId}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition px-4 py-2"
                  required
                  disabled={rolesLoading}
                >
                  <option value="">Select a role</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
              {error && (
                <div className="text-red-600 text-sm font-medium bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</div>
              )}
              <div className="flex justify-end space-x-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addUserMutation.isPending}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {addUserMutation.isPending ? 'Adding...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        )}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">First Name</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Last Name</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedUsers.map((user: User, idx: number) => (
                  <tr key={user.id} className={idx % 2 === 0 ? 'bg-gray-50 hover:bg-blue-50 transition' : 'bg-white hover:bg-blue-50 transition'}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{user.firstName}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{user.lastName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={classNames(
                          'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold',
                          {
                            'bg-blue-100 text-blue-800 border border-blue-200': user.role?.name === 'ADMIN',
                            'bg-green-100 text-green-800 border border-green-200': user.role?.name === 'CAREGIVER',
                            'bg-gray-100 text-gray-800 border border-gray-200': !user.role?.name,
                          }
                        )}
                      >
                        {user.role?.name || 'No Role'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        View Shifts
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-gray-50 border-t gap-2">
              <span className="text-sm text-gray-600 mb-2 sm:mb-0">
                Page {currentPage} of {totalPages || 1}
              </span>
              <div className="space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-lg border border-gray-300 bg-white text-gray-700 disabled:opacity-50 font-semibold"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={classNames(
                      'px-3 py-1 rounded-lg border font-semibold',
                      currentPage === i + 1
                        ? 'bg-blue-600 text-white border-blue-600 shadow'
                        : 'bg-white text-gray-700 border-gray-300'
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-3 py-1 rounded-lg border border-gray-300 bg-white text-gray-700 disabled:opacity-50 font-semibold"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <ShiftDetailsModal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        user={selectedUser!}
      />
    </div>
  );
}; 