import { motion } from 'framer-motion';
import { itemVariants } from '../../lib/animations';
import ApexTelemetryIcon from '../ui/ApexTelemetryIcon';

interface PageHeaderProps {
  title: string;
}

export default function PageHeader({ title }: PageHeaderProps) {
  return (
    <motion.div
      className="flex items-center gap-3"
      variants={itemVariants}
    >
      <ApexTelemetryIcon size={32} static />
      <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
        {title}
      </h1>
    </motion.div>
  );
}
