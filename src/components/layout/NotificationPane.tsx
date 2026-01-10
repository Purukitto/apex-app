import { X, Bell, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '../../stores/useNotificationStore';
import { formatDistanceToNow } from 'date-fns';
import { containerVariants, fastItemVariants, buttonHoverProps } from '../../lib/animations';

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

  const NEON_LIME = '#bef264';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-40"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* Slide-over Panel */}
          <motion.div
            className="fixed right-0 top-0 h-full w-full max-w-md bg-zinc-950 border-l border-white/5 z-50 flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/5">
                  <Bell size={20} className="text-white" />
                </div>
                <h2 className="text-lg font-semibold text-white">
                  Notifications
                </h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-1 rounded-full text-zinc-950 text-xs font-mono font-semibold" style={{ backgroundColor: NEON_LIME }}>
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <motion.button
                    onClick={markAllAsRead}
                    className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                    aria-label="Mark all as read"
                    {...buttonHoverProps}
                  >
                    <Check size={18} />
                  </motion.button>
                )}
                <motion.button
                  onClick={onClose}
                  className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                  aria-label="Close notifications"
                  {...buttonHoverProps}
                >
                  <X size={20} />
                </motion.button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <Bell size={48} className="text-white/20 mb-4" />
                  <p className="text-white/60">No notifications</p>
                </div>
              ) : (
                <motion.div
                  className="space-y-3"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      className={`bg-zinc-900 border rounded-apex p-4 ${
                        !notification.read_status
                          ? 'border-white/20'
                          : 'border-white/5'
                      }`}
                      variants={fastItemVariants}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`text-xs font-semibold uppercase tracking-wide ${
                                notification.type === 'warning'
                                  ? 'text-white/60'
                                  : notification.type === 'error'
                                    ? 'text-red-500'
                                    : 'text-white/60'
                              }`}
                            >
                              {notification.type}
                            </span>
                            {!notification.read_status && (
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: NEON_LIME }} />
                            )}
                          </div>
                          <p className="text-white text-sm mb-2">{notification.message}</p>
                          <p className="text-xs text-white/40 font-mono">
                            {formatDistanceToNow(notification.created_at, {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {!notification.read_status && (
                            <motion.button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                              aria-label="Mark as read"
                              {...buttonHoverProps}
                            >
                              <Check size={16} />
                            </motion.button>
                          )}
                          <motion.button
                            onClick={() => removeNotification(notification.id)}
                            className="p-1.5 rounded-full text-white/40 hover:text-red-500 hover:bg-white/5 transition-colors"
                            aria-label="Remove notification"
                            {...buttonHoverProps}
                          >
                            <X size={16} />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

