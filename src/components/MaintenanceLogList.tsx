import { Wrench, Edit, Trash2, Calendar, ExternalLink } from 'lucide-react';
import type { MaintenanceLog, Bike } from '../types/database';
import { format } from 'date-fns';

interface MaintenanceLogListProps {
  logs: MaintenanceLog[];
  bike: Bike;
  onEdit: (log: MaintenanceLog) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export default function MaintenanceLogList({
  logs,
  bike,
  onEdit,
  onDelete,
  isLoading,
}: MaintenanceLogListProps) {
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
    <div className="space-y-3">
      {logs.map((log) => (
        <div
          key={log.id}
          className="border border-apex-white/10 rounded-lg p-4 bg-apex-black/50 hover:border-apex-white/20 transition-colors group"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Wrench size={16} className="text-apex-green flex-shrink-0" />
                <h4 className="text-apex-white font-medium truncate">
                  {log.service_type || 'General Service'}
                </h4>
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2 text-apex-white/60">
                  <Calendar size={14} />
                  <span>
                    {format(new Date(log.date_performed), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="text-apex-white/60">
                  <span className="font-mono text-apex-green">
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

            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit(log)}
                className="p-2 text-apex-white/60 hover:text-apex-green transition-colors"
                aria-label="Edit maintenance log"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      'Are you sure you want to delete this maintenance log?'
                    )
                  ) {
                    onDelete(log.id);
                  }
                }}
                className="p-2 text-apex-white/60 hover:text-apex-red transition-colors"
                aria-label="Delete maintenance log"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

