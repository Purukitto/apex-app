import { useState, useEffect } from 'react';
import { useUserProfile } from '../hooks/useUserProfile';
import { useNavigate } from 'react-router-dom';
import { User, Mail, LogOut, Save } from 'lucide-react';

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
        <h1 className="text-2xl font-bold text-apex-white mb-4">Profile</h1>
        <div className="text-apex-white/60">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-apex-white mb-6">Profile</h1>

      <div className="space-y-6">
        {/* Email Section */}
        <div className="border border-apex-white/20 rounded-lg p-6 bg-apex-black">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-apex-green/10 rounded-lg">
              <Mail size={20} className="text-apex-green" />
            </div>
            <h2 className="text-lg font-semibold text-apex-white">Email</h2>
          </div>
          <p className="text-apex-white font-mono">{profile?.email || 'N/A'}</p>
        </div>

        {/* Rider Name Section */}
        <div className="border border-apex-white/20 rounded-lg p-6 bg-apex-black">
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
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-apex-green text-apex-black font-semibold rounded-lg hover:bg-apex-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save size={18} />
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-4 py-2 border border-apex-white/20 text-apex-white rounded-lg hover:bg-apex-white/5 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-apex-white">
                {profile?.riderName || (
                  <span className="text-apex-white/40 italic">Not set</span>
                )}
              </p>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 border border-apex-white/20 text-apex-white rounded-lg hover:bg-apex-white/5 transition-colors"
              >
                Edit
              </button>
            </div>
          )}
        </div>

        {/* Sign Out Section */}
        <div className="border border-apex-white/20 rounded-lg p-6 bg-apex-black">
          <button
            onClick={handleSignOut}
            disabled={signOut.isPending}
            className="flex items-center gap-2 px-4 py-2 text-apex-red hover:bg-apex-red/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
          >
            <LogOut size={18} />
            {signOut.isPending ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </div>
    </div>
  );
}
