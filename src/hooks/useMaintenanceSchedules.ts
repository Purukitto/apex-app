import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import type { MaintenanceSchedule, ServiceHistory } from '../types/database';
import { logger } from '../lib/logger';
import { apexToast } from '../lib/toast';
import { scheduleMaintenanceNotification } from '../lib/notifications';

export function useMaintenanceSchedules(bikeId?: string) {
  const queryClient = useQueryClient();

  // Fetch maintenance schedules for a specific bike or all bikes
  const { data: schedules, isLoading, error } = useQuery({
    queryKey: ['maintenanceSchedules', bikeId],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('maintenance_schedules')
        .select('*')
        .eq('is_active', true)
        .order('part_name', { ascending: true });

      // If bikeId is provided, filter by bike
      if (bikeId) {
        query = query.eq('bike_id', bikeId);
      } else {
        // Otherwise, get schedules for all user's bikes
        const { data: bikes } = await supabase
          .from('bikes')
          .select('id')
          .eq('user_id', user.id);

        if (bikes && bikes.length > 0) {
          const bikeIds = bikes.map((b) => b.id);
          query = query.in('bike_id', bikeIds);
        } else {
          return [];
        }
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;
      return (data as MaintenanceSchedule[]) || [];
    },
    enabled: !!bikeId || true,
  });

  // Create a new maintenance schedule
  const createSchedule = useMutation({
    mutationFn: async (
      scheduleData: Omit<MaintenanceSchedule, 'id' | 'created_at'>
    ) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Verify the bike belongs to the user
      const { data: bike, error: bikeError } = await supabase
        .from('bikes')
        .select('id')
        .eq('id', scheduleData.bike_id)
        .eq('user_id', user.id)
        .single();

      if (bikeError || !bike) {
        throw new Error('Bike not found or you do not have permission');
      }

      const { error } = await supabase
        .from('maintenance_schedules')
        .insert(scheduleData);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceSchedules'] });
      apexToast.success('Maintenance schedule added');
    },
    onError: (error) => {
      logger.error('Error creating maintenance schedule:', error);
      apexToast.error('Failed to add maintenance schedule');
    },
  });

  // Update a maintenance schedule
  const updateSchedule = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<MaintenanceSchedule, 'id' | 'bike_id' | 'created_at'>>;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Verify the schedule's bike belongs to the user
      const { data: schedule } = await supabase
        .from('maintenance_schedules')
        .select('bike_id')
        .eq('id', id)
        .single();

      if (!schedule) throw new Error('Maintenance schedule not found');

      const { data: bike } = await supabase
        .from('bikes')
        .select('id')
        .eq('id', schedule.bike_id)
        .eq('user_id', user.id)
        .single();

      if (!bike) {
        throw new Error('You do not have permission to update this schedule');
      }

      const { error } = await supabase
        .from('maintenance_schedules')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceSchedules'] });
      apexToast.success('Schedule updated');
    },
    onError: (error) => {
      logger.error('Error updating maintenance schedule:', error);
      apexToast.error('Failed to update schedule');
    },
  });

  // Complete a service (update schedule and create history entry)
  const completeService = useMutation({
    mutationFn: async ({
      scheduleId,
      bikeId,
      serviceOdo,
      cost,
      notes,
    }: {
      scheduleId: string;
      bikeId: string;
      serviceOdo: number;
      cost?: number;
      notes?: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Verify the bike belongs to the user
      const { data: bikeCheck, error: bikeError } = await supabase
        .from('bikes')
        .select('id')
        .eq('id', bikeId)
        .eq('user_id', user.id)
        .single();

      if (bikeError || !bikeCheck) {
        throw new Error('Bike not found or you do not have permission');
      }

      const serviceDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

      // Create service history entry
      const historyData: Omit<ServiceHistory, 'id' | 'created_at'> = {
        bike_id: bikeId,
        schedule_id: scheduleId,
        service_date: serviceDate,
        service_odo: serviceOdo,
        cost: cost,
        notes: notes,
      };

      const { error: historyError } = await supabase
        .from('service_history')
        .insert(historyData);

      if (historyError) throw historyError;

      // Update maintenance schedule with new last_service_date and last_service_odo
      const { error: scheduleError } = await supabase
        .from('maintenance_schedules')
        .update({
          last_service_date: serviceDate,
          last_service_odo: serviceOdo,
        })
        .eq('id', scheduleId);

      if (scheduleError) throw scheduleError;

      // Get schedule and bike info for notification scheduling
      const { data: schedule } = await supabase
        .from('maintenance_schedules')
        .select('part_name, interval_months')
        .eq('id', scheduleId)
        .single();

      const { data: bikeInfo } = await supabase
        .from('bikes')
        .select('nick_name, make, model')
        .eq('id', bikeId)
        .single();

      // Schedule time-based notification if interval_months > 0
      if (schedule && bikeInfo && schedule.interval_months > 0) {
        const notificationDate = new Date(serviceDate);
        notificationDate.setMonth(notificationDate.getMonth() + schedule.interval_months);

        const bikeName = bikeInfo.nick_name || `${bikeInfo.make} ${bikeInfo.model}`;
        
        try {
          await scheduleMaintenanceNotification(
            scheduleId,
            schedule.part_name,
            bikeName,
            notificationDate
          );
        } catch (notifError) {
          // Log but don't fail the service completion
          logger.warn('Failed to schedule notification:', notifError);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceSchedules'] });
      queryClient.invalidateQueries({ queryKey: ['serviceHistory'] });
      queryClient.invalidateQueries({ queryKey: ['bikes'] });
      apexToast.success('Service completed');
    },
    onError: (error) => {
      logger.error('Error completing service:', error);
      apexToast.error('Failed to complete service');
    },
  });

  return {
    schedules: schedules || [],
    isLoading,
    error,
    createSchedule,
    updateSchedule,
    completeService,
  };
}

/**
 * Initialize default maintenance schedules for a bike
 */
export async function initializeDefaultSchedules(bikeId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Verify the bike belongs to the user
  const { data: bike, error: bikeError } = await supabase
    .from('bikes')
    .select('id')
    .eq('id', bikeId)
    .eq('user_id', user.id)
    .single();

  if (bikeError || !bike) {
    throw new Error('Bike not found or you do not have permission');
  }

  // Check if schedules already exist for this bike
  const { data: existingSchedules } = await supabase
    .from('maintenance_schedules')
    .select('id')
    .eq('bike_id', bikeId);

  if (existingSchedules && existingSchedules.length > 0) {
    logger.debug('Default schedules already exist for bike:', bikeId);
    return; // Don't create duplicates
  }

  // Default schedules
  const defaultSchedules: Omit<MaintenanceSchedule, 'id' | 'created_at'>[] = [
    {
      bike_id: bikeId,
      part_name: 'Engine Oil',
      interval_km: 5000,
      interval_months: 6,
      is_active: true,
    },
    {
      bike_id: bikeId,
      part_name: 'Chain Lube',
      interval_km: 500,
      interval_months: 0,
      is_active: true,
    },
    {
      bike_id: bikeId,
      part_name: 'Chain Slack',
      interval_km: 1000,
      interval_months: 0,
      is_active: true,
    },
    {
      bike_id: bikeId,
      part_name: 'Insurance',
      interval_km: 0,
      interval_months: 12,
      is_active: true,
    },
  ];

  const { error } = await supabase
    .from('maintenance_schedules')
    .insert(defaultSchedules);

  if (error) {
    logger.error('Error initializing default schedules:', error);
    throw error;
  }

  logger.debug('Default maintenance schedules initialized for bike:', bikeId);
}
