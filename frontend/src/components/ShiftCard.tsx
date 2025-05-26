import { useState } from 'react';
import type { Shift, VisitLog } from '../types/auth';

interface ShiftCardProps {
  shift: Shift;
  onVisitStart: (shiftId: string, latitude: number, longitude: number) => Promise<{ visitLog: VisitLog }>;
  onVisitEnd: (shiftId: string, latitude: number, longitude: number) => Promise<{ visitLog: VisitLog }>;
}

export const ShiftCard = ({ shift, onVisitStart, onVisitEnd }: ShiftCardProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVisitAction = async (action: 'start' | 'end') => {
    setIsLoading(true);
    setError(null);

    try {
      // Get current position
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;

      if (action === 'start') {
        await onVisitStart(shift.id, latitude, longitude);
      } else {
        await onVisitEnd(shift.id, latitude, longitude);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log visit');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">{shift.clientName}</h2>
          <p className="text-gray-600 mt-1">{shift.address}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-800 font-medium">{shift.date}</p>
          <p className="text-gray-600">
            {shift.startTime} - {shift.endTime}
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="mt-6 space-x-4">
        <button
          onClick={() => handleVisitAction('start')}
          disabled={isLoading}
          className="btn btn-primary"
        >
          {isLoading ? 'Loading...' : 'Start Visit'}
        </button>
        
        <button
          onClick={() => handleVisitAction('end')}
          disabled={isLoading}
          className="btn btn-danger"
        >
          {isLoading ? 'Loading...' : 'End Visit'}
        </button>
      </div>
    </div>
  );
}; 