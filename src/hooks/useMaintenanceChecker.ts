import { useEffect, useRef } from 'react';
import { useBikes } from './useBikes';
import { useNotificationStore } from '../stores/useNotificationStore';
import { supabase } from '../lib/supabaseClient';
import { apexToast } from '../lib/toast';
import type { MaintenanceLog } from '../types/database';

const SERVICE_INTERVAL_KM = 5000;

export function useMaintenanceChecker() {
  const { bikes, isLoading } = useBikes();
  const { addNotification, notifications } = useNotificationStore();
  const checkedBikesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (isLoading || bikes.length === 0) return;

    const checkMaintenance = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all maintenance logs for user's bikes
      const bikeIds = bikes.map((bike) => bike.id);
      const { data: maintenanceLogs, error } = await supabase
        .from('maintenance_logs')
        .select('*')
        .in('bike_id', bikeIds)
        .eq('user_id', user.id)
        .order('odo_at_service', { ascending: false });

      if (error) {
        console.error('Error fetching maintenance logs:', error);
        return;
      }

      // Check each bike
      for (const bike of bikes) {
        // Find the most recent maintenance log for this bike
        const lastService = (maintenanceLogs as MaintenanceLog[] | null)?.find(
          (log) => log.bike_id === bike.id
        );

        // Calculate km since last service
        const odoAtLastService = lastService?.odo_at_service || 0;
        const kmSinceService = bike.current_odo - odoAtLastService;

        // If current_odo - odo_at_service > 5000, generate alert
        if (kmSinceService > SERVICE_INTERVAL_KM) {
          const bikeName = bike.nick_name || `${bike.make} ${bike.model}`;
          const notificationKey = `maintenance-${bike.id}`;

          // Check if we've already checked this bike in this session
          if (checkedBikesRef.current.has(notificationKey)) {
            continue;
          }

          // Check if notification already exists in store
          const existingNotification = notifications.find(
            (notif) => notif.bike_id === bike.id && notif.type === 'warning'
          );

          if (!existingNotification) {
            // Mark as checked
            checkedBikesRef.current.add(notificationKey);

            // Add to notification store
            addNotification({
              type: 'warning',
              message: `${bikeName} requires service (${kmSinceService.toLocaleString()} km since last service)`,
              read_status: false,
              bike_id: bike.id,
            });

            // Show toast
            apexToast.error(`Maintenance Required: ${bikeName}`);
          }
        }
      }
    };

    checkMaintenance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bikes, isLoading]);
}

