import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wrench } from 'lucide-react';
import { motion } from 'framer-motion';
import { useBikes } from '../hooks/useBikes';
import { useMaintenanceSchedules } from '../hooks/useMaintenanceSchedules';
import HealthCard from '../components/HealthCard';
import CompleteServiceModal from '../components/CompleteServiceModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { containerVariants, itemVariants, buttonHoverProps } from '../lib/animations';
import { logger } from '../lib/logger';

export default function Service() {
  const { bikeId } = useParams<{ bikeId: string }>();
  const navigate = useNavigate();
  const { bikes, isLoading: bikesLoading } = useBikes();
  const {
    schedules,
    isLoading: schedulesLoading,
    completeService,
  } = useMaintenanceSchedules(bikeId);

  const [selectedSchedule, setSelectedSchedule] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (bikesLoading || schedulesLoading) {
    return <LoadingSpinner fullScreen text="Loading maintenance..." />;
  }

  if (!bikeId) {
    return (
      <div className="h-full bg-apex-black flex items-center justify-center">
        <p className="text-apex-white/60">No bike selected</p>
      </div>
    );
  }

  const bike = bikes.find((b) => b.id === bikeId);

  if (!bike) {
    return (
      <div className="h-full bg-apex-black flex items-center justify-center">
        <p className="text-apex-white/60">Bike not found</p>
      </div>
    );
  }

  const handleCompleteService = (scheduleId: string) => {
    setSelectedSchedule(scheduleId);
    setIsModalOpen(true);
  };

  const handleSubmitService = async (data: {
    scheduleId: string;
    bikeId: string;
    serviceOdo: number;
    cost?: number;
    notes?: string;
  }) => {
    try {
      await completeService.mutateAsync(data);
    } catch (error) {
      logger.error('Error completing service:', error);
      throw error; // Re-throw to let modal handle it
    }
  };

  const schedule = selectedSchedule
    ? schedules.find((s) => s.id === selectedSchedule)
    : null;

  return (
    <div className="h-full bg-apex-black">
      <motion.div
        className="p-6 pb-32 space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div
          className="flex items-center gap-4"
          variants={itemVariants}
        >
          <motion.button
            onClick={() => navigate(-1)}
            className="p-2 text-apex-white/60 hover:text-apex-white transition-colors"
            {...buttonHoverProps}
          >
            <ArrowLeft size={24} />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-apex-white">
              Maintenance Health Monitor
            </h1>
            <p className="text-sm text-apex-white/60 mt-1">
              {bike.nick_name || `${bike.make} ${bike.model}`}
            </p>
          </div>
        </motion.div>

        {/* Health Cards Grid */}
        {schedules.length === 0 ? (
          <motion.div
            className="text-center py-16"
            variants={itemVariants}
          >
            <div className="p-4 bg-apex-white/5 rounded-lg inline-block mb-4">
              <Wrench size={48} className="text-apex-white/20" />
            </div>
            <p className="text-apex-white/60 text-sm">
              No maintenance schedules found
            </p>
            <p className="text-apex-white/40 text-xs mt-1">
              Default schedules should be created automatically when you add a bike
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            variants={containerVariants}
          >
            {schedules.map((schedule) => (
              <HealthCard
                key={schedule.id}
                schedule={schedule}
                bike={bike}
                onCompleteService={() => handleCompleteService(schedule.id)}
              />
            ))}
          </motion.div>
        )}

        {/* Complete Service Modal */}
        {schedule && (
          <CompleteServiceModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedSchedule(null);
            }}
            schedule={schedule}
            bike={bike}
            onComplete={handleSubmitService}
          />
        )}
      </motion.div>
    </div>
  );
}
