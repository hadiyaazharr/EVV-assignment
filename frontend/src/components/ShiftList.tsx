import React, { useState } from 'react';
import { useShifts, useLogVisitStart, useLogVisitEnd, useBatchVisitLogs } from '../lib/hooks';
import { withErrorBoundary } from './ErrorBoundary';
import { useAuth } from '../contexts/AuthContext';
import type { Shift } from '../types/auth';
import { clientApi } from '../lib/api';
import { useQuery } from '@tanstack/react-query';
import classNames from 'classnames';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

const LocationErrorModal = ({ open, onClose, message }: { open: boolean, onClose: () => void, message: string }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full">
        <h2 className="text-lg font-bold mb-2 text-red-600">Location Required</h2>
        <p className="mb-4 text-gray-700">{message}</p>
        <button
          onClick={onClose}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
        >
          Close
        </button>
      </div>
    </div>
  );
};

const VisitLogsModal = ({ open, onClose, visits }: { open: boolean, onClose: () => void, visits: any[] }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white p-6 rounded-xl shadow-xl max-w-2xl w-full">
        <h2 className="text-lg font-bold mb-4 text-blue-700">Visit Logs</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Type</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Timestamp</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Latitude</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Longitude</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {visits.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-2 whitespace-nowrap text-gray-900">{log.type}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-gray-900">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-gray-900">{log.latitude}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-gray-900">{log.longitude}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          onClick={onClose}
          className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
        >
          Close
        </button>
      </div>
    </div>
  );
};

const ShiftList: React.FC = () => {
  const { user } = useAuth();

  // For admin, fetch all caregiver shifts
  const isAdmin = user?.role === 'ADMIN';
  const { data: shiftsData, isLoading, error, refetch } = isAdmin
    ? useQuery({
        queryKey: ['allCaregiverShifts'],
        queryFn: () => clientApi.getAllCaregiverShifts(),
      })
    : useShifts();
  const logVisitStart = useLogVisitStart();
  const logVisitEnd = useLogVisitEnd();
  const batchVisitLogs = useBatchVisitLogs();
  const [showAddShift, setShowAddShift] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // shiftId for which action is loading
  const [geoError, setGeoError] = useState<string | null>(null);
  const [showGeoModal, setShowGeoModal] = useState(false);

  // Admin table enhancements
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const shiftsPerPage = 5;

  // New state for Visit Logs modal
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [selectedVisits, setSelectedVisits] = useState<any[]>([]);

  const handleVisitStart = async (shiftId: string) => {
    try {
      // Get current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      await logVisitStart.mutateAsync({
        shiftId,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch (error) {
      console.error('Failed to start visit:', error);
    }
  };

  const handleVisitEnd = async (shiftId: string) => {
    try {
      // Get current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      await logVisitEnd.mutateAsync({
        shiftId,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch (error) {
      console.error('Failed to end visit:', error);
    }
  };

  const handleBatchVisits = async (shifts: Shift[]) => {
    try {
      // Get current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const logs = shifts.map(shift => ({
        shiftId: shift.id,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        type: shift.status === 'pending' ? 'start' : 'end',
      } as const));

      await batchVisitLogs.mutateAsync(logs);
    } catch (error) {
      console.error('Failed to batch process visits:', error);
    }
  };

  // AddShift form/modal (simple inline for now)
  const AddShiftForm = () => {
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [clientId, setClientId] = useState('');
    const [caregiverId, setCaregiverId] = useState(user?.id || '');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Fetch all clients
    const { data: clientsData, isLoading: clientsLoading } = useQuery({
      queryKey: ['clients'],
      queryFn: () => clientApi.getClients(),
    });
    const clients = clientsData?.clients || [];

    // Fetch all users for caregivers (admin only)
    const { data: usersData, isLoading: usersLoading } = useQuery({
      queryKey: ['users'],
      queryFn: () => clientApi.getUsers(),
      enabled: user?.role === 'ADMIN',
    });
    const caregivers = (usersData?.users || []).filter((u: any) => u.role?.name === 'CAREGIVER');

    const handleAddShift = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSuccess(null);
      setLoading(true);
      try {
        let res;
        if (user?.role === 'ADMIN') {
          // Admin: POST to /api/shifts/caregivers with only date, clientId, caregiverId
          res = await fetch('http://localhost:3000/api/shifts/caregivers', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({
              caregiverId,
              clientId,
              date,
            }),
          });
        } else {
          // Caregiver: POST to /api/caregiver/shifts
          res = await fetch('http://localhost:3000/api/caregiver/shifts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({
              caregiverId: user?.id,
              clientId,
              startTime,
              endTime,
            }),
          });
        }
        if (!res.ok) throw new Error('Failed to add shift');
        setSuccess('Shift added!');
        setShowAddShift(false);
        window.location.reload(); // Or refetch shifts
      } catch (err: any) {
        setError(err.message || 'Failed to add shift');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
        <form onSubmit={handleAddShift} className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full relative">
          <h3 className="font-bold mb-4 text-lg">Add Shift</h3>
          {user?.role === 'ADMIN' && (
            <>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Caregiver</label>
                <select
                  value={caregiverId}
                  onChange={e => setCaregiverId(e.target.value)}
                  className="w-full border rounded px-2 py-2"
                  required
                  disabled={usersLoading}
                >
                  <option value="">Select a caregiver</option>
                  {caregivers.map((cg: any) => (
                    <option key={cg.id} value={cg.id}>{cg.firstName} {cg.lastName}</option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Client</label>
                <select
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  className="w-full border rounded px-2 py-2"
                  required
                  disabled={clientsLoading}
                >
                  <option value="">Select a client</option>
                  {clients.map((cl: any) => (
                    <option key={cl.id} value={cl.id}>{cl.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border rounded px-2 py-2" required />
              </div>
            </>
          )}
          {user?.role === 'CAREGIVER' && (
            <>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Client</label>
                <select
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  className="w-full border rounded px-2 py-2"
                  required
                  disabled={clientsLoading}
                >
                  <option value="">Select a client</option>
                  {clients.map((cl: any) => (
                    <option key={cl.id} value={cl.id}>{cl.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Start Time</label>
                <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full border rounded px-2 py-2" required />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">End Time</label>
                <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full border rounded px-2 py-2" required />
              </div>
            </>
          )}
          {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
          {success && <div className="text-green-600 text-sm mb-2">{success}</div>}
          <div className="flex gap-2 justify-end mt-4">
            <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">Add</button>
            <button type="button" onClick={() => setShowAddShift(false)} className="px-4 py-2 rounded border">Cancel</button>
          </div>
        </form>
      </div>
    );
  };

  // Show all shifts for admin, only own for caregiver
  let visibleShifts: Shift[] = shiftsData?.shifts || [];
  if (user?.role === 'CAREGIVER') {
    visibleShifts = visibleShifts.filter(shift => shift.caregiverId === user.id);
  }

  // Filtering and search for admin
  const filteredShifts = visibleShifts.filter(shift => {
    const matchesStatus = statusFilter ? shift.status === statusFilter : true;
    const searchLower = search.toLowerCase();
    const matchesSearch =
      (shift.clientId?.toLowerCase().includes(searchLower)) ||
      (shift.caregiverId?.toLowerCase().includes(searchLower)) ||
      (shift.client?.name?.toLowerCase().includes(searchLower)) ||
      (shift.caregiver?.firstName?.toLowerCase().includes(searchLower)) ||
      (shift.caregiver?.lastName?.toLowerCase().includes(searchLower));
    return matchesStatus && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredShifts.length / shiftsPerPage);
  const paginatedShifts = filteredShifts.slice(
    (currentPage - 1) * shiftsPerPage,
    currentPage * shiftsPerPage
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4">
        <p className="text-red-600">Failed to load shifts</p>
        <button
          onClick={() => refetch()}
          className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!error && visibleShifts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-center text-gray-600 mb-4">No shifts assigned yet.</div>
        {(user?.role === 'CAREGIVER' || user?.role === 'ADMIN') && (
          <button onClick={() => setShowAddShift(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add Shift</button>
        )}
        {showAddShift && <AddShiftForm />}
      </div>
    );
  }

  // Per-row visit logging with geolocation
  const handleVisit = async (type: 'start' | 'end', shiftId: string) => {
    setGeoError(null);
    setActionLoading(shiftId + '-' + type);
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser');
      setShowGeoModal(true);
      setActionLoading(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          if (type === 'start') {
            await logVisitStart.mutateAsync({ shiftId, latitude, longitude });
          } else {
            await logVisitEnd.mutateAsync({ shiftId, latitude, longitude });
          }
          refetch();
        } catch (err: any) {
          toast.error(
            (err && typeof err === 'object' && 'message' in err && err.message) ||
            (typeof err === 'string' ? err : JSON.stringify(err)) ||
            'Failed to log visit'
          );
        } finally {
          setActionLoading(null);
        }
      },
      (error) => {
        setGeoError('Location access is required to log your visit. Please allow location access in your browser settings.');
        setShowGeoModal(true);
        setActionLoading(null);
      }
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">{user?.role === 'ADMIN' ? "All Caregivers' Shifts" : "Today's Shifts"}</h1>
        {user?.role === 'ADMIN' && (
          <button onClick={() => setShowAddShift(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add Shift</button>
        )}
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <div className="relative w-full sm:w-1/3">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by client or caregiver ID..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:border-blue-300 bg-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full sm:w-48 border border-gray-300 rounded-lg shadow-sm px-3 py-2 bg-white focus:outline-none focus:ring focus:border-blue-300"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <LocationErrorModal
        open={showGeoModal}
        onClose={() => setShowGeoModal(false)}
        message={geoError || ''}
      />
      <div className="overflow-x-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Caregiver</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Visit Logs</th>
                {user?.role === 'CAREGIVER' && (
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedShifts.map((shift, idx) => (
                <tr key={shift.id} className={idx % 2 === 0 ? 'bg-gray-50 hover:bg-blue-50 transition' : 'bg-white hover:bg-blue-50 transition'}>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">{shift.caregiver ? `${shift.caregiver.firstName} ${shift.caregiver.lastName}` : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">{shift.client ? shift.client.name : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">{
                    shift.startTime && shift.endTime
                      ? `${new Date(shift.startTime).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' })}, ${new Date(shift.startTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} - ${new Date(shift.endTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
                      : shift.startTime
                        ? `${new Date(shift.startTime).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' })}, ${new Date(shift.startTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
                        : '-'
                  }</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={classNames(
                      'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold',
                      {
                        'bg-yellow-100 text-yellow-800 border border-yellow-200': shift.status === 'pending',
                        'bg-blue-100 text-blue-800 border border-blue-200': shift.status === 'in_progress',
                        'bg-green-100 text-green-800 border border-green-200': shift.status === 'completed',
                        'bg-red-100 text-red-800 border border-red-200': shift.status === 'cancelled',
                        'bg-gray-100 text-gray-800 border border-gray-200': !shift.status,
                      }
                    )}>
                      {shift.status ? shift.status.charAt(0).toUpperCase() + shift.status.slice(1).replace('_', ' ') : 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {shift.visits && shift.visits.length > 0 ? (
                      <>
                        <button
                          onClick={() => { setSelectedVisits(shift.visits || []); setShowVisitModal(true); }}
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-xs font-semibold"
                        >
                          Details
                        </button>
                      </>
                    ) : (
                      <span className="text-gray-400">No logs</span>
                    )}
                  </td>
                  {user?.role === 'CAREGIVER' && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      {!shift.startTime && (
                        <button
                          onClick={() => handleVisit('start', shift.id)}
                          disabled={actionLoading === shift.id + '-start'}
                          className="btn btn-primary mr-2 disabled:opacity-50"
                        >
                          {actionLoading === shift.id + '-start' ? 'Starting...' : 'Start Visit'}
                        </button>
                      )}
                      {shift.startTime && !shift.endTime && (
                        <button
                          onClick={() => handleVisit('end', shift.id)}
                          disabled={actionLoading === shift.id + '-end'}
                          className="btn btn-danger disabled:opacity-50"
                        >
                          {actionLoading === shift.id + '-end' ? 'Ending...' : 'End Visit'}
                        </button>
                      )}
                      {shift.startTime && shift.endTime && (
                        <span className="text-green-600 font-semibold">Visit Completed</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-gray-50 border-t gap-2 mt-2">
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
      {showAddShift && <AddShiftForm />}
      <VisitLogsModal open={showVisitModal} onClose={() => setShowVisitModal(false)} visits={selectedVisits} />
    </div>
  );
};

export default withErrorBoundary(ShiftList); 