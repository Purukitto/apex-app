import { useState, useEffect } from 'react';
import { useUserProfile } from '../hooks/useUserProfile';
import { useNavigate } from 'react-router-dom';
import { Mail, LogOut, Save, User, MessageCircle, Link2, Unlink } from 'lucide-react';
import { motion } from 'framer-motion';
import { containerVariants, itemVariants, buttonHoverProps, cardHoverProps } from '../lib/animations';

const NEON_LIME = '#bef264';
const DISCORD_BLURPLE = '#5865F2';

export default function Profile() {
  const { profile, isLoading, updateRiderName, signOut } = useUserProfile();
  const navigate = useNavigate();
  const [riderName, setRiderName] = useState(profile?.riderName || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Discord integration state (placeholder - will be connected to backend later)
  const [discordToken, setDiscordToken] = useState<string | null>(null);
  const [showBikeModel, setShowBikeModel] = useState(false);
  const [showCurrentCity, setShowCurrentCity] = useState(false);

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

  const handleLinkDiscord = () => {
    // Placeholder - will initiate OAuth2 flow later
    console.log('Link Discord clicked - OAuth2 flow will be implemented');
  };

  const handleUnlinkDiscord = () => {
    // Placeholder - will unlink Discord account later
    setDiscordToken(null);
    setShowBikeModel(false);
    setShowCurrentCity(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full bg-zinc-950">
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
            className="bg-zinc-900 rounded-apex p-6 border border-white/5"
            variants={itemVariants}
            {...cardHoverProps}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${NEON_LIME}20` }}>
                <Mail size={20} style={{ color: NEON_LIME }} />
              </div>
              <h2 className="text-lg font-semibold text-white">Account</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-white/60 uppercase tracking-wide mb-1">Email</p>
                <p className="text-white font-mono">{profile?.email || 'N/A'}</p>
              </div>
            </div>
          </motion.div>

          {/* Rider Name Section */}
          <motion.div
            className="bg-zinc-900 rounded-apex p-6 border border-white/5"
            variants={itemVariants}
            {...cardHoverProps}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${NEON_LIME}20` }}>
                <User size={20} style={{ color: NEON_LIME }} />
              </div>
              <h2 className="text-lg font-semibold text-white">Rider Name</h2>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={riderName}
                  onChange={(e) => setRiderName(e.target.value)}
                  placeholder="Enter your rider name"
                  className="w-full px-4 py-2 bg-zinc-800 border border-white/5 rounded-lg text-white placeholder-white/40 focus:outline-none transition-colors"
                  style={{ '--tw-ring-color': NEON_LIME } as React.CSSProperties}
                  autoFocus
                />
                {error && (
                  <div className="text-red-500 text-sm">{error}</div>
                )}
                <div className="flex gap-3">
                  <motion.button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    style={{ backgroundColor: NEON_LIME }}
                    {...(isSaving ? {} : buttonHoverProps)}
                  >
                    <Save size={18} />
                    {isSaving ? 'Saving...' : 'Save'}
                  </motion.button>
                  <motion.button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="px-4 py-2 border border-white/5 text-white rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
                    {...(isSaving ? {} : buttonHoverProps)}
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-white">
                  {profile?.riderName || (
                    <span className="text-white/40 italic">Not set</span>
                  )}
                </p>
                <motion.button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 border border-white/5 text-white rounded-lg hover:bg-zinc-800 transition-colors"
                  {...buttonHoverProps}
                >
                  Edit
                </motion.button>
              </div>
            )}
          </motion.div>

          {/* Discord Integration Section */}
          <motion.div
            className="bg-zinc-900 rounded-apex p-6 border border-white/5"
            variants={itemVariants}
            {...cardHoverProps}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${DISCORD_BLURPLE}20` }}>
                <MessageCircle size={20} style={{ color: DISCORD_BLURPLE }} />
              </div>
              <h2 className="text-lg font-semibold text-white">Discord Integration</h2>
            </div>

            {!discordToken ? (
              <div className="space-y-4">
                <p className="text-sm text-white/60">
                  Connect your Discord account to share your ride data.
                </p>
                <motion.button
                  onClick={handleLinkDiscord}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition-colors w-full justify-center"
                  style={{ backgroundColor: DISCORD_BLURPLE }}
                  {...buttonHoverProps}
                >
                  <Link2 size={18} />
                  Link Discord
                </motion.button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: DISCORD_BLURPLE }} />
                    <span className="text-sm text-white">Discord Connected</span>
                  </div>
                  <motion.button
                    onClick={handleUnlinkDiscord}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm border border-white/5 text-white/60 hover:bg-zinc-800 hover:text-white rounded-lg transition-colors"
                    {...buttonHoverProps}
                  >
                    <Unlink size={16} />
                    Unlink
                  </motion.button>
                </div>

                <div className="pt-2 space-y-3 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white">Show Bike Model</p>
                      <p className="text-xs text-white/40">Display your bike model in Discord status</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showBikeModel}
                        onChange={(e) => setShowBikeModel(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5865F2]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white">Show Current City</p>
                      <p className="text-xs text-white/40">Display your current city in Discord status</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showCurrentCity}
                        onChange={(e) => setShowCurrentCity(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5865F2]"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Sign Out Section */}
          <motion.div
            className="bg-zinc-900 rounded-apex p-6 border border-white/5"
            variants={itemVariants}
            {...cardHoverProps}
          >
            <motion.button
              onClick={handleSignOut}
              disabled={signOut.isPending}
              className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
              {...(signOut.isPending ? {} : buttonHoverProps)}
            >
              <LogOut size={18} />
              {signOut.isPending ? 'Signing out...' : 'Sign Out'}
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
