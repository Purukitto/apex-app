import { Wrench, Edit, Trash2, Calendar, ExternalLink } from 'lucide-react';
import type { MaintenanceLog, Bike } from '../types/database';
import { format } from 'date-fns';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { listContainerVariants, fastItemVariants, buttonHoverProps, getCardHoverProps } from '../lib/animations';
import { useThemeColors } from '../hooks/useThemeColors';
import ConfirmModal from './ConfirmModal';

interface MaintenanceLogListProps {
  logs: MaintenanceLog[];
  bike: Bike;
  onEdit: (log: MaintenanceLog) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export default function MaintenanceLogList({
  logs,
  onEdit,
  onDelete,
  isLoading,
}: MaintenanceLogListProps) {
  const { primary } = useThemeColors();
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [logToDelete, setLogToDelete] = useState<MaintenanceLog | null>(null);
  if (isLoading) {
    return (
      <div className="text-apex-white/60 text-sm">Loading maintenance logs...</div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8">
        <Wrench size={32} className="text-apex-white/20 mx-auto mb-3" />
        <p className="text-apex-white/60 text-sm">No maintenance logs yet</p>
        <p className="text-apex-white/40 text-xs mt-1">
          Add your first service record
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
                  <Wrench size={16} style={{ color: primary }} />
                </div>
                <h4 className="text-apex-white font-semibold truncate">
                  {log.service_type || 'General Service'}
                </h4>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-apex-white/60">
                  <Calendar size={14} />
                  <span>
                    {format(new Date(log.date_performed), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="text-apex-white/60">
                  <span className="font-mono text-apex-green group-hover:text-apex-green/90 transition-colors">
                    {log.odo_at_service.toLocaleString()} km
                  </span>
                  {' at service'}
                </div>
                {log.notes && (
                  <p className="text-apex-white/60 mt-2 text-xs line-clamp-2">
                    {log.notes}
                  </p>
                )}
                {log.receipt_url && (
                  <a
                    href={log.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-apex-green hover:text-apex-green/80 text-xs mt-2 transition-colors"
                  >
                    <ExternalLink size={12} />
                    View Receipt
                  </a>
                )}
              </div>
            </div>

            <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              <motion.button
                onClick={() => onEdit(log)}
                className="p-2 text-apex-white/60 hover:text-apex-green transition-colors"
                aria-label="Edit maintenance log"
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
                aria-label="Delete maintenance log"
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
        title="Delete Maintenance Log"
        message={`Are you sure you want to delete this maintenance log? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deletingLogId !== null}
      />
    </motion.div>
  );
}

