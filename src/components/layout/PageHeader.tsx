import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Bell } from 'lucide-react';
import { itemVariants, buttonHoverProps } from '../../lib/animations';
import ApexTelemetryIcon from '../ui/ApexTelemetryIcon';
import { useNotificationHandler } from './NotificationContext';
import { useThemeColors } from '../../hooks/useThemeColors';

interface PageHeaderProps {
  title: string;
}

export default function PageHeader({ title }: PageHeaderProps) {
  const navigate = useNavigate();
  const { openNotifications, unreadCount } = useNotificationHandler();
  const { primary } = useThemeColors();

  return (
    <motion.div
      className="flex items-center justify-between gap-3"
      variants={itemVariants}
    >
      <div className="flex items-center gap-3">
        <ApexTelemetryIcon size={32} static />
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        {/* Profile Button */}
        <motion.button
          onClick={() => navigate('/profile')}
          className="w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center text-white/60 hover:border-white/40 transition-colors"
          {...buttonHoverProps}
        >
          <User size={20} />
        </motion.button>
        {/* Notifications Button */}
        <motion.button
          onClick={openNotifications}
          className="relative w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors"
          style={{ backgroundColor: primary }}
          {...buttonHoverProps}
        >
          <Bell size={20} className="text-apex-black" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-apex-black text-apex-white text-[10px] font-mono font-bold rounded-full flex items-center justify-center border-2 border-apex-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
