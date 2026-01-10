import { motion } from 'framer-motion';

interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className = '', size = 32 }: LogoProps) {
  return (
    <motion.div
      className={className}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <img
        src="/apex-logo.svg"
        alt="Apex"
        width={size}
        height={size}
        className="object-contain"
      />
    </motion.div>
  );
}
