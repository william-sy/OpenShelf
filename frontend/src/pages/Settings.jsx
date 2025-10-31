import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import toast from 'react-hot-toast';
import api from '../services/api';
import { FiUser, FiMail, FiLock, FiSave, FiMoon, FiSun, FiKey } from 'react-icons/fi';

export default function Settings() {
  const { user, updateUser } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [loading, setLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingApiSettings, setSavingApiSettings] = useState(false);
  const [apiSettings, setApiSettings] = useState({
    tmdb_api_key: '',
    jellyfin_url: '',
    jellyfin_api_key: '',
    comicvine_api_key: '',
  });

  useEffect(() => {
    // Load API settings on component mount
    const loadApiSettings = async () => {
      try {
        const response = await api.get('/api/settings/apis');
        setApiSettings(response.data);
      } catch (error) {
        console.error('Failed to load API settings:', error);
      }
    };
    loadApiSettings();
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwords.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success('Password changed successfully');
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const response = await api.put('/api/auth/profile', {
        display_name: displayName || null,
      });
      updateUser(response.data.user);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleApiSettingsUpdate = async (e) => {
    e.preventDefault();
    setSavingApiSettings(true);
    try {
      await api.put('/api/settings/apis', apiSettings);
      toast.success('API settings updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update API settings');
    } finally {
      setSavingApiSettings(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 mt-1">Manage your account settings</p>
      </div>

      {/* Appearance */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100 mb-4">Appearance</h2>
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center space-x-3">
            {isDark ? (
              <FiMoon className="w-5 h-5 text-gray-600 dark:text-gray-400 dark:text-gray-400" />
            ) : (
              <FiSun className="w-5 h-5 text-gray-600 dark:text-gray-400 dark:text-gray-400" />
            )}
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100 dark:text-gray-100">Dark Mode</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">
                {isDark ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            style={{ backgroundColor: isDark ? '#0ea5e9' : '#d1d5db' }}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isDark ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Account Information */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100 mb-4">Account Information</h2>
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <FiUser className="w-5 h-5 text-gray-600 dark:text-gray-400 dark:text-gray-400" />
            <div className="flex-grow">
              <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">Display Name</p>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 w-full px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="How you want to be called"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <FiUser className="w-5 h-5 text-gray-600 dark:text-gray-400 dark:text-gray-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">Username</p>
              <p className="font-medium text-gray-900 dark:text-gray-100 dark:text-gray-100">{user?.username}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <FiMail className="w-5 h-5 text-gray-600 dark:text-gray-400 dark:text-gray-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">Email</p>
              <p className="font-medium text-gray-900 dark:text-gray-100 dark:text-gray-100">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="w-5 h-5 flex items-center justify-center">
              <span className="text-sm">👤</span>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">Role</p>
              <p className="font-medium text-gray-900 dark:text-gray-100 dark:text-gray-100 capitalize">{user?.role}</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="btn btn-primary disabled:opacity-50"
          >
            <FiSave className="inline mr-2" />
            {savingProfile ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* API Settings */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <FiKey className="w-5 h-5" />
          API Settings
        </h2>
        <form onSubmit={handleApiSettingsUpdate} className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Configure API keys for enhanced features like movie metadata lookup (TMDB) and media server integration (Jellyfin).
              These settings are optional but enable additional functionality.
            </p>
          </div>

          <div>
            <label className="label">TMDB API Key</label>
            <input
              type="password"
              value={apiSettings.tmdb_api_key}
              onChange={(e) => setApiSettings({ ...apiSettings, tmdb_api_key: e.target.value })}
              className="input"
              placeholder="Your TMDB API key for movie/TV metadata"
            />
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              Get your API key at{' '}
              <a
                href="https://www.themoviedb.org/settings/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                themoviedb.org/settings/api
              </a>
            </p>
          </div>

          <div>
            <label className="label">Jellyfin Server URL</label>
            <input
              type="text"
              value={apiSettings.jellyfin_url}
              onChange={(e) => setApiSettings({ ...apiSettings, jellyfin_url: e.target.value })}
              className="input"
              placeholder="http://your-jellyfin-server:8096"
            />
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              The URL of your Jellyfin media server (e.g., http://192.168.1.100:8096)
            </p>
          </div>

          <div>
            <label className="label">Jellyfin API Key</label>
            <input
              type="password"
              value={apiSettings.jellyfin_api_key}
              onChange={(e) => setApiSettings({ ...apiSettings, jellyfin_api_key: e.target.value })}
              className="input"
              placeholder="Your Jellyfin API key"
            />
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              Generate an API key in your Jellyfin Dashboard → API Keys section
            </p>
          </div>

          <div>
            <label className="label">Comic Vine API Key</label>
            <input
              type="password"
              value={apiSettings.comicvine_api_key}
              onChange={(e) => setApiSettings({ ...apiSettings, comicvine_api_key: e.target.value })}
              className="input"
              placeholder="Your Comic Vine API key"
            />
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              Get your free API key at{' '}
              <a
                href="https://comicvine.gamespot.com/api/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                comicvine.gamespot.com/api
              </a>
            </p>
          </div>

          <button
            type="submit"
            disabled={savingApiSettings}
            className="btn btn-primary disabled:opacity-50"
          >
            <FiSave className="inline mr-2" />
            {savingApiSettings ? 'Saving...' : 'Save API Settings'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100 mb-4">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={passwords.currentPassword}
                onChange={(e) =>
                  setPasswords({ ...passwords, currentPassword: e.target.value })
                }
                className="input pl-10"
                placeholder="Enter current password"
                required
              />
            </div>
          </div>

          <div>
            <label className="label">New Password</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={passwords.newPassword}
                onChange={(e) =>
                  setPasswords({ ...passwords, newPassword: e.target.value })
                }
                className="input pl-10"
                placeholder="Enter new password (min 6 characters)"
                required
                minLength={6}
              />
            </div>
          </div>

          <div>
            <label className="label">Confirm New Password</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={passwords.confirmPassword}
                onChange={(e) =>
                  setPasswords({ ...passwords, confirmPassword: e.target.value })
                }
                className="input pl-10"
                placeholder="Confirm new password"
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary disabled:opacity-50"
          >
            <FiSave className="inline mr-2" />
            {loading ? 'Changing Password...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* About */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100 mb-4">About OpenShelf</h2>
        <div className="space-y-2 text-gray-600 dark:text-gray-400 dark:text-gray-400">
          <p>Version 1.0.0</p>
          <p>A modern, self-hosted library management system for your physical media collection.</p>
          <p className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
            <a
              href="https://github.com/william-sy/OpenShelf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              View on GitHub →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
