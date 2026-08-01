import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useCurrencyStore } from '../store/currencyStore';
import toast from 'react-hot-toast';
import api from '../services/api';
import { FiUser, FiMail, FiLock, FiSave, FiMoon, FiSun, FiDollarSign } from 'react-icons/fi';
import { APP_VERSION, APP_NAME, APP_DESCRIPTION } from '../config/version';

export default function Settings() {
  const { user, updateUser } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const { currencyCode, setCurrency } = useCurrencyStore();
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [loading, setLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

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


  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account settings</p>
      </div>

      {/* Appearance */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Appearance</h2>
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center space-x-3">
            {isDark ? (
              <FiMoon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <FiSun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Dark Mode</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
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

      {/* Currency Settings */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiDollarSign className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Currency</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select your preferred currency for prices
              </p>
            </div>
          </div>
          <select
            value={currencyCode}
            onChange={(e) => {
              setCurrency(e.target.value);
              toast.success(`Currency changed to ${e.target.value}`);
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="USD">$ USD</option>
            <option value="EUR">€ EUR</option>
            <option value="GBP">£ GBP</option>
            <option value="JPY">¥ JPY</option>
            <option value="CAD">C$ CAD</option>
            <option value="AUD">A$ AUD</option>
            <option value="CHF">CHF CHF</option>
          </select>
        </div>
      </div>

      {/* Account Information */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Account Information</h2>
        
        {/* Profile Picture */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-4">
            {user?.profile_picture ? (
              <img
                src={user.profile_picture}
                alt={user.username}
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary-500 flex items-center justify-center text-white text-2xl font-bold border-2 border-gray-200 dark:border-gray-600">
                {(user?.display_name || user?.username || 'U')[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">Profile Picture</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Upload a profile picture to personalize your account
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  const formData = new FormData();
                  formData.append('image', file);

                  try {
                    const response = await api.post('/api/auth/profile-picture', formData, {
                      headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    updateUser(response.data.user);
                    toast.success('Profile picture updated successfully!');
                  } catch (error) {
                    toast.error(error.response?.data?.error || 'Failed to upload profile picture');
                  }
                }}
                className="text-sm text-gray-600 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/30 dark:file:text-primary-400"
              />
            </div>
          </div>
        </div>

        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <FiUser className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <div className="flex-grow">
              <p className="text-sm text-gray-600 dark:text-gray-400">Display Name</p>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 w-full px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="How you want to be called"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <FiUser className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Username</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{user?.username}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <FiMail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="w-5 h-5 flex items-center justify-center">
              <span className="text-sm">👤</span>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Role</p>
              <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">{user?.role}</p>
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

      {/* Change Password */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Change Password</h2>
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
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">About {APP_NAME}</h2>
        <div className="space-y-2 text-gray-600 dark:text-gray-400">
          <p>Version {APP_VERSION}</p>
          <p>{APP_DESCRIPTION}</p>
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
