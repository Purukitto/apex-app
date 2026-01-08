import { useState } from 'react';
import { Plus, Bike, Wrench, X } from 'lucide-react';
import { useBikes } from '../hooks/useBikes';
import { useMaintenanceLogs } from '../hooks/useMaintenanceLogs';
import BikeCard from '../components/BikeCard';
import AddBikeModal from '../components/AddBikeModal';
import MaintenanceLogModal from '../components/MaintenanceLogModal';
import MaintenanceLogList from '../components/MaintenanceLogList';
import type { Bike as BikeType, MaintenanceLog } from '../types/database';
import { apexToast } from '../lib/toast';
import { motion } from 'framer-motion';
import { containerVariants, itemVariants, buttonHoverProps } from '../lib/animations';

export default function Garage() {
  const { bikes, isLoading, createBike, updateBike, deleteBike } = useBikes();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBike, setEditingBike] = useState<BikeType | null>(null);
  const [selectedBikeForMaintenance, setSelectedBikeForMaintenance] =
    useState<BikeType | null>(null);
  const [isMaintenanceViewOpen, setIsMaintenanceViewOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<MaintenanceLog | null>(null);

  const { maintenanceLogs, isLoading: logsLoading, createMaintenanceLog, updateMaintenanceLog, deleteMaintenanceLog } =
    useMaintenanceLogs(selectedBikeForMaintenance?.id);

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
      // Only show success if mutation completed without error
      apexToast.success('Bike deleted');
    } catch (error) {
      console.error('Delete bike error:', error);
      apexToast.error(
        error instanceof Error ? error.message : 'Failed to delete bike'
      );
      throw error; // Re-throw to prevent BikeCard from thinking it succeeded
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBike(null);
  };

  const handleViewMaintenance = (bike: BikeType) => {
    setSelectedBikeForMaintenance(bike);
    setIsMaintenanceViewOpen(true);
  };

  const handleCloseMaintenanceView = () => {
    setIsMaintenanceViewOpen(false);
    setSelectedBikeForMaintenance(null);
    setEditingLog(null);
  };

  const handleAddMaintenanceLog = async (
    logData: Omit<MaintenanceLog, 'id' | 'created_at'>
  ) => {
    await createMaintenanceLog.mutateAsync(logData);
  };

  const handleUpdateMaintenanceLog = async (
    logData: Omit<MaintenanceLog, 'id' | 'created_at'>
  ) => {
    if (editingLog) {
      await updateMaintenanceLog.mutateAsync({
        id: editingLog.id,
        updates: logData,
      });
      setEditingLog(null);
    }
  };

  const handleEditMaintenanceLog = (log: MaintenanceLog) => {
    setEditingLog(log);
    setIsMaintenanceViewOpen(false);
    setIsMaintenanceModalOpen(true);
  };

  const handleDeleteMaintenanceLog = async (id: string) => {
    try {
      await deleteMaintenanceLog.mutateAsync(id);
      apexToast.success('Maintenance log deleted');
    } catch (error) {
      apexToast.error(
        error instanceof Error
          ? error.message
          : 'Failed to delete maintenance log'
      );
    }
  };


  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-apex-white mb-4">Garage</h1>
        <div className="text-apex-white/60">Loading...</div>
      </div>
    );
  }

  return (
    <motion.div
      className="p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        className="flex items-center justify-between mb-6"
        variants={itemVariants}
      >
        <h1 className="text-2xl font-bold text-apex-white">Garage</h1>
        <motion.button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-apex-green text-apex-black font-semibold rounded-lg hover:bg-apex-green/90 transition-colors"
          {...buttonHoverProps}
        >
          <Plus size={20} />
          Add Bike
        </motion.button>
      </motion.div>

      {bikes.length === 0 ? (
        <motion.div
          className="flex flex-col items-center justify-center py-16 text-center"
          variants={itemVariants}
        >
          <div className="p-4 bg-apex-green/10 rounded-full mb-4">
            <Bike size={48} className="text-apex-green" />
          </div>
          <h2 className="text-xl font-semibold text-apex-white mb-2">
            No bikes yet
          </h2>
          <p className="text-apex-white/60 mb-6 max-w-md">
            Add your first machine to start tracking rides and maintenance.
          </p>
          <motion.button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-apex-green text-apex-black font-semibold rounded-lg hover:bg-apex-green/90 transition-colors"
            {...buttonHoverProps}
          >
            <Plus size={20} />
            Add your first machine
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={containerVariants}
        >
          {bikes.map((bike) => (
            <motion.div key={bike.id} variants={itemVariants}>
              <BikeCard
                bike={bike}
                onDelete={handleDeleteBike}
                onEdit={handleEditBike}
                onViewMaintenance={handleViewMaintenance}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      <AddBikeModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={editingBike ? handleUpdateBike : handleAddBike}
        editingBike={editingBike}
      />

      {/* Maintenance Logs View Modal */}
      {selectedBikeForMaintenance && isMaintenanceViewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-apex-black/80 backdrop-blur-sm"
            onClick={handleCloseMaintenanceView}
          />
          <div className="relative bg-apex-black border border-apex-white/20 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-apex-white">
                  Maintenance Logs
                </h2>
                <p className="text-sm text-apex-white/60 mt-1">
                  {selectedBikeForMaintenance.nick_name ||
                    `${selectedBikeForMaintenance.make} ${selectedBikeForMaintenance.model}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={() => {
                    setEditingLog(null);
                    setIsMaintenanceViewOpen(false);
                    setIsMaintenanceModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-apex-green text-apex-black font-semibold rounded-lg hover:bg-apex-green/90 transition-colors"
                  {...buttonHoverProps}
                >
                  <Plus size={18} />
                  Add Log
                </motion.button>
                <motion.button
                  onClick={handleCloseMaintenanceView}
                  className="p-2 text-apex-white/60 hover:text-apex-white transition-colors"
                  aria-label="Close"
                  {...buttonHoverProps}
                >
                  <X size={24} />
                </motion.button>
              </div>
            </div>

            <MaintenanceLogList
              logs={maintenanceLogs}
              bike={selectedBikeForMaintenance}
              onEdit={handleEditMaintenanceLog}
              onDelete={handleDeleteMaintenanceLog}
              isLoading={logsLoading}
            />
          </div>
        </div>
      )}

      {/* Add/Edit Maintenance Log Modal */}
      {selectedBikeForMaintenance && (
        <MaintenanceLogModal
          isOpen={isMaintenanceModalOpen}
          onClose={() => {
            setIsMaintenanceModalOpen(false);
            setEditingLog(null);
            // Always return to view after closing add/edit modal
            setIsMaintenanceViewOpen(true);
          }}
          onSubmit={
            editingLog ? handleUpdateMaintenanceLog : handleAddMaintenanceLog
          }
          editingLog={editingLog}
          bike={selectedBikeForMaintenance}
        />
      )}
    </motion.div>
  );
}

