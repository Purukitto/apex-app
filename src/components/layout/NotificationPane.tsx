import { X, Bell, Check, Trash2 } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate, type PanInfo } from 'framer-motion';
import { useNotifications } from '../../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { containerVariants, buttonHoverProps } from '../../lib/animations';
import { useState, useRef, useEffect } from 'react';
import { Card } from '../ui/Card';

interface NotificationPaneProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHEET_MAX_HEIGHT = '85vh';
const DRAG_THRESHOLD = 100; // pixels to drag before closing

export default function NotificationPane({
  isOpen,
  onClose,
}: NotificationPaneProps) {
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    dismissAll,
    unreadCount,
  } = useNotifications();
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 200], [1, 0.3]);
  const [isDragging, setIsDragging] = useState(false);
  const [shouldUseMotionValue, setShouldUseMotionValue] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const prevIsOpenRef = useRef(isOpen);

  // Reset position when opening - only update motion value, not state
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      // Pane just opened - reset motion value
      y.set(0);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, y]);

  // Reset state when pane opens - use setTimeout to avoid setState in effect
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      // Reset all states when opening - defer to avoid setState in effect
      setTimeout(() => {
        setIsClosing(false);
        setShouldUseMotionValue(false);
        setIsDragging(false);
      }, 0);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    const shouldClose = info.offset.y > DRAG_THRESHOLD || info.velocity.y > 500;
    
    if (shouldClose) {
      // Close immediately - AnimatePresence will handle exit animation
      setShouldUseMotionValue(false);
      handleClose();
    } else {
      // Spring back to original position
      setShouldUseMotionValue(true);
      animate(y, 0, {
        type: 'spring',
        damping: 30,
        stiffness: 300,
        mass: 0.8,
      }).then(() => {
        setShouldUseMotionValue(false);
      });
    }
  };

  const handleClose = () => {
    // Always allow closing - reset state if needed
    if (isClosing) {
      // If already closing, force close anyway
      setIsClosing(false);
    }
    setIsClosing(true);
    setShouldUseMotionValue(false);
    setIsDragging(false);
    onClose();
  };


  return (
    <AnimatePresence onExitComplete={() => {
      setIsClosing(false);
      setShouldUseMotionValue(false);
      setIsDragging(false);
    }}>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-apex-black/60 backdrop-blur-sm z-40"
            onClick={handleClose}
            style={{ pointerEvents: isClosing ? 'none' : 'auto' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          />

          {/* Bottom Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-apex-black border-t border-apex-white/20 rounded-t-2xl shadow-2xl"
            style={{
              maxHeight: SHEET_MAX_HEIGHT,
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              ...(shouldUseMotionValue || isDragging ? { y, opacity: isDragging ? opacity : 1 } : {}),
            }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.1}
            dragDirectionLock
            onDragStart={() => {
              setIsDragging(true);
              setShouldUseMotionValue(true);
            }}
            onDragEnd={handleDragEnd}
            initial={{ y: '100%' }}
            animate={shouldUseMotionValue || isDragging ? undefined : { y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
              mass: 0.8,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 rounded-full bg-apex-white/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4 border-b border-apex-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-apex-green/10">
                  <Bell size={20} className="text-apex-green" />
                </div>
                <h2 className="text-lg font-semibold text-apex-white font-sans tracking-tight">
                  Notifications
                </h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-1 rounded-full bg-apex-green text-apex-black text-xs font-mono font-semibold">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (unreadCount > 0) {
                          markAllAsRead();
                        }
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        unreadCount > 0
                          ? 'text-apex-white/60 hover:text-apex-white hover:bg-apex-white/5'
                          : 'text-apex-white/30 cursor-not-allowed'
                      }`}
                      aria-label="Mark all as read"
                      {...(unreadCount > 0 ? buttonHoverProps : {})}
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      disabled={unreadCount === 0}
                    >
                      <Check size={18} />
                    </motion.button>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissAll();
                      }}
                      className="p-2 rounded-lg text-apex-white/60 hover:text-apex-white hover:bg-apex-white/5 transition-colors"
                      aria-label="Dismiss all notifications"
                      {...buttonHoverProps}
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <Trash2 size={18} />
                    </motion.button>
                  </>
                )}
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClose();
                  }}
                  className="p-2 rounded-lg text-apex-white/60 hover:text-apex-white hover:bg-apex-white/5 transition-colors"
                  aria-label="Close notifications"
                  {...buttonHoverProps}
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <X size={20} />
                </motion.button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <Bell size={48} className="text-apex-white/20 mb-4" />
                  <p className="text-apex-white/60">No notifications</p>
                </div>
              ) : (
                <motion.div
                  className="space-y-3"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {notifications.map((notification) => (
                    <Card
                      key={notification.id}
                      padding="sm"
                      animate="fastItem"
                      className={!notification.read_at ? 'border-apex-white/20' : 'border-apex-white/10'}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`text-xs font-semibold uppercase tracking-wide ${
                                notification.type === 'warning'
                                  ? 'text-apex-white/60'
                                  : notification.type === 'error'
                                    ? 'text-apex-red'
                                    : 'text-apex-white/60'
                              }`}
                            >
                              {notification.type}
                            </span>
                            {!notification.read_at && (
                              <span className="w-2 h-2 rounded-full bg-apex-green" />
                            )}
                          </div>
                          <p className="text-apex-white text-sm mb-2">{notification.message}</p>
                          <p className="text-xs text-apex-white/40 font-mono">
                            {formatDistanceToNow(notification.created_at, {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {!notification.read_at && (
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="p-1.5 rounded-lg text-apex-white/40 hover:text-apex-green hover:bg-apex-white/5 transition-colors"
                              aria-label="Mark as read"
                              {...buttonHoverProps}
                              type="button"
                              onPointerDown={(e) => e.stopPropagation()}
                            >
                              <Check size={16} />
                            </motion.button>
                          )}
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissNotification(notification.id);
                            }}
                            className="p-1.5 rounded-lg text-apex-white/40 hover:text-apex-red hover:bg-apex-white/5 transition-colors"
                            aria-label="Remove notification"
                            {...buttonHoverProps}
                            type="button"
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                            <X size={16} />
                          </motion.button>
                        </div>
                      </div>
                    </Card>
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

