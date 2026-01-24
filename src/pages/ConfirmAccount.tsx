import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { apexToast } from '../lib/toast';
import { logger } from '../lib/logger';
import { containerVariants, itemVariants, buttonHoverProps } from '../lib/animations';
import { Card } from '../components/ui/Card';

type ConfirmationStatus = 'checking' | 'confirmed' | 'invalid';

export default function ConfirmAccount() {
  const [status, setStatus] = useState<ConfirmationStatus>('checking');
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const verifyConfirmation = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        let activeSession = session;

        if (!activeSession) {
          await new Promise(resolve => setTimeout(resolve, 800));
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          activeSession = retrySession;
        }

        if (!activeSession) {
          setStatus('invalid');
          setMessage('Invalid or expired confirmation link.');
          apexToast.error('Invalid or expired confirmation link');
          return;
        }

        try {
          await supabase.auth.signOut();
        } catch (signOutError) {
          logger.warn('Failed to sign out after confirmation:', signOutError);
        }

        setStatus('confirmed');
        apexToast.success('Account confirmed');
      } catch (err) {
        logger.error('Error confirming account:', err);
        setStatus('invalid');
        setMessage('Failed to verify confirmation link.');
        apexToast.error('Failed to verify confirmation link');
      }
    };

    verifyConfirmation();
  }, []);

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-apex-black flex items-center justify-center p-4">
        <div className="text-center text-apex-white/60">Confirming your account...</div>
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen bg-apex-black flex items-center justify-center p-4">
        <motion.div
          className="w-full max-w-md"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="mb-8 text-center" variants={itemVariants}>
            <h1 className="text-xl md:text-2xl font-bold text-apex-white mb-2">Apex</h1>
            <p className="text-sm text-apex-white/60">The Rider's Black Box</p>
          </motion.div>

          <Card padding="md" animate="item" className="text-center">
            <p className="text-apex-white/80 mb-4">
              {message || 'Invalid or expired confirmation link.'}
            </p>
            <motion.button
              {...buttonHoverProps}
              onClick={() => navigate('/login')}
              className="text-apex-green hover:text-apex-green/80 text-sm transition-colors"
            >
              Return to Login
            </motion.button>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-apex-black flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="mb-8 text-center" variants={itemVariants}>
          <h1 className="text-3xl font-bold text-apex-white mb-2">Apex</h1>
          <p className="text-apex-white/60">The Rider's Black Box</p>
        </motion.div>

        <Card padding="md" animate="item" className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="mb-4 flex justify-center"
          >
            <CheckCircle2 size={48} className="text-apex-green" />
          </motion.div>
          <h2 className="text-lg font-semibold text-apex-white mb-2">Account Confirmed</h2>
          <p className="text-sm text-apex-white/80 mb-6">
            Your email is verified. Please sign in to continue.
          </p>
          <motion.button
            {...buttonHoverProps}
            onClick={() => navigate('/login')}
            className="w-full py-3 bg-apex-green text-base text-apex-black font-semibold rounded-lg hover:bg-apex-green/90 transition-colors"
          >
            Go to Login
          </motion.button>
        </Card>
      </motion.div>
    </div>
  );
}
