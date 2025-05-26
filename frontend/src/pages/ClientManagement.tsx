import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navbar } from '../components/Navbar';
import { clientApi } from '../lib/api';
import classNames from 'classnames';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface Client {
  id: string;
  name: string;
  address: string;
  shifts: Array<{
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    clientId: string;
    caregiverId: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

interface AddClientFormData {
  name: string;
  address: string;
}

export const ClientManagement = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<AddClientFormData>({
    name: '',
    address: '',
  });
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const clientsPerPage = 5;

  const { data: response, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientApi.getClients(),
  });

  // Extract clients from the response structure
  const clients = response?.clients || [];

  // Filter clients by search
  const filteredClients = clients.filter((client: Client) =>
    client.name.toLowerCase().includes(search.toLowerCase()) ||
    client.address.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredClients.length / clientsPerPage);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * clientsPerPage,
    currentPage * clientsPerPage
  );

  const addClientMutation = useMutation({
    mutationFn: (data: AddClientFormData) => clientApi.addClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setShowAddForm(false);
      setFormData({
        name: '',
        address: '',
      });
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to add client');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    addClientMutation.mutate(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-extrabold text-gray-900">Client Management</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold shadow hover:bg-blue-700 transition text-base"
          >
            <span className="hidden sm:inline">Add New Client</span>
            <span className="sm:hidden">+</span>
          </button>
        </div>
        <div className="relative flex justify-between items-center mb-4">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or address..."
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
            <h2 className="text-2xl font-bold mb-6 text-gray-900 border-b pb-2">Add New Client</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition disabled:opacity-50 px-4 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition disabled:opacity-50 px-4 py-2"
                  required
                  autoComplete="off"
                />
                <span className="text-xs text-gray-400 mt-1 block">Start typing for address suggestions</span>
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
                  disabled={addClientMutation.isPending}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {addClientMutation.isPending ? 'Adding...' : 'Add Client'}
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
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Shifts</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedClients.map((client: Client, idx: number) => (
                  <tr key={client.id} className={idx % 2 === 0 ? 'bg-gray-50 hover:bg-blue-50 transition' : 'bg-white hover:bg-blue-50 transition'}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{client.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{client.address}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{client.shifts.length} shifts</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={classNames(
                          'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold',
                          {
                            'bg-yellow-100 text-yellow-800 border border-yellow-200': client.shifts[0]?.status === 'pending',
                            'bg-green-100 text-green-800 border border-green-200': client.shifts[0]?.status === 'active',
                            'bg-red-100 text-red-800 border border-red-200': client.shifts[0]?.status === 'cancelled' || client.shifts[0]?.status === 'inactive',
                            'bg-gray-100 text-gray-800 border border-gray-200': !client.shifts[0]?.status,
                          }
                        )}
                      >
                        {client.shifts[0]?.status ? client.shifts[0].status.charAt(0).toUpperCase() + client.shifts[0].status.slice(1) : 'No shifts'}
                      </span>
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
    </div>
  );
}; 