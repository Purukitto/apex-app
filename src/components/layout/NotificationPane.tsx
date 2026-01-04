import { X, Bell, Check } from 'lucide-react';
import { useNotificationStore } from '../../stores/useNotificationStore';
import { formatDistanceToNow } from 'date-fns';

interface NotificationPaneProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationPane({
  isOpen,
  onClose,
}: NotificationPaneProps) {
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    getUnreadCount,
  } = useNotificationStore();

  const unreadCount = getUnreadCount();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-apex-black/80 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-apex-black border-l border-apex-white/20 z-50 flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-apex-white/10">
          <div className="flex items-center gap-3">
            <Bell size={20} className="text-apex-green" />
            <h2 className="text-lg font-semibold text-apex-white">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span className="px-2 py-1 bg-apex-green text-apex-black text-xs font-mono font-semibold rounded">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="p-2 text-apex-white/60 hover:text-apex-green transition-colors"
                aria-label="Mark all as read"
              >
                <Check size={18} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-apex-white/60 hover:text-apex-white transition-colors"
              aria-label="Close notifications"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <Bell size={48} className="text-apex-white/20 mb-4" />
              <p className="text-apex-white/60">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-apex-white/10">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-apex-white/5 transition-colors ${
                    !notification.read_status
                      ? 'bg-apex-green/5 border-l-2 border-l-apex-green'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs font-semibold uppercase tracking-wide ${
                            notification.type === 'warning'
                              ? 'text-apex-green'
                              : notification.type === 'error'
                                ? 'text-apex-red'
                                : 'text-apex-white/60'
                          }`}
                        >
                          {notification.type}
                        </span>
                        {!notification.read_status && (
                          <span className="w-2 h-2 bg-apex-green rounded-full" />
                        )}
                      </div>
                      <p className="text-apex-white text-sm">{notification.message}</p>
                      <p className="text-xs text-apex-white/40 mt-2">
                        {formatDistanceToNow(notification.created_at, {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notification.read_status && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1 text-apex-white/40 hover:text-apex-green transition-colors"
                          aria-label="Mark as read"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => removeNotification(notification.id)}
                        className="p-1 text-apex-white/40 hover:text-apex-red transition-colors"
                        aria-label="Remove notification"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

