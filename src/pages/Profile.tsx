import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useUserProfile } from '../hooks/useUserProfile';
import { useDiscordRpcStore } from '../stores/useDiscordRpcStore';
import { isDiscordRpcEnabledForPlatform } from '../config/discord';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAppUpdate } from '../hooks/useAppUpdate';
import { useAppUpdateStore } from '../stores/useAppUpdateStore';
import { useNavigate } from 'react-router-dom';
import { Mail, LogOut, Save, MessageCircle, Download, RefreshCw, Palette, CheckCircle, Pencil, X, Lock, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { containerVariants, itemVariants, buttonHoverProps } from '../lib/animations';
import DonationCard from '../components/profile/DonationCard';
import { Card } from '../components/ui/Card';
import { useThemeStore, PRIMARY_COLORS, BACKGROUND_COLORS, type BackgroundTheme, type PrimaryTheme } from '../stores/useThemeStore';
import { applyTheme } from '../lib/theme';
import { getAppVersion } from '../lib/version';
import { isDiscordLoginSupported, openDiscordLogin } from '../lib/discordLogin';
import { apexToast } from '../lib/toast';
import { logger } from '../lib/logger';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import { calculatePasswordStrength } from '../lib/passwordStrength';
import OtpInput from '../components/OtpInput';

export default function Profile() {
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();
  const isDiscordRpcSupported = isDiscordRpcEnabledForPlatform(platform);
  const {
    profile,
    isLoading,
    updateRiderName,
    updateEmail,
    reauthenticate,
    updatePasswordWithNonce,
    verifyEmailChangeOtp,
    resendEmailChangeOtp,
    signOut,
  } = useUserProfile();
  const { isChecking, checkForUpdate, hasCheckedNoUpdate } = useAppUpdate();
  const { updateInfo, setShowModal } = useAppUpdateStore();
  const navigate = useNavigate();
  const [riderName, setRiderName] = useState(profile?.riderName || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [emailOtpCurrent, setEmailOtpCurrent] = useState('');
  const [emailOtpNew, setEmailOtpNew] = useState('');
  const [passwordOtp, setPasswordOtp] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isEmailOtpSent, setIsEmailOtpSent] = useState(false);
  const [isPasswordOtpSent, setIsPasswordOtpSent] = useState(false);
  const [isVerifyingEmailOtp, setIsVerifyingEmailOtp] = useState(false);
  const [isVerifyingPasswordOtp, setIsVerifyingPasswordOtp] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const { background, primary, setBackground, setPrimary } = useThemeStore();

  const otpLength = 6;
  const passwordStrength = calculatePasswordStrength(password);
  const isPasswordValid = passwordStrength.isValid;
  const passwordsMatch = password === passwordConfirm;
  const {
    enabled: rpcEnabled,
    shareRideStatus,
    shareBikeName,
    shareCity,
    rpcToken,
    setEnabled: setRpcEnabled,
    setShareRideStatus,
    setShareBikeName,
    setShareCity,
    setRpcToken,
  } = useDiscordRpcStore();


  // Update local state when profile changes
  useEffect(() => {
    if (!isEditingName) {
      setRiderName(profile?.riderName || '');
    }
  }, [profile?.riderName, isEditingName]);

  useEffect(() => {
    if (!isEditingEmail) {
      setEmail(profile?.email || '');
    }
  }, [profile?.email, isEditingEmail]);

  const handleSaveRiderName = async () => {
    setNameError(null);
    const trimmedName = riderName.trim();
    if (trimmedName === (profile?.riderName || '')) {
      apexToast.error('No changes to save');
      return;
    }

    setIsSavingName(true);
    try {
      await apexToast.promise(
        updateRiderName.mutateAsync(trimmedName),
        {
          loading: 'Saving...',
          success: 'Rider Name Updated',
          error: 'Update failed. Please try again.',
        },
        {
          errorAction: {
            label: 'Retry',
            onClick: () => {
              void handleSaveRiderName();
            },
          },
        }
      );
      setIsEditingName(false);
    } catch (err) {
      logger.error('Rider name update failed:', err);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleCancelRiderName = () => {
    setRiderName(profile?.riderName || '');
    setIsEditingName(false);
    setNameError(null);
  };

  const handleSaveEmail = async () => {
    setEmailError(null);
    const trimmedEmail = email.trim();
    if (trimmedEmail.length === 0) {
      setEmailError('Email is required');
      apexToast.error('Email is required');
      return;
    }

    if (trimmedEmail === (profile?.email || '')) {
      apexToast.error('No changes to save');
      return;
    }

    setIsSavingEmail(true);
    try {
      await apexToast.promise(
        updateEmail.mutateAsync(trimmedEmail),
        {
          loading: 'Sending code...',
          success: 'Code Sent',
          error: 'Update failed. Please try again.',
        },
        {
          errorAction: {
            label: 'Retry',
            onClick: () => {
              void handleSaveEmail();
            },
          },
        }
      );
      setPendingEmail(trimmedEmail);
      setIsEmailOtpSent(true);
      setEmailOtpCurrent('');
      setEmailOtpNew('');
    } catch (err) {
      logger.error('Email update failed:', err);
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!pendingEmail) {
      apexToast.error('Missing email for verification');
      return;
    }
    const currentEmail = profile?.email || '';
    const currentToken = emailOtpCurrent.trim();
    const newToken = emailOtpNew.trim();
    if (currentEmail.length === 0) {
      setEmailError('Missing current email');
      apexToast.error('Missing current email');
      return;
    }
    if (currentToken.length !== otpLength || newToken.length !== otpLength) {
      setEmailError('Enter both codes');
      apexToast.error('Enter both codes');
      return;
    }
    setEmailError(null);
    setIsVerifyingEmailOtp(true);
    try {
      await apexToast.promise(
        (async () => {
          await verifyEmailChangeOtp.mutateAsync({ email: currentEmail, token: currentToken });
          await verifyEmailChangeOtp.mutateAsync({ email: pendingEmail, token: newToken });
        })(),
        {
          loading: 'Verifying...',
          success: 'Email Verified',
          error: 'Invalid code. Please try again.',
        },
        {
          errorAction: {
            label: 'Retry',
            onClick: () => {
              void handleVerifyEmailOtp();
            },
          },
        }
      );
      setIsEmailOtpSent(false);
      setIsEditingEmail(false);
      setPendingEmail(null);
      setEmailOtpCurrent('');
      setEmailOtpNew('');
    } catch (err) {
      logger.error('Email OTP verification failed:', err);
    } finally {
      setIsVerifyingEmailOtp(false);
    }
  };

  const handleResendEmailOtp = async () => {
    if (!pendingEmail) {
      apexToast.error('Missing email for resend');
      return;
    }
    try {
      await apexToast.promise(
        resendEmailChangeOtp.mutateAsync(pendingEmail),
        {
          loading: 'Resending...',
          success: 'Code Resent',
          error: 'Resend failed. Please try again.',
        },
        {
          errorAction: {
            label: 'Retry',
            onClick: () => {
              void handleResendEmailOtp();
            },
          },
        }
      );
    } catch (err) {
      logger.error('Email OTP resend failed:', err);
    }
  };

  const handleCancelEmail = () => {
    setEmail(profile?.email || '');
    setIsEditingEmail(false);
    setEmailError(null);
    setPendingEmail(null);
    setIsEmailOtpSent(false);
    setEmailOtpCurrent('');
    setEmailOtpNew('');
  };

  const handleSavePassword = async () => {
    setPasswordError(null);
    const trimmedPassword = password.trim();
    if (trimmedPassword.length === 0) {
      apexToast.error('Password is required');
      return;
    }

    if (!isPasswordValid) {
      setPasswordError('Password does not meet requirements');
      apexToast.error('Password does not meet requirements');
      return;
    }

    if (trimmedPassword !== passwordConfirm) {
      setPasswordError('Passwords do not match');
      apexToast.error('Passwords do not match');
      return;
    }

    setIsSavingPassword(true);
    try {
      await apexToast.promise(
        reauthenticate.mutateAsync(),
        {
          loading: 'Sending code...',
          success: 'Code Sent',
          error: 'Reauthentication failed. Please try again.',
        },
        {
          errorAction: {
            label: 'Retry',
            onClick: () => {
              void handleSavePassword();
            },
          },
        }
      );
      setIsPasswordOtpSent(true);
      setPasswordOtp('');
    } catch (err) {
      logger.error('Password reauthentication failed:', err);
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleVerifyPasswordOtp = async () => {
    const trimmedPassword = password.trim();
    const token = passwordOtp.trim();
    if (trimmedPassword.length === 0) {
      apexToast.error('Password is required');
      return;
    }
    if (token.length !== otpLength) {
      setPasswordError('Enter the code from your email');
      apexToast.error('Enter the code from your email');
      return;
    }
    setPasswordError(null);
    setIsVerifyingPasswordOtp(true);
    try {
      await apexToast.promise(
        updatePasswordWithNonce.mutateAsync({ password: trimmedPassword, nonce: token }),
        {
          loading: 'Saving...',
          success: 'Password Updated',
          error: 'Invalid code. Please try again.',
        },
        {
          errorAction: {
            label: 'Retry',
            onClick: () => {
              void handleVerifyPasswordOtp();
            },
          },
        }
      );
      setIsPasswordOtpSent(false);
      setPassword('');
      setPasswordConfirm('');
      setPasswordOtp('');
      setIsPasswordModalOpen(false);
    } catch (err) {
      logger.error('Password OTP verification failed:', err);
    } finally {
      setIsVerifyingPasswordOtp(false);
    }
  };

  const handleCancelPassword = () => {
    setPassword('');
    setPasswordConfirm('');
    setPasswordError(null);
    setPasswordOtp('');
    setIsPasswordOtpSent(false);
    setIsPasswordModalOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await apexToast.promise(
        signOut.mutateAsync(),
        {
          loading: 'Signing out...',
          success: 'Signed Out',
          error: 'Sign out failed. Please try again.',
        },
        {
          errorAction: {
            label: 'Retry',
            onClick: () => {
              void handleSignOut();
            },
          },
        }
      );
      navigate('/login');
    } catch (err) {
      logger.error('Sign out failed:', err);
    }
  };

  const handleCheckForUpdate = async () => {
    if (updateInfo?.isAvailable) {
      setShowModal(true);
      return;
    }
    const result = await checkForUpdate(true, true);
    if (result?.isAvailable) {
      setShowModal(true);
    }
  };

  // Handle theme changes
  const handleBackgroundChange = (bg: BackgroundTheme) => {
    setBackground(bg);
    applyTheme();
  };

  const handlePrimaryChange = (prim: PrimaryTheme) => {
    setPrimary(prim);
    applyTheme();
  };

  const discordRpcSettings = (
    <div className="space-y-3 pt-2 border-t border-apex-white/20">
      <p className="text-xs text-apex-white/60">
        Rich Presence updates only on ride start and end to preserve battery.
      </p>
      {!isDiscordRpcSupported ? (
        <div className="text-xs text-apex-white/40">
          Discord RPC is available on Android only.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-apex-white">Discord</p>
              {rpcToken ? (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-apex-green text-sm">
                    <CheckCircle size={16} />
                    Connected
                  </span>
                  <motion.button
                    type="button"
                    onClick={() => setRpcToken('')}
                    className="text-xs text-apex-white/50 hover:text-apex-white/80 underline transition-colors"
                    {...buttonHoverProps}
                  >
                    Disconnect
                  </motion.button>
                </div>
              ) : (
                isDiscordLoginSupported() && (
                  <motion.button
                    type="button"
                    onClick={() =>
                      openDiscordLogin({
                        onTokenExtracted: (token) => {
                          setRpcToken(token);
                          apexToast.success('Connected');
                        },
                      })
                    }
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#5865F2]/60 bg-[#5865F2]/10 text-sm text-apex-white"
                    {...buttonHoverProps}
                  >
                    <MessageCircle size={16} />
                    Login with Discord
                  </motion.button>
                )
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-apex-white">Enable Rich Presence</p>
              <p className="text-xs text-apex-white/40">Toggle Discord updates during rides.</p>
            </div>
            <motion.button
              onClick={() => setRpcEnabled(!rpcEnabled)}
              className={`relative h-6 w-11 rounded-full border transition-colors ${rpcEnabled ? 'bg-apex-green/30 border-apex-green/60' : 'bg-apex-white/10 border-apex-white/20'
                }`}
              {...buttonHoverProps}
            >
              <span
                className={`absolute left-0.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full transition-transform ${rpcEnabled ? 'translate-x-5 bg-apex-green' : 'translate-x-0 bg-apex-white/60'
                  }`}
              />
            </motion.button>
          </div>
          <div className={`space-y-3 ${rpcEnabled ? '' : 'opacity-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-apex-white">Ride Status</p>
                <p className="text-xs text-apex-white/40">Share start/end status.</p>
              </div>
              <motion.button
                onClick={() => rpcEnabled && setShareRideStatus(!shareRideStatus)}
                className={`relative h-6 w-11 rounded-full border transition-colors ${shareRideStatus ? 'bg-apex-green/30 border-apex-green/60' : 'bg-apex-white/10 border-apex-white/20'
                  }`}
                {...buttonHoverProps}
              >
                <span
                  className={`absolute left-0.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full transition-transform ${shareRideStatus ? 'translate-x-5 bg-apex-green' : 'translate-x-0 bg-apex-white/60'
                    }`}
                />
              </motion.button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-apex-white">Bike Name</p>
                <p className="text-xs text-apex-white/40">Share your selected bike.</p>
              </div>
              <motion.button
                onClick={() => rpcEnabled && setShareBikeName(!shareBikeName)}
                className={`relative h-6 w-11 rounded-full border transition-colors ${shareBikeName ? 'bg-apex-green/30 border-apex-green/60' : 'bg-apex-white/10 border-apex-white/20'
                  }`}
                {...buttonHoverProps}
              >
                <span
                  className={`absolute left-0.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full transition-transform ${shareBikeName ? 'translate-x-5 bg-apex-green' : 'translate-x-0 bg-apex-white/60'
                    }`}
                />
              </motion.button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base text-apex-white">City</p>
                <p className="text-xs text-apex-white/40">Share your current city if available.</p>
              </div>
              <motion.button
                onClick={() => rpcEnabled && setShareCity(!shareCity)}
                className={`relative h-6 w-11 rounded-full border transition-colors ${shareCity ? 'bg-apex-green/30 border-apex-green/60' : 'bg-apex-white/10 border-apex-white/20'
                  }`}
                {...buttonHoverProps}
              >
                <span
                  className={`absolute left-0.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full transition-transform ${shareCity ? 'translate-x-5 bg-apex-green' : 'translate-x-0 bg-apex-white/60'
                    }`}
                />
              </motion.button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading profile..." />;
  }

  return (
    <div className="h-full">
      <motion.div
        className="p-6 pb-32 space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="space-y-4" variants={containerVariants}>
          {/* Page Header */}
          <motion.div
            className="flex items-center gap-4"
            variants={itemVariants}
          >
            <motion.button
              onClick={() => navigate(-1)}
              className="p-2 text-apex-white/60 hover:text-apex-white transition-colors"
              {...buttonHoverProps}
            >
              <ArrowLeft size={24} />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-bold text-apex-white tracking-tight">
                Profile
              </h1>
              <p className="text-sm text-apex-white/60 mt-1">
                Manage your account and preferences.
              </p>
            </div>
          </motion.div>
          {/* Account Section */}
          <Card padding="md" animate="item">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-apex-green/10">
                  <Mail size={20} className="text-apex-green" />
                </div>
                <h2 className="text-base font-semibold text-apex-white">Account</h2>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-xs text-apex-white/60 uppercase tracking-wide mb-1">Rider Name</p>
                  {isEditingName ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={riderName}
                        onChange={(e) => setRiderName(e.target.value)}
                        placeholder="Enter your rider name"
                        className="w-full px-4 py-2 bg-apex-black/50 border border-apex-white/20 rounded-lg text-base text-apex-white placeholder-apex-white/40 focus:outline-none focus:border-apex-green transition-colors"
                        autoFocus
                      />
                      {nameError && <div className="text-apex-red text-sm">{nameError}</div>}
                      <div className="flex flex-wrap gap-3">
                        <motion.button
                          onClick={handleSaveRiderName}
                          disabled={isSavingName}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-base font-semibold text-apex-black bg-apex-green disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          {...(isSavingName ? {} : buttonHoverProps)}
                        >
                          <Save size={18} />
                          {isSavingName ? 'Saving...' : 'Save'}
                        </motion.button>
                        <motion.button
                          onClick={handleCancelRiderName}
                          disabled={isSavingName}
                          className="px-3 py-1.5 border border-apex-white/20 text-base text-apex-white rounded-md hover:bg-apex-white/5 transition-colors disabled:opacity-50"
                          {...(isSavingName ? {} : buttonHoverProps)}
                        >
                          Cancel
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-apex-white">
                      {profile?.riderName || <span className="text-apex-white/40 italic">Not set</span>}
                    </p>
                  )}
                </div>
                {!isEditingName && (
                  <motion.button
                    onClick={() => setIsEditingName(true)}
                    className="p-2 border border-apex-white/20 text-apex-white rounded-lg hover:bg-apex-white/5 transition-colors"
                    aria-label="Edit rider name"
                    {...buttonHoverProps}
                  >
                    <Pencil size={16} />
                  </motion.button>
                )}
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-xs text-apex-white/60 uppercase tracking-wide mb-1">Email</p>
                  {isEditingEmail ? (
                    <div className="space-y-3">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        disabled={isEmailOtpSent}
                        className="w-full px-4 py-2 bg-apex-black/50 border border-apex-white/20 rounded-lg text-base text-apex-white placeholder-apex-white/40 focus:outline-none focus:border-apex-green transition-colors font-mono disabled:opacity-60"
                      />
                      {emailError && <div className="text-apex-red text-sm">{emailError}</div>}
                      {!isEmailOtpSent ? (
                        <div className="flex flex-wrap gap-3">
                          <motion.button
                            onClick={handleSaveEmail}
                            disabled={isSavingEmail}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-base font-semibold text-apex-black bg-apex-green disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            {...(isSavingEmail ? {} : buttonHoverProps)}
                          >
                            <Save size={18} />
                            {isSavingEmail ? 'Sending...' : 'Send Code'}
                          </motion.button>
                          <motion.button
                            onClick={handleCancelEmail}
                            disabled={isSavingEmail}
                            className="px-3 py-1.5 border border-apex-white/20 text-base text-apex-white rounded-md hover:bg-apex-white/5 transition-colors disabled:opacity-50"
                            {...(isSavingEmail ? {} : buttonHoverProps)}
                          >
                            Cancel
                          </motion.button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-3">
                          <motion.button
                            onClick={handleCancelEmail}
                            disabled={isVerifyingEmailOtp}
                            className="px-3 py-1.5 border border-apex-white/20 text-base text-apex-white rounded-md hover:bg-apex-white/5 transition-colors disabled:opacity-50"
                            {...(isVerifyingEmailOtp ? {} : buttonHoverProps)}
                          >
                            Cancel
                          </motion.button>
                        </div>
                      )}
                      {isEmailOtpSent ? (
                        <div className="space-y-3 pt-1">
                          <p className="text-xs text-apex-white/60">
                            Enter both codes to confirm the change.
                          </p>
                          <div className="space-y-2">
                            <label className="text-xs text-apex-white/60 uppercase tracking-wide">
                              Current Email Code
                            </label>
                            <OtpInput
                              length={otpLength}
                              value={emailOtpCurrent}
                              onChange={setEmailOtpCurrent}
                              ariaLabel="Current email code"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs text-apex-white/60 uppercase tracking-wide">
                              New Email Code
                            </label>
                            <OtpInput
                              length={otpLength}
                              value={emailOtpNew}
                              onChange={setEmailOtpNew}
                              ariaLabel="New email code"
                            />
                          </div>
                          <div className="flex flex-wrap gap-3">
                            <motion.button
                              onClick={handleVerifyEmailOtp}
                              disabled={isVerifyingEmailOtp}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-base font-semibold text-apex-black bg-apex-green disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              {...(isVerifyingEmailOtp ? {} : buttonHoverProps)}
                            >
                              <Save size={18} />
                              {isVerifyingEmailOtp ? 'Verifying...' : 'Verify'}
                            </motion.button>
                            <motion.button
                              onClick={handleResendEmailOtp}
                              disabled={isVerifyingEmailOtp}
                              className="px-3 py-1.5 border border-apex-white/20 text-base text-apex-white rounded-md hover:bg-apex-white/5 transition-colors disabled:opacity-50"
                              {...(isVerifyingEmailOtp ? {} : buttonHoverProps)}
                            >
                              Resend
                            </motion.button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-apex-white/40">Email changes require confirmation.</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-apex-white font-mono">{profile?.email || 'N/A'}</p>
                  )}
                </div>
                {!isEditingEmail && (
                  <motion.button
                    onClick={() => setIsEditingEmail(true)}
                    className="p-2 border border-apex-white/20 text-apex-white rounded-lg hover:bg-apex-white/5 transition-colors"
                    aria-label="Edit email"
                    {...buttonHoverProps}
                  >
                    <Pencil size={16} />
                  </motion.button>
                )}
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-xs text-apex-white/60 uppercase tracking-wide mb-1">Password</p>
                  <p className="text-sm text-apex-white/40">••••••••</p>
                </div>
                <motion.button
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="p-2 border border-apex-white/20 text-apex-white rounded-lg hover:bg-apex-white/5 transition-colors"
                  aria-label="Edit password"
                  {...buttonHoverProps}
                >
                  <Pencil size={16} />
                </motion.button>
              </div>
            </div>
          </Card>



          {/* Theme Settings Section */}
          <Card padding="md" animate="item"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-apex-green/10">
                <Palette size={20} className="text-apex-green" />
              </div>
              <h2 className="text-base font-semibold text-apex-white">Theme</h2>
            </div>

            <div className="space-y-6">
              {/* Background Theme */}
              <div>
                <p className="text-xs text-apex-white/60 uppercase tracking-wide mb-3">Background</p>
                <div className="flex gap-3">
                  {(['apex-black', 'oled-black'] as BackgroundTheme[]).map((bg) => (
                    <motion.button
                      key={bg}
                      onClick={() => handleBackgroundChange(bg)}
                      className={`flex-1 flex items-center justify-start gap-2 px-4 py-3 rounded-lg border-2 transition-all ${background === bg
                          ? 'border-apex-green bg-apex-green/10'
                          : 'border-apex-white/20 hover:border-apex-white/40'
                        }`}
                      {...buttonHoverProps}
                    >
                      <div
                        className="w-4 h-4 rounded-full border border-apex-white/30 shrink-0"
                        style={{ backgroundColor: BACKGROUND_COLORS[bg] }}
                      />
                      <span className="text-sm font-medium text-apex-white">
                        {bg === 'oled-black' ? 'OLED Black' : 'Apex Black'}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Primary Color */}
              <div>
                <p className="text-xs text-apex-white/60 uppercase tracking-wide mb-3">Primary Color</p>
                <div className="grid grid-cols-2 gap-3">
                  {(['apex-green', 'cyan', 'orange', 'amber'] as PrimaryTheme[]).map((prim) => {
                    const isSelected = primary === prim;
                    const primColor = PRIMARY_COLORS[prim];
                    return (
                      <motion.button
                        key={prim}
                        onClick={() => handlePrimaryChange(prim)}
                        className={`flex items-center justify-start gap-2 px-4 py-3 rounded-lg border-2 transition-all ${isSelected
                            ? ''
                            : 'border-apex-white/20 hover:border-apex-white/40'
                          }`}
                        style={{
                          borderColor: isSelected ? primColor : undefined,
                          backgroundColor: isSelected ? `${primColor}20` : undefined,
                        }}
                        {...buttonHoverProps}
                      >
                        <div
                          className="w-4 h-4 rounded-full border border-apex-white/30 shrink-0"
                          style={{ backgroundColor: primColor }}
                        />
                        <span className="text-sm font-medium text-apex-white">
                          {prim === 'apex-green' ? 'Apex Green' : prim.charAt(0).toUpperCase() + prim.slice(1)}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

          {/* Discord Integration Section */}
          <Card
            padding="md"
            animate="item"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-apex-green/10">
                <MessageCircle size={20} className="text-apex-green" />
              </div>
              <h2 className="text-base font-semibold text-apex-white">Discord Integration</h2>
            </div>

            {discordRpcSettings}
          </Card>

          {/* App Updates Section - Only show on native platforms */}
          {isNative && (
            <Card padding="md" animate="item">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-apex-green/10">
                  <Download size={20} className="text-apex-green" />
                </div>
                <h2 className="text-base font-semibold text-apex-white">App Updates</h2>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-apex-white/60">
                  Check for the latest version of Apex.
                </p>
                <motion.button
                  onClick={handleCheckForUpdate}
                  disabled={isChecking || hasCheckedNoUpdate}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-base font-semibold transition-colors w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed ${hasCheckedNoUpdate && !isChecking
                      ? 'text-apex-white/60 bg-apex-white/10'
                      : 'text-apex-black bg-apex-green'
                    }`}
                  {...(isChecking || hasCheckedNoUpdate ? {} : buttonHoverProps)}
                >
                  <RefreshCw size={18} className={isChecking ? 'animate-spin' : ''} />
                  {isChecking
                    ? 'Checking...'
                    : hasCheckedNoUpdate
                      ? 'No updates available'
                      : updateInfo?.isAvailable
                        ? 'Download Update'
                        : 'Check for Updates'}
                </motion.button>
                {updateInfo?.isAvailable && (
                  <div className="p-3 bg-apex-green/10 border border-apex-green/20 rounded-lg">
                    <p className="text-sm text-apex-green font-mono">
                      Update available: {updateInfo.latestVersion}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Support Development Section */}
          <DonationCard />

          {/* Sign Out Section */}
          <Card
            padding="md"
            animate="item"
          >
            <motion.button
              onClick={handleSignOut}
              disabled={signOut.isPending}
              className="flex items-center gap-2 px-4 py-2 text-base text-apex-red hover:bg-apex-red/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
              {...(signOut.isPending ? {} : buttonHoverProps)}
            >
              <LogOut size={18} />
              {signOut.isPending ? 'Signing out...' : 'Sign Out'}
            </motion.button>
          </Card>

          {/* Made with Love Footer */}
          <motion.div
            className="flex flex-col items-center justify-center gap-2 py-6"
            variants={itemVariants}
          >
            <p className="text-sm text-apex-white/40 font-mono">
              Made with <span className="text-apex-red">❤️</span> by{' '}
              <a
                href="https://github.com/Purukitto"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline transition-colors"
                style={{ color: PRIMARY_COLORS[primary] }}
              >
                Purukitto
              </a>
            </p>
            <p className="text-sm text-apex-white/40 font-mono">
              v{getAppVersion()}
            </p>
            <p className="text-xs text-apex-white/30 font-mono mt-2">
              Maps ©{' '}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline transition-colors"
              >
                OpenStreetMap
              </a>{' '}
              contributors
            </p>
          </motion.div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {isPasswordModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-apex-black/80 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              <Card padding="md" animate="none" hover={false}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-apex-green/10">
                      <Lock size={18} className="text-apex-green" />
                    </div>
                    <h3 className="text-base font-semibold text-apex-white">Update Password</h3>
                  </div>
                  <motion.button
                    onClick={handleCancelPassword}
                    disabled={isSavingPassword || isVerifyingPasswordOtp}
                    className="p-2 border border-apex-white/20 text-apex-white rounded-lg hover:bg-apex-white/5 transition-colors disabled:opacity-50"
                    {...buttonHoverProps}
                  >
                    <X size={16} />
                  </motion.button>
                </div>

                <div className="space-y-3">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New password"
                    className="w-full px-4 py-2 bg-apex-black/50 border border-apex-white/20 rounded-lg text-base text-apex-white placeholder-apex-white/40 focus:outline-none focus:border-apex-green transition-colors"
                  />
                  {password && (
                    <PasswordStrengthIndicator password={password} />
                  )}
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-2 bg-apex-black/50 border border-apex-white/20 rounded-lg text-base text-apex-white placeholder-apex-white/40 focus:outline-none focus:border-apex-green transition-colors"
                  />
                  {passwordConfirm && !passwordsMatch && (
                    <p className="text-sm text-apex-red">Passwords do not match</p>
                  )}
                  {passwordError && <div className="text-apex-red text-sm">{passwordError}</div>}

                  {!isPasswordOtpSent ? (
                    <div className="flex flex-wrap gap-3">
                      <motion.button
                        onClick={handleSavePassword}
                        disabled={isSavingPassword}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-base font-semibold text-apex-black bg-apex-green disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        {...(isSavingPassword ? {} : buttonHoverProps)}
                      >
                        <Save size={18} />
                        {isSavingPassword ? 'Sending...' : 'Send Code'}
                      </motion.button>
                      <motion.button
                        onClick={handleCancelPassword}
                        disabled={isSavingPassword}
                        className="px-3 py-1.5 border border-apex-white/20 text-base text-apex-white rounded-md hover:bg-apex-white/5 transition-colors disabled:opacity-50"
                        {...(isSavingPassword ? {} : buttonHoverProps)}
                      >
                        Cancel
                      </motion.button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-apex-white/60">Enter the code from your email.</p>
                      <OtpInput
                        length={otpLength}
                        value={passwordOtp}
                        onChange={setPasswordOtp}
                        ariaLabel="Password code"
                      />
                      <div className="flex flex-wrap gap-3">
                        <motion.button
                          onClick={handleVerifyPasswordOtp}
                          disabled={isVerifyingPasswordOtp}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-base font-semibold text-apex-black bg-apex-green disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          {...(isVerifyingPasswordOtp ? {} : buttonHoverProps)}
                        >
                          <Save size={18} />
                          {isVerifyingPasswordOtp ? 'Verifying...' : 'Verify'}
                        </motion.button>
                        <motion.button
                          onClick={handleCancelPassword}
                          disabled={isVerifyingPasswordOtp}
                          className="px-3 py-1.5 border border-apex-white/20 text-base text-apex-white rounded-md hover:bg-apex-white/5 transition-colors disabled:opacity-50"
                          {...(isVerifyingPasswordOtp ? {} : buttonHoverProps)}
                        >
                          Cancel
                        </motion.button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
