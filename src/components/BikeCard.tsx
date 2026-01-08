import type { Bike } from '../types/database';
import { Bike as BikeIcon, Trash2, Edit, Wrench } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface BikeCardProps {
  bike: Bike;
  onDelete: (id: string) => void;
  onEdit?: (bike: Bike) => void;
  onViewMaintenance?: (bike: Bike) => void;
}

export default function BikeCard({ bike, onDelete, onEdit, onViewMaintenance }: BikeCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this bike?')) {
      setIsDeleting(true);
      try {
        await onDelete(bike.id);
      } catch (error) {
        console.error('Error deleting bike:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <motion.div
      className="border border-apex-white/20 rounded-lg p-6 bg-gradient-to-br from-white/5 to-transparent hover:border-apex-green/40 transition-colors relative group"
      whileHover={{ borderColor: 'rgba(0, 255, 65, 0.4)' }}
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
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Wrench size={18} />
            </motion.button>
          )}
          {onEdit && (
            <motion.button
              onClick={() => onEdit(bike)}
              className="p-2 text-apex-white/60 hover:text-apex-green transition-colors"
              aria-label="Edit bike"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Edit size={18} />
            </motion.button>
          )}
          <motion.button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 text-apex-white/60 hover:text-apex-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Delete bike"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
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
    </motion.div>
  );
}

