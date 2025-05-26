import { useMutation, useQuery } from '@tanstack/react-query';
import { caregiverApi } from './api';
import { queryClient, queryKeys } from './queryClient';
import type { Shift, VisitLog } from '../types/auth';
import { toast } from 'react-toastify';

// Hook for fetching shifts with deduplication
export const useShifts = () => {
  return useQuery({
    queryKey: queryKeys.shifts.list(),
    queryFn: async () => {
      try {
        const result = await caregiverApi.getShifts();
        return result ?? { shifts: [] };
      } catch {
        return { shifts: [] };
      }
    },
    // Deduplicate requests within 5 seconds
    staleTime: 5000,
  });
};

// Hook for logging visit start with optimistic updates
export const useLogVisitStart = () => {
  return useMutation({
    mutationFn: async ({ shiftId, latitude, longitude }: { shiftId: string; latitude: number; longitude: number }) => {
      const result = await caregiverApi.logVisitStart(shiftId, latitude, longitude);
      return result;
    },
    onMutate: async ({ shiftId, latitude, longitude }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.shifts.list() });

      // Snapshot the previous value
      const previousShifts = queryClient.getQueryData(queryKeys.shifts.list());

      // Optimistically update the shifts
      queryClient.setQueryData(queryKeys.shifts.list(), (old: { shifts: Shift[] } | undefined) => {
        if (!old) return old;
        return {
          shifts: old.shifts.map(shift =>
            shift.id === shiftId
              ? {
                  ...shift,
                  status: 'in_progress',
                  visitLogs: [
                    ...(shift.visitLogs || []),
                    {
                      id: 'temp-' + Date.now(),
                      shiftId,
                      startTime: new Date().toISOString(),
                      startLocation: { latitude, longitude },
                      status: 'in_progress',
                    },
                  ],
                }
              : shift
          ),
        };
      });

      return { previousShifts };
    },
    onError: (err, newShift, context) => {
      // Rollback on error
      if (context?.previousShifts) {
        queryClient.setQueryData(queryKeys.shifts.list(), context.previousShifts);
      }
      // Show toast
      toast.error(
        (err && typeof err === 'object' && 'message' in err && err.message) ||
        (typeof err === 'string' ? err : JSON.stringify(err)) ||
        'Failed to log visit'
      );
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.shifts.list() });
    },
  });
};

// Hook for logging visit end with optimistic updates
export const useLogVisitEnd = () => {
  return useMutation({
    mutationFn: async ({ shiftId, latitude, longitude }: { shiftId: string; latitude: number; longitude: number }) => {
      const result = await caregiverApi.logVisitEnd(shiftId, latitude, longitude);
      return result;
    },
    onMutate: async ({ shiftId, latitude, longitude }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.shifts.list() });

      // Snapshot the previous value
      const previousShifts = queryClient.getQueryData(queryKeys.shifts.list());

      // Optimistically update the shifts
      queryClient.setQueryData(queryKeys.shifts.list(), (old: { shifts: Shift[] } | undefined) => {
        if (!old) return old;
        return {
          shifts: old.shifts.map(shift =>
            shift.id === shiftId
              ? {
                  ...shift,
                  status: 'completed',
                  visitLogs: shift.visitLogs?.map(log =>
                    log.status === 'in_progress'
                      ? {
                          ...log,
                          endTime: new Date().toISOString(),
                          endLocation: { latitude, longitude },
                          status: 'completed',
                        }
                      : log
                  ),
                }
              : shift
          ),
        };
      });

      return { previousShifts };
    },
    onError: (err, newShift, context) => {
      // Rollback on error
      if (context?.previousShifts) {
        queryClient.setQueryData(queryKeys.shifts.list(), context.previousShifts);
      }
      // Show toast
      toast.error(
        (err && typeof err === 'object' && 'message' in err && err.message) ||
        (typeof err === 'string' ? err : JSON.stringify(err)) ||
        'Failed to log visit'
      );
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.shifts.list() });
    },
  });
};

// Hook for batch logging visits with optimistic updates
export const useBatchVisitLogs = () => {
  return useMutation({
    mutationFn: async (logs: Array<{ shiftId: string; latitude: number; longitude: number; type: 'start' | 'end' }>) => {
      const result = await caregiverApi.batchVisitLogs(logs);
      return result;
    },
    onMutate: async (logs) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.shifts.list() });

      // Snapshot the previous value
      const previousShifts = queryClient.getQueryData(queryKeys.shifts.list());

      // Optimistically update the shifts
      queryClient.setQueryData(queryKeys.shifts.list(), (old: { shifts: Shift[] } | undefined) => {
        if (!old) return old;
        return {
          shifts: old.shifts.map(shift => {
            const shiftLogs = logs.filter(log => log.shiftId === shift.id);
            if (shiftLogs.length === 0) return shift;

            const updatedLogs = [...(shift.visitLogs || [])];
            shiftLogs.forEach(log => {
              if (log.type === 'start') {
                updatedLogs.push({
                  id: 'temp-' + Date.now(),
                  shiftId: log.shiftId,
                  startTime: new Date().toISOString(),
                  startLocation: { latitude: log.latitude, longitude: log.longitude },
                  status: 'in_progress',
                });
              } else {
                const lastLog = updatedLogs[updatedLogs.length - 1];
                if (lastLog && lastLog.status === 'in_progress') {
                  lastLog.endTime = new Date().toISOString();
                  lastLog.endLocation = { latitude: log.latitude, longitude: log.longitude };
                  lastLog.status = 'completed';
                }
              }
            });

            return {
              ...shift,
              status: shiftLogs.some(log => log.type === 'end') ? 'completed' : 'in_progress',
              visitLogs: updatedLogs,
            };
          }),
        };
      });

      return { previousShifts };
    },
    onError: (err, newLogs, context) => {
      // Rollback on error
      if (context?.previousShifts) {
        queryClient.setQueryData(queryKeys.shifts.list(), context.previousShifts);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.shifts.list() });
    },
  });
}; 