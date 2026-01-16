import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useUserProfile } from '../hooks/useUserProfile';
import { useDiscord } from '../hooks/useDiscord';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAppUpdate } from '../hooks/useAppUpdate';
import { useAppUpdateStore } from '../stores/useAppUpdateStore';
import { useNavigate } from 'react-router-dom';
import { Mail, LogOut, Save, User, MessageCircle, Link2, Unlink, Download, RefreshCw, Palette } from 'lucide-react';
import { motion } from 'framer-motion';
import { containerVariants, itemVariants, buttonHoverProps, cardHoverProps } from '../lib/animations';
import DonationCard from '../components/profile/DonationCard';
import { useThemeStore, PRIMARY_COLORS, BACKGROUND_COLORS, type BackgroundTheme, type PrimaryTheme } from '../stores/useThemeStore';
import { applyTheme } from '../lib/theme';
import { getAppVersion } from '../lib/version';
import { logger } from '../lib/logger';

const DISCORD_BLURPLE = '#5865F2';

export default function Profile() {
  const isNative = Capacitor.isNativePlatform();
  const { profile, isLoading, updateRiderName, signOut } = useUserProfile();
  const { isConnected, isLoading: isDiscordLoading, linkDiscord, unlinkDiscord } = useDiscord();
  const { isChecking, checkForUpdate, hasCheckedNoUpdate } = useAppUpdate();
  const { updateInfo, setShowModal } = useAppUpdateStore();
  const navigate = useNavigate();
  const [riderName, setRiderName] = useState(profile?.riderName || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { background, primary, setBackground, setPrimary } = useThemeStore();
  

  // Update local state when profile changes
  useEffect(() => {
    if (profile?.riderName !== undefined && !isEditing) {
      setRiderName(profile.riderName || '');
    }
  }, [profile?.riderName, isEditing]);

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);
    try {
      await updateRiderName.mutateAsync(riderName.trim() || '');
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update rider name');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setRiderName(profile?.riderName || '');
    setIsEditing(false);
    setError(null);
  };

  const handleSignOut = async () => {
    try {
      await signOut.mutateAsync();
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign out');
    }
  };

  const handleLinkDiscord = async () => {
    try {
      await linkDiscord.mutateAsync();
    } catch (err) {
      // Error is handled by the hook's onError
      logger.error('Failed to link Discord:', err);
    }
  };

  const handleUnlinkDiscord = async () => {
    try {
      await unlinkDiscord.mutateAsync();
    } catch (err) {
      // Error is handled by the hook's onError
      logger.error('Failed to unlink Discord:', err);
    }
  };

  const handleCheckForUpdate = async () => {
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
        {/* Page Header with Logo */}

        <motion.div className="space-y-4" variants={containerVariants}>
          {/* Account Section */}
          <motion.div
            className="bg-gradient-to-br from-white/5 to-transparent rounded-lg p-6 border border-apex-white/20"
            variants={itemVariants}
            {...cardHoverProps}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-apex-green/10">
                <Mail size={20} className="text-apex-green" />
              </div>
              <h2 className="text-lg font-semibold text-apex-white">Account</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-apex-white/60 uppercase tracking-wide mb-1">Email</p>
                <p className="text-apex-white font-mono">{profile?.email || 'N/A'}</p>
              </div>
            </div>
          </motion.div>

          {/* Rider Name Section */}
          <motion.div
            className="bg-gradient-to-br from-white/5 to-transparent rounded-lg p-6 border border-apex-white/20"
            variants={itemVariants}
            {...cardHoverProps}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-apex-green/10">
                <User size={20} className="text-apex-green" />
              </div>
              <h2 className="text-lg font-semibold text-apex-white">Rider Name</h2>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={riderName}
                  onChange={(e) => setRiderName(e.target.value)}
                  placeholder="Enter your rider name"
                  className="w-full px-4 py-2 bg-apex-black/50 border border-apex-white/20 rounded-lg text-apex-white placeholder-apex-white/40 focus:outline-none focus:border-apex-green transition-colors"
                  autoFocus
                />
                {error && (
                  <div className="text-apex-red text-sm">{error}</div>
                )}
                <div className="flex gap-3">
                  <motion.button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-apex-black bg-apex-green disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    {...(isSaving ? {} : buttonHoverProps)}
                  >
                    <Save size={18} />
                    {isSaving ? 'Saving...' : 'Save'}
                  </motion.button>
                  <motion.button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="px-4 py-2 border border-apex-white/20 text-apex-white rounded-lg hover:bg-apex-white/5 transition-colors disabled:opacity-50"
                    {...(isSaving ? {} : buttonHoverProps)}
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-apex-white">
                  {profile?.riderName || (
                    <span className="text-apex-white/40 italic">Not set</span>
                  )}
                </p>
                <motion.button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 border border-apex-white/20 text-apex-white rounded-lg hover:bg-apex-white/5 transition-colors"
                  {...buttonHoverProps}
                >
                  Edit
                </motion.button>
              </div>
            )}
          </motion.div>

          

          {/* Theme Settings Section */}
          <motion.div
            className="bg-gradient-to-br from-white/5 to-transparent rounded-lg p-6 border border-apex-white/20"
            variants={itemVariants}
            {...cardHoverProps}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-apex-green/10">
                <Palette size={20} className="text-apex-green" />
              </div>
              <h2 className="text-lg font-semibold text-apex-white">Theme</h2>
            </div>

            <div className="space-y-6">
              {/* Background Theme */}
              <div>
                <p className="text-xs text-apex-white/60 uppercase tracking-wide mb-3">Background</p>
                <div className="flex gap-3">
                  {(['apex-black', 'pure-black'] as BackgroundTheme[]).map((bg) => (
                    <motion.button
                      key={bg}
                      onClick={() => handleBackgroundChange(bg)}
                      className={`flex-1 flex items-center justify-start gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                        background === bg
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
                        {bg === 'pure-black' ? 'Pure Black' : 'Apex Black'}
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
                        className={`flex items-center justify-start gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                          isSelected
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
          </motion.div>

          {/* Discord Integration Section */}
          <motion.div
            className="bg-gradient-to-br from-white/5 to-transparent rounded-lg p-6 border border-apex-white/20"
            variants={itemVariants}
            {...cardHoverProps}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${DISCORD_BLURPLE}20` }}>
                <MessageCircle size={20} style={{ color: DISCORD_BLURPLE }} />
              </div>
              <h2 className="text-lg font-semibold text-apex-white">Discord Integration</h2>
            </div>

            {isDiscordLoading ? (
              <div className="flex items-center justify-center py-4">
                <LoadingSpinner size="sm" />
              </div>
            ) : !isConnected ? (
              <div className="space-y-4">
                <p className="text-sm text-apex-white/60">
                  Connect your Discord account to share your ride data.
                </p>
                <motion.button
                  onClick={handleLinkDiscord}
                  disabled={linkDiscord.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-apex-white transition-colors w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: DISCORD_BLURPLE }}
                  {...(linkDiscord.isPending ? {} : buttonHoverProps)}
                >
                  <Link2 size={18} />
                  {linkDiscord.isPending ? 'Connecting...' : 'Link Discord'}
                </motion.button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: DISCORD_BLURPLE }} />
                    <span className="text-sm text-apex-white">Discord Connected</span>
                  </div>
                  <motion.button
                    onClick={handleUnlinkDiscord}
                    disabled={unlinkDiscord.isPending}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm border border-apex-white/20 text-apex-white/60 hover:bg-apex-white/5 hover:text-apex-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    {...(unlinkDiscord.isPending ? {} : buttonHoverProps)}
                  >
                    <Unlink size={16} />
                    {unlinkDiscord.isPending ? 'Unlinking...' : 'Unlink'}
                  </motion.button>
                </div>
                <p className="text-xs text-apex-white/40 pt-2 border-t border-apex-white/20">
                  Your Discord account is connected. Rich Presence features will be available in a future update.
                </p>
              </div>
            )}
          </motion.div>

          {/* App Updates Section - Only show on native platforms */}
          {isNative && (
            <motion.div
              className="bg-gradient-to-br from-white/5 to-transparent rounded-lg p-6 border border-apex-white/20"
              variants={itemVariants}
              {...cardHoverProps}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-apex-green/10">
                  <Download size={20} className="text-apex-green" />
                </div>
                <h2 className="text-lg font-semibold text-apex-white">App Updates</h2>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-apex-white/60">
                  Check for the latest version of Apex.
                </p>
                <motion.button
                  onClick={handleCheckForUpdate}
                  disabled={isChecking || hasCheckedNoUpdate}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed ${
                    hasCheckedNoUpdate && !isChecking
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
            </motion.div>
          )}

          {/* Support Development Section */}
          <DonationCard />

          {/* Sign Out Section */}
          <motion.div
            className="bg-gradient-to-br from-white/5 to-transparent rounded-lg p-6 border border-apex-white/20"
            variants={itemVariants}
            {...cardHoverProps}
          >
            <motion.button
              onClick={handleSignOut}
              disabled={signOut.isPending}
              className="flex items-center gap-2 px-4 py-2 text-apex-red hover:bg-apex-red/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
              {...(signOut.isPending ? {} : buttonHoverProps)}
            >
              <LogOut size={18} />
              {signOut.isPending ? 'Signing out...' : 'Sign Out'}
            </motion.button>
          </motion.div>

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

    </div>
  );
}
