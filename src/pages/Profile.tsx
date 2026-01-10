import { useState, useEffect } from 'react';
import { useUserProfile } from '../hooks/useUserProfile';
import { useNavigate } from 'react-router-dom';
import { User, Mail, LogOut, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { containerVariants, itemVariants, buttonHoverProps } from '../lib/animations';

export default function Profile() {
  const { profile, isLoading, updateRiderName, signOut } = useUserProfile();
  const navigate = useNavigate();
  const [riderName, setRiderName] = useState(profile?.riderName || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-apex-white/60">Loading...</div>
      </div>
    );
  }


  return (
    <motion.div
      className="p-6 max-w-2xl"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >

      <motion.div className="space-y-6" variants={containerVariants}>
        {/* Email Section */}
        <motion.div
          className="border border-apex-white/20 rounded-lg p-6 bg-gradient-to-br from-white/5 to-transparent"
          variants={itemVariants}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-apex-green/10 rounded-lg">
              <Mail size={20} className="text-apex-green" />
            </div>
            <h2 className="text-lg font-semibold text-apex-white">Email</h2>
          </div>
          <p className="text-apex-white font-mono">{profile?.email || 'N/A'}</p>
        </motion.div>

        {/* Rider Name Section */}
        <motion.div
          className="border border-apex-white/20 rounded-lg p-6 bg-gradient-to-br from-white/5 to-transparent"
          variants={itemVariants}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-apex-green/10 rounded-lg">
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
                className="w-full px-4 py-2 bg-apex-black border border-apex-white/20 rounded-lg text-apex-white placeholder-apex-white/40 focus:outline-none focus:border-apex-green transition-colors"
                autoFocus
              />
              {error && (
                <div className="text-apex-red text-sm">{error}</div>
              )}
              <div className="flex gap-3">
                <motion.button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-apex-green text-apex-black font-semibold rounded-lg hover:bg-apex-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

        {/* Sign Out Section */}
        <motion.div
          className="border border-apex-white/20 rounded-lg p-6 bg-gradient-to-br from-white/5 to-transparent"
          variants={itemVariants}
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
      </motion.div>
    </motion.div>
  );
}
