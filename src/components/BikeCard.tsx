import type { Bike } from '../types/database';
import { Motorbike as BikeIcon, Trash2, Edit, Wrench } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { buttonHoverProps, cardHoverProps } from '../lib/animations';
import ConfirmModal from './ConfirmModal';

interface BikeCardProps {
  bike: Bike;
  onDelete: (id: string) => void;
  onEdit?: (bike: Bike) => void;
  onViewMaintenance?: (bike: Bike) => void;
}

export default function BikeCard({ bike, onDelete, onEdit, onViewMaintenance }: BikeCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleDeleteClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setShowConfirmModal(false);
    try {
      await onDelete(bike.id);
    } catch {
      // Error handling is done in parent component (Garage.tsx)
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      className="border border-apex-white/20 rounded-lg p-6 bg-gradient-to-br from-white/5 to-transparent hover:border-apex-green/40 transition-colors relative group"
      {...cardHoverProps}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            className="p-2 bg-apex-green/10 rounded-lg group-hover:bg-apex-green/20 transition-colors"
            whileHover={{ scale: 1.05 }}
          >
            <BikeIcon size={24} className="text-apex-green group-hover:text-apex-green/90" />
          </motion.div>
          <div>
            <h3 className="text-lg font-semibold text-apex-white">
              {bike.nick_name || `${bike.make} ${bike.model}`}
            </h3>
            {bike.nick_name && (
              <p className="text-sm text-apex-white/60">
                {bike.make} {bike.model}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          {onViewMaintenance && (
            <motion.button
              onClick={() => onViewMaintenance(bike)}
              className="p-2 text-apex-white/60 hover:text-apex-green transition-colors"
              aria-label="View maintenance logs"
              {...buttonHoverProps}
            >
              <Wrench size={18} />
            </motion.button>
          )}
          {onEdit && (
            <motion.button
              onClick={() => onEdit(bike)}
              className="p-2 text-apex-white/60 hover:text-apex-green transition-colors"
              aria-label="Edit bike"
              {...buttonHoverProps}
            >
              <Edit size={18} />
            </motion.button>
          )}
          <motion.button
            onClick={handleDeleteClick}
            disabled={isDeleting}
            className="p-2 text-apex-white/60 hover:text-apex-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Delete bike"
            {...(isDeleting ? {} : buttonHoverProps)}
          >
            <Trash2 size={18} />
          </motion.button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-apex-white/60 text-sm">Year</span>
          <span className="text-apex-white font-medium">
            {bike.year || 'N/A'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-apex-white/60 text-sm">Odometer</span>
          <span className="text-apex-green font-mono text-lg font-semibold group-hover:text-apex-green/90 transition-colors">
            {bike.current_odo.toLocaleString()} km
          </span>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Bike"
        message={`Are you sure you want to delete ${bike.nick_name || `${bike.make} ${bike.model}`}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </motion.div>
  );
}
