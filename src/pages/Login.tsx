import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { apexToast } from '../lib/toast';
import { containerVariants, itemVariants, buttonHoverProps } from '../lib/animations';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import { calculatePasswordStrength } from '../lib/passwordStrength';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Calculate password strength for signup validation
  const passwordStrength = calculatePasswordStrength(password);
  const isPasswordValid = isSignUp ? passwordStrength.isValid : true;
  // Determine redirect URL:
  // - Default: current origin (localhost in dev, prod in prod)
  // - Override via VITE_WEBSITE_BASE_URL if needed (e.g. custom domain)
  const baseUrl = import.meta.env.VITE_WEBSITE_BASE_URL || `${window.location.origin}`;

  useEffect(() => {
    // Redirect if already authenticated
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard');
      }
    });
  }, [navigate]);

  const waitForSession = async (): Promise<boolean> => {
    // Supabase session persistence can take a moment on some platforms (webview/storage)
    // Avoid navigating into AuthGuard until we can read the session back.
    const maxAttempts = 5;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) return true;
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    return false;
  };

  const forgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      apexToast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${baseUrl}/reset-password`,
      });

      if (resetError) {
        throw new Error(resetError.message || 'Failed to send reset email');
      }

      apexToast.success('Password reset email sent. Check your inbox.');
      setEmail('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reset email';
      setError(errorMessage);
      apexToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent submission if password is invalid in signup mode
    if (isSignUp && !isPasswordValid) {
      setError('Password does not meet all requirements');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${baseUrl}/confirmed`,
          },
        });

        if (signUpError) {
          // Handle specific Supabase errors
          let errorMessage = 'Failed to create account';

          // Check error message and code for duplicate email
          const errorMsg = signUpError.message?.toLowerCase() || '';
          const errorCode = signUpError.status?.toString() || '';

          if (
            errorMsg.includes('already registered') ||
            errorMsg.includes('already exists') ||
            errorMsg.includes('user already registered') ||
            errorMsg.includes('email address is already') ||
            errorCode === '422' // Unprocessable Entity often used for duplicates
          ) {
            errorMessage = 'This email is already registered';
          } else if (errorMsg.includes('password')) {
            errorMessage = 'Password does not meet requirements';
          } else if (signUpError.message) {
            errorMessage = signUpError.message;
          }

          throw new Error(errorMessage);
        }

        // Check if user was actually created
        if (!signUpData.user) {
          throw new Error('This email is already registered');
        }

        // KEY: Check if identities array is empty - this indicates duplicate email
        // Supabase returns user object with empty identities array for duplicate emails
        // to prevent email enumeration attacks
        if (!signUpData.user.identities || signUpData.user.identities.length === 0) {
          throw new Error('This email is already registered');
        }

        // Check if email confirmation is required
        // If confirmation_sent_at exists but no session, user needs to confirm email
        const needsEmailConfirmation = signUpData.user.confirmation_sent_at && !signUpData.session;

        if (needsEmailConfirmation) {
          // Email confirmation required - don't navigate, show message
          apexToast.success('Please check your email to confirm your account');
          setEmail('');
          setPassword('');
          return;
        }

        // Check if we have a session (user is automatically signed in)
        // Wait a brief moment for session to be established
        await new Promise(resolve => setTimeout(resolve, 300));

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw new Error(sessionError.message || 'Failed to create session');
        }

        // If no session exists, it means email confirmation is required
        if (!session) {
          apexToast.success('Please check your email to confirm your account');
          setEmail('');
          setPassword('');
          return;
        }

        // Verify the session user matches the signup user
        if (session.user.id !== signUpData.user.id) {
          throw new Error('This email is already registered');
        }

        // Ensure session is valid before navigating
        if (!session.access_token) {
          throw new Error('Invalid session. This email may already be registered.');
        }

        // After sign up, user is automatically signed in
        // Show toast and give it time to display before navigating
        apexToast.success('Account created');
        // Small delay to ensure toast is visible before navigation
        await new Promise(resolve => setTimeout(resolve, 300));
        navigate('/dashboard');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          let errorMessage = 'Failed to sign in';
          if (signInError.message.includes('Invalid login')) {
            errorMessage = 'Invalid email or password';
          } else if (signInError.message) {
            errorMessage = signInError.message;
          }
          throw new Error(errorMessage);
        }

        apexToast.success('Signed in');

        const sessionReady = await waitForSession();
        if (!sessionReady) {
          throw new Error('Sign-in completed, but session was not available yet. Please try again.');
        }
        navigate('/dashboard');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      apexToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
          <p className="mt-3 text-sm font-semibold uppercase tracking-[0.2em] text-apex-green">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div variants={itemVariants}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-apex-black border border-apex-white/20 rounded-lg text-apex-white placeholder-apex-white/40 focus:outline-none focus:border-apex-green transition-colors"
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              className="w-full px-4 py-3 bg-apex-black border border-apex-white/20 rounded-lg text-apex-white placeholder-apex-white/40 focus:outline-none focus:border-apex-green transition-colors"
            />
            {isSignUp && password && (
              <div className="mt-3">
                <PasswordStrengthIndicator password={password} />
              </div>
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
            disabled={loading || !isPasswordValid}
            className="w-full py-3 bg-apex-green text-apex-black font-semibold rounded-lg hover:bg-apex-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              'Loading...'
            ) : (
              <>
                <LogIn size={18} />
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </>
            )}
          </motion.button>
        </form>

        {!isSignUp && (
          <motion.div className="mt-4 text-center" variants={itemVariants}>
            <button
              onClick={forgotPassword}
              disabled={loading}
              className="text-apex-white/60 hover:text-apex-green text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Forgot Password?
            </button>
          </motion.div>
        )}

        <motion.div className="mt-6 text-center" variants={itemVariants}>
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null); // Clear error when switching modes
              setPassword(''); // Clear password when switching modes
            }}
            className="text-apex-green hover:text-apex-green/80 text-sm transition-colors"
          >
            {isSignUp
              ? 'Already have an account? Sign In'
              : "Don't have an account? Sign Up"}
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}

