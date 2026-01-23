import { useState, useCallback } from 'react';
import { Plus, Motorbike, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBikes } from '../hooks/useBikes';
import { useFuelLogs } from '../hooks/useFuelLogs';
import LoadingSpinner from '../components/LoadingSpinner';
import AddBikeModal from '../components/AddBikeModal';
import AddRefuelModal from '../components/AddRefuelModal';
import FuelLogList from '../components/FuelLogList';
import ConfirmModal from '../components/ConfirmModal';
import ApexTelemetryIcon from '../components/ui/ApexTelemetryIcon';
import PullToRefreshIndicator from '../components/PullToRefreshIndicator';
import type { Bike as BikeType, FuelLog } from '../types/database';
import { apexToast } from '../lib/toast';
import { motion } from 'framer-motion';
import { containerVariants, itemVariants, fastItemVariants, buttonHoverProps, cardHoverProps } from '../lib/animations';
import { useThemeColors } from '../hooks/useThemeColors';
import { logger } from '../lib/logger';
import { useQueryClient } from '@tanstack/react-query';
import { usePullToRefresh } from '../hooks/usePullToRefresh';

// Helper component for bike image with fallback
function BikeImage({ 
  imageUrl, 
  alt, 
  size = 64, 
  className = '' 
}: { 
  imageUrl?: string | null; 
  alt: string; 
  size?: number;
  className?: string;
}) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const hasError = !!imageUrl && failedImageUrl === imageUrl;

  if (!imageUrl || hasError) {
    return <ApexTelemetryIcon size={size} static className={className} />;
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={`object-cover rounded-lg border border-apex-white/20 ${className}`}
      style={{ width: size, height: size }}
      onError={(e) => {
        logger.error('Failed to load bike image', {
          imageUrl,
          imgSrc: (e.target as HTMLImageElement).src,
        });
        setFailedImageUrl(imageUrl ?? null);
      }}
    />
  );
}

export default function Garage() {
  const navigate = useNavigate();
  const { primary } = useThemeColors();
  const { bikes, isLoading, createBike, updateBike, deleteBike, getBikeRelatedDataCounts } = useBikes();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBike, setEditingBike] = useState<BikeType | null>(null);
  
  const [selectedBikeForFuel, setSelectedBikeForFuel] =
    useState<BikeType | null>(null);
  const [isFuelViewOpen, setIsFuelViewOpen] = useState(false);
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [editingFuelLog, setEditingFuelLog] = useState<FuelLog | null>(null);
  
  const [bikeToDelete, setBikeToDelete] = useState<BikeType | null>(null);
  const [relatedDataCounts, setRelatedDataCounts] = useState<{
    rides: number;
    maintenanceLogs: number;
    fuelLogs: number;
  } | null>(null);
  const [isLoadingRelatedData, setIsLoadingRelatedData] = useState(false);

  const { fuelLogs, isLoading: fuelLogsLoading, createFuelLog, updateFuelLog, deleteFuelLog } =
    useFuelLogs(selectedBikeForFuel?.id);

  const handleAddBike = async (bikeData: Omit<BikeType, 'id' | 'user_id' | 'created_at'>) => {
    await createBike.mutateAsync(bikeData);
  };

  const handleUpdateBike = async (
    bikeData: Omit<BikeType, 'id' | 'user_id' | 'created_at'>
  ) => {
    if (editingBike) {
      await updateBike.mutateAsync({
        id: editingBike.id,
        updates: bikeData,
      });
      setEditingBike(null);
    }
  };

  const handleEditBike = (bike: BikeType) => {
    setEditingBike(bike);
    setIsModalOpen(true);
  };

  const handleDeleteBike = async (id: string) => {
    try {
      await deleteBike.mutateAsync(id);
      apexToast.success('Bike deleted');
      setBikeToDelete(null);
    } catch (error) {
      apexToast.error(
        error instanceof Error ? error.message : 'Failed to delete bike'
      );
      throw error;
    }
  };

  const handleDeleteClick = async (bike: BikeType) => {
    setBikeToDelete(bike);
    setIsLoadingRelatedData(true);
    setRelatedDataCounts(null);
    
    try {
      const counts = await getBikeRelatedDataCounts(bike.id);
      setRelatedDataCounts(counts);
    } catch (error) {
      logger.error('Error fetching related data counts:', error);
      // Set empty counts on error so modal can still show
      setRelatedDataCounts({ rides: 0, maintenanceLogs: 0, fuelLogs: 0 });
    } finally {
      setIsLoadingRelatedData(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBike(null);
  };

  const handleViewMaintenance = (bike: BikeType) => {
    navigate(`/service/${bike.id}`);
  };

  const handleViewFuel = (bike: BikeType) => {
    setSelectedBikeForFuel(bike);
    setIsFuelViewOpen(true);
  };

  const handleCloseFuelView = () => {
    setIsFuelViewOpen(false);
    setSelectedBikeForFuel(null);
    setEditingFuelLog(null);
  };

  const handleAddFuelLog = async (
    logData: Omit<FuelLog, 'id' | 'created_at'>
  ) => {
    await createFuelLog.mutateAsync(logData);
  };

  const handleUpdateFuelLog = async (
    logData: Omit<FuelLog, 'id' | 'created_at'>
  ) => {
    if (editingFuelLog) {
      await updateFuelLog.mutateAsync({
        id: editingFuelLog.id,
        updates: logData,
      });
      setEditingFuelLog(null);
    }
  };

  const handleEditFuelLog = (log: FuelLog) => {
    setEditingFuelLog(log);
    setIsFuelViewOpen(false);
    setIsFuelModalOpen(true);
  };

  const handleDeleteFuelLog = async (id: string) => {
    try {
      await deleteFuelLog.mutateAsync(id);
    } catch (error) {
      logger.error('Failed to delete fuel log', error);
    }
  };

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['bikes'] }),
      queryClient.invalidateQueries({ queryKey: ['fuelLogs'] }),
    ]);
  }, [queryClient]);

  const { pullDistance, isRefreshing } = usePullToRefresh({
    onRefresh: handleRefresh,
    logLabel: 'garage',
  });

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading garage..." />;
  }

  const currentBike = bikes.length > 0 ? bikes[0] : null;
  const otherBikes = bikes.slice(1);

  return (
    <div className="h-full">
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        accentColor={primary}
      />
      <motion.div
        className="p-6 pb-32 space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Page Header with Logo */}

        {bikes.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-16 text-center"
            variants={itemVariants}
          >
            <div className="p-4 bg-gradient-to-br from-white/5 to-transparent border border-apex-white/20 rounded-apex mb-4">
              <Motorbike size={48} style={{ color: primary }} />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              No bikes yet
            </h2>
            <p className="text-white/60 mb-6 max-w-md">
              Add your first machine to start tracking rides and maintenance.
            </p>
            <motion.button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-apex-black"
              style={{ backgroundColor: primary }}
              {...buttonHoverProps}
            >
              <Plus size={20} />
              Add your first machine
            </motion.button>
          </motion.div>
        ) : (
          <>
            {/* Hero Card - Current Bike */}
            {currentBike && (
              <motion.div
                className="bg-gradient-to-br from-white/5 to-transparent rounded-apex p-6 border border-apex-white/20"
                variants={itemVariants}
                {...cardHoverProps}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-sm text-white/60 uppercase tracking-wide mb-2">
                      Current Bike
                    </h2>
                    <h3 className="text-2xl font-semibold text-white mb-1">
                      {currentBike.nick_name || `${currentBike.make} ${currentBike.model}`}
                    </h3>
                    {currentBike.nick_name && (
                      <p className="text-sm text-white/40">
                        {currentBike.make} {currentBike.model}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">
                    <BikeImage
                      imageUrl={currentBike.image_url}
                      alt={currentBike.nick_name || `${currentBike.make} ${currentBike.model}`}
                      size={64}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-white/60 mb-1">Odometer</p>
                    <p className="text-xl font-mono font-bold text-white">
                      {currentBike.current_odo.toLocaleString()} km
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-white/60 mb-1">Year</p>
                    <p className="text-xl font-mono font-bold text-white">
                      {currentBike.year || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap justify-start gap-2 mx-auto max-w-fit">
                  <motion.button
                    onClick={() => handleViewMaintenance(currentBike)}
                    className="px-3 py-2 bg-apex-white/10 border border-apex-white/20 rounded-lg text-apex-white text-xs hover:bg-apex-white/20 transition-colors whitespace-nowrap"
                    {...buttonHoverProps}
                  >
                    Maintenance
                  </motion.button>
                  <motion.button
                    onClick={() => handleViewFuel(currentBike)}
                    className="px-3 py-2 bg-apex-white/10 border border-apex-white/20 rounded-lg text-apex-white text-xs hover:bg-apex-white/20 transition-colors whitespace-nowrap"
                    {...buttonHoverProps}
                  >
                    Fuel
                  </motion.button>
                  <motion.button
                    onClick={() => handleEditBike(currentBike)}
                    className="px-3 py-2 bg-apex-white/10 border border-apex-white/20 rounded-lg text-apex-white text-xs hover:bg-apex-white/20 transition-colors whitespace-nowrap"
                    {...buttonHoverProps}
                  >
                    Edit
                  </motion.button>
                  <motion.button
                    onClick={() => handleDeleteClick(currentBike)}
                    className="px-3 py-2 bg-apex-red/20 border border-apex-red/30 rounded-lg text-apex-red text-xs hover:bg-apex-red/30 transition-colors whitespace-nowrap"
                    {...buttonHoverProps}
                  >
                    Delete
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Other Bikes Grid */}
            {otherBikes.length > 0 && (
              <motion.div
                className="grid grid-cols-2 md:grid-cols-3 gap-4"
                variants={containerVariants}
              >
                {otherBikes.map((bike) => (
                  <motion.div
                    key={bike.id}
                    className="bg-gradient-to-br from-white/5 to-transparent rounded-apex p-5 border border-apex-white/20"
                    variants={fastItemVariants}
                    {...cardHoverProps}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white truncate">
                          {bike.nick_name || `${bike.make} ${bike.model}`}
                        </h3>
                        {bike.nick_name && (
                          <p className="text-xs text-white/40 truncate">
                            {bike.make} {bike.model}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 ml-2">
                        <BikeImage
                          imageUrl={bike.image_url}
                          alt={bike.nick_name || `${bike.make} ${bike.model}`}
                          size={48}
                        />
                      </div>
                    </div>
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-white/60">Odometer</span>
                        <span className="text-sm font-mono font-semibold text-white">
                          {bike.current_odo.toLocaleString()} km
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-white/60">Year</span>
                        <span className="text-sm font-mono text-white">
                          {bike.year || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-start gap-2 mx-auto max-w-fit">
                      <motion.button
                        onClick={() => handleViewMaintenance(bike)}
                        className="px-2 py-1.5 bg-apex-white/10 border border-apex-white/20 rounded-lg text-apex-white text-xs hover:bg-apex-white/20 transition-colors whitespace-nowrap"
                        {...buttonHoverProps}
                      >
                        Maint
                      </motion.button>
                      <motion.button
                        onClick={() => handleViewFuel(bike)}
                        className="px-2 py-1.5 bg-apex-white/10 border border-apex-white/20 rounded-lg text-apex-white text-xs hover:bg-apex-white/20 transition-colors whitespace-nowrap"
                        {...buttonHoverProps}
                      >
                        Fuel
                      </motion.button>
                      <motion.button
                        onClick={() => handleEditBike(bike)}
                        className="px-2 py-1.5 bg-apex-white/10 border border-apex-white/20 rounded-lg text-apex-white text-xs hover:bg-apex-white/20 transition-colors whitespace-nowrap"
                        {...buttonHoverProps}
                      >
                        Edit
                      </motion.button>
                      <motion.button
                        onClick={() => handleDeleteClick(bike)}
                        className="px-2 py-1.5 bg-apex-red/20 border border-apex-red/30 rounded-lg text-apex-red text-xs hover:bg-apex-red/30 transition-colors whitespace-nowrap"
                        {...buttonHoverProps}
                      >
                        Delete
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Add Bike Button */}
            <motion.div
              className="flex justify-center"
              variants={itemVariants}
            >
              <motion.button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-apex-black"
                style={{ backgroundColor: primary }}
                {...buttonHoverProps}
              >
                <Plus size={20} />
                Add Bike
              </motion.button>
            </motion.div>
          </>
        )}

        <AddBikeModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={editingBike ? handleUpdateBike : handleAddBike}
          editingBike={editingBike}
        />

        {/* Delete Confirmation Modal */}
        {bikeToDelete && (
          <ConfirmModal
            isOpen={!!bikeToDelete}
            onClose={() => {
              setBikeToDelete(null);
              setRelatedDataCounts(null);
            }}
            onConfirm={() => bikeToDelete && handleDeleteBike(bikeToDelete.id)}
            title="Delete Bike"
            message={
              <div className="space-y-3">
                <p>
                  Are you sure you want to delete{' '}
                  <strong>{bikeToDelete.nick_name || `${bikeToDelete.make} ${bikeToDelete.model}`}</strong>?
                </p>
                
                {isLoadingRelatedData ? (
                  <div className="flex items-center gap-2 text-apex-white/60">
                    <LoadingSpinner size="sm" />
                    <span>Checking related data...</span>
                  </div>
                ) : relatedDataCounts ? (
                  <>
                    {(relatedDataCounts.rides > 0 || 
                      relatedDataCounts.maintenanceLogs > 0 || 
                      relatedDataCounts.fuelLogs > 0) && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-apex-white/80">
                          This will permanently delete:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-apex-white/70 ml-2">
                          {relatedDataCounts.rides > 0 && (
                            <li className="text-apex-red">
                              {relatedDataCounts.rides} ride(s) with GPS data
                            </li>
                          )}
                          {relatedDataCounts.maintenanceLogs > 0 && (
                            <li>{relatedDataCounts.maintenanceLogs} maintenance log(s)</li>
                          )}
                          {relatedDataCounts.fuelLogs > 0 && (
                            <li>{relatedDataCounts.fuelLogs} fuel log(s)</li>
                          )}
                        </ul>
                        {relatedDataCounts.rides > 0 && (
                          <div className="mt-3 p-3 bg-apex-red/10 border border-apex-red/20 rounded-lg">
                            <p className="text-apex-red text-sm font-semibold">
                              Cannot delete: This bike has rides with GPS data. Please delete rides first.
                            </p>
                          </div>
                        )}
                        {relatedDataCounts.rides === 0 &&
                          (relatedDataCounts.maintenanceLogs > 0 ||
                            relatedDataCounts.fuelLogs > 0) && (
                          <p className="text-sm text-apex-white/70">
                            Maintenance and fuel logs will be removed with this bike.
                          </p>
                        )}
                      </div>
                    )}
                    {relatedDataCounts.rides === 0 && 
                     relatedDataCounts.maintenanceLogs === 0 && 
                     relatedDataCounts.fuelLogs === 0 && (
                      <p className="text-sm text-apex-white/60">
                        No related data found. Safe to delete.
                      </p>
                    )}
                  </>
                ) : null}
                
                <p className="text-sm text-apex-white/80 mt-4">
                  This action cannot be undone.
                </p>
              </div>
            }
            confirmLabel="Delete"
            cancelLabel="Cancel"
            variant="danger"
            isLoading={deleteBike.isPending || isLoadingRelatedData}
            disabled={
              isLoadingRelatedData ||
              (relatedDataCounts ? relatedDataCounts.rides > 0 : false)
            }
          />
        )}

        {/* Fuel Logs View Modal */}
        {selectedBikeForFuel && isFuelViewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-apex-black/80 backdrop-blur-sm"
              onClick={handleCloseFuelView}
            />
            <div className="relative bg-apex-black border border-apex-white/20 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-apex-white">
                    Fuel Logs
                  </h2>
                  <p className="text-sm text-apex-white/60 mt-1">
                    {selectedBikeForFuel.nick_name ||
                      `${selectedBikeForFuel.make} ${selectedBikeForFuel.model}`}
                  </p>
                  {selectedBikeForFuel.avg_mileage && (
                    <p className="text-xs text-apex-green mt-2 font-mono">
                      Avg. Mileage: {selectedBikeForFuel.avg_mileage.toFixed(2)} km/L
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={() => {
                      setEditingFuelLog(null);
                      setIsFuelViewOpen(false);
                      setIsFuelModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold bg-apex-green text-apex-black hover:bg-apex-green/90 transition-colors"
                    {...buttonHoverProps}
                  >
                    <Plus size={18} />
                    Add Refuel
                  </motion.button>
                  <motion.button
                    onClick={handleCloseFuelView}
                    className="p-2 text-apex-white/60 hover:text-apex-white transition-colors"
                    aria-label="Close"
                    {...buttonHoverProps}
                  >
                    <X size={24} />
                  </motion.button>
                </div>
              </div>

              <FuelLogList
                logs={fuelLogs}
                bike={selectedBikeForFuel}
                onEdit={handleEditFuelLog}
                onDelete={handleDeleteFuelLog}
                isLoading={fuelLogsLoading}
              />
            </div>
          </div>
        )}

        {/* Add/Edit Fuel Log Modal */}
        {selectedBikeForFuel && (
          <AddRefuelModal
            isOpen={isFuelModalOpen}
            onClose={() => {
              setIsFuelModalOpen(false);
              setEditingFuelLog(null);
              setIsFuelViewOpen(true);
            }}
            onSubmit={
              editingFuelLog ? handleUpdateFuelLog : handleAddFuelLog
            }
            editingLog={editingFuelLog}
            bike={selectedBikeForFuel}
          />
        )}
      </motion.div>
    </div>
  );
}
