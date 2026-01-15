import { Fuel, Edit, Trash2, Calendar } from 'lucide-react';
import type { FuelLog, Bike } from '../types/database';
import { format } from 'date-fns';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { listContainerVariants, fastItemVariants, buttonHoverProps, getCardHoverProps } from '../lib/animations';
import { useThemeColors } from '../hooks/useThemeColors';
import ConfirmModal from './ConfirmModal';
import { LoadingSkeleton } from './LoadingSpinner';

interface FuelLogListProps {
  logs: FuelLog[];
  bike: Bike;
  onEdit: (log: FuelLog) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export default function FuelLogList({
  logs,
  onEdit,
  onDelete,
  isLoading,
}: FuelLogListProps) {
  const { primary } = useThemeColors();
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [logToDelete, setLogToDelete] = useState<FuelLog | null>(null);
  
  if (isLoading) {
    return (
      <div className="space-y-3">
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8">
        <Fuel size={32} className="text-apex-white/20 mx-auto mb-3" />
        <p className="text-apex-white/60 text-sm">No fuel logs yet</p>
        <p className="text-apex-white/40 text-xs mt-1">
          Add your first refuel record
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-3"
      initial="hidden"
      animate="visible"
      variants={listContainerVariants}
    >
      {logs.map((log) => (
        <motion.div
          key={log.id}
          className="border border-apex-white/20 rounded-lg p-4 bg-gradient-to-br from-white/5 to-transparent hover-border-theme transition-colors group"
          variants={fastItemVariants}
          {...getCardHoverProps()}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <div 
                  className="p-1.5 rounded-lg transition-colors group-hover:opacity-80" 
                  style={{ backgroundColor: `${primary}1A` }}
                >
                  <Fuel size={16} style={{ color: primary }} />
                </div>
                <div className="flex items-center gap-2">
                  <h4 className="text-apex-white font-semibold">
                    {log.litres.toFixed(2)} L
                  </h4>
                  {log.is_full_tank && (
                    <span className="px-2 py-0.5 bg-apex-green/20 text-apex-green text-xs rounded-full border border-apex-green/30">
                      Full Tank
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-apex-white/60">
                  <Calendar size={14} />
                  <span>
                    {format(new Date(log.date), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-apex-white/60">
                  <div>
                    <span className="text-xs">Odometer:</span>
                    <span className="font-mono text-apex-green group-hover:text-apex-green/90 transition-colors ml-2">
                      {log.odometer.toLocaleString()} km
                    </span>
                  </div>
                  <div>
                    <span className="text-xs">Price/L:</span>
                    <span className="font-mono text-apex-white ml-2">
                      ₹{log.price_per_litre.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="text-apex-white/60">
                  <span className="text-xs">Total Cost:</span>
                  <span className="font-mono text-apex-green group-hover:text-apex-green/90 transition-colors ml-2">
                    ₹{log.total_cost.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              <motion.button
                onClick={() => onEdit(log)}
                className="p-2 text-apex-white/60 hover:text-apex-green transition-colors"
                aria-label="Edit fuel log"
                {...buttonHoverProps}
              >
                <Edit size={16} />
              </motion.button>
              <motion.button
                onClick={() => {
                  setLogToDelete(log);
                  setShowConfirmModal(true);
                }}
                className="p-2 text-apex-white/60 hover:text-apex-red transition-colors"
                aria-label="Delete fuel log"
                {...buttonHoverProps}
              >
                <Trash2 size={16} />
              </motion.button>
            </div>
          </div>
        </motion.div>
      ))}

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setLogToDelete(null);
        }}
        onConfirm={() => {
          if (logToDelete) {
            setDeletingLogId(logToDelete.id);
            onDelete(logToDelete.id);
            setShowConfirmModal(false);
            setLogToDelete(null);
            setDeletingLogId(null);
          }
        }}
        title="Delete Fuel Log"
        message={`Are you sure you want to delete this fuel log? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deletingLogId !== null}
      />
    </motion.div>
  );
}
