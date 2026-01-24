import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Lock, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { apexToast } from '../lib/toast';
import { containerVariants, itemVariants, buttonHoverProps } from '../lib/animations';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import { calculatePasswordStrength } from '../lib/passwordStrength';
import { logger } from '../lib/logger';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const navigate = useNavigate();

  // Calculate password strength
  const passwordStrength = calculatePasswordStrength(password);
  const isPasswordValid = passwordStrength.isValid;
  const passwordsMatch = password === confirmPassword;

  useEffect(() => {
    // Check if we have a valid session (from URL hash token)
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setHasSession(true);
        } else {
          // Wait a bit for onAuthStateChange to process the URL hash
          await new Promise(resolve => setTimeout(resolve, 1000));
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (retrySession) {
            setHasSession(true);
          } else {
            setError('Invalid or expired reset link. Please request a new password reset.');
            apexToast.error('Invalid or expired reset link');
          }
        }
      } catch (err) {
        logger.error('Error checking session:', err);
        setError('Failed to verify reset link');
        apexToast.error('Failed to verify reset link');
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    if (!success) return;
    const redirectTimer = setTimeout(() => {
      navigate('/login', { replace: true });
    }, 1200);

    return () => clearTimeout(redirectTimer);
  }, [success, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) {
      setError('Password does not meet all requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw new Error(updateError.message || 'Failed to update password');
      }

      setSuccess(true);
      apexToast.success('Password Changed! You can now log in.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update password';
      setError(errorMessage);
      apexToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-apex-black flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-apex-white/60">Verifying reset link...</div>
        </div>
      </div>
    );
  }

  if (!hasSession) {
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

          <motion.div
            variants={itemVariants}
            className="bg-linear-to-br from-apex-white/5 to-transparent border border-apex-white/20 rounded-md p-6 text-center"
          >
            <p className="text-apex-white/80 mb-4">{error || 'Invalid or expired reset link'}</p>
            <button
              onClick={() => navigate('/login')}
              className="text-apex-green hover:text-apex-green/80 text-sm transition-colors"
            >
              Return to Login
            </button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (success) {
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

          <motion.div
            variants={itemVariants}
            className="bg-linear-to-br from-apex-white/5 to-transparent border border-apex-green/40 rounded-lg p-6 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="mb-4 flex justify-center"
            >
              <CheckCircle2 size={48} className="text-apex-green" />
            </motion.div>
            <h2 className="text-lg font-semibold text-apex-white mb-2">Password Changed!</h2>
            <p className="text-sm text-apex-white/80 mb-4">
              Your password has been successfully updated.
            </p>
            <p className="text-sm text-apex-white/60 mb-6">
              Open the mobile app to log in with your new password.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="text-apex-green hover:text-apex-green/80 text-sm transition-colors"
            >
              Return to Login
            </button>
          </motion.div>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div variants={itemVariants}>
            <input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full px-4 py-3 bg-apex-black border border-apex-white/20 rounded-lg text-base text-apex-white placeholder-apex-white/40 focus:outline-none focus:border-apex-green transition-colors"
            />
            {password && (
              <div className="mt-3">
                <PasswordStrengthIndicator password={password} />
              </div>
            )}
          </motion.div>

          <motion.div variants={itemVariants}>
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full px-4 py-3 bg-apex-black border border-apex-white/20 rounded-lg text-base text-apex-white placeholder-apex-white/40 focus:outline-none focus:border-apex-green transition-colors"
            />
            {confirmPassword && !passwordsMatch && (
              <p className="mt-2 text-sm text-apex-red">Passwords do not match</p>
            )}
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-apex-red text-sm text-center min-h-[20px]"
            >
              {error}
            </motion.div>
          )}

          <motion.button
            {...buttonHoverProps}
            type="submit"
            disabled={loading || !isPasswordValid || !passwordsMatch}
            className="w-full py-3 bg-apex-green text-base text-apex-black font-semibold rounded-lg hover:bg-apex-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              'Updating...'
            ) : (
              <>
                <Lock size={18} />
                Update Password
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
