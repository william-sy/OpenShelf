import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import api from '../services/api';
import { FiKey, FiSave, FiCheck, FiShield } from 'react-icons/fi';

export default function ApiSettings() {
  const { isAdmin } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiSettings, setApiSettings] = useState({
    tmdb_api_key: '',
    jellyfin_url: '',
    jellyfin_api_key: '',
    comicvine_api_key: '',
  });
  const [originalApiSettings, setOriginalApiSettings] = useState({
    tmdb_api_key: '',
    jellyfin_url: '',
    jellyfin_api_key: '',
    comicvine_api_key: '',
  });
  const [allowRegistration, setAllowRegistration] = useState(true);

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/');
      return;
    }
    loadApiSettings();
  }, []);

  const loadApiSettings = async () => {
    try {
      const response = await api.get('/api/settings/apis');
      setOriginalApiSettings(response.data);
      setApiSettings({
        tmdb_api_key: response.data.tmdb_api_key ? '••••••••••••••••' : '',
        jellyfin_url: response.data.jellyfin_url || '',
        jellyfin_api_key: response.data.jellyfin_api_key ? '••••••••••••••••' : '',
        comicvine_api_key: response.data.comicvine_api_key ? '••••••••••••••••' : '',
      });
      if (response.data.allow_registration !== undefined) {
        setAllowRegistration(response.data.allow_registration);
      }
    } catch (error) {
      console.error('Failed to load API settings:', error);
      toast.error('Failed to load API settings');
    } finally {
      setLoading(false);
    }
  };

  const handleApiSettingsUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Only send keys that have been modified (not the placeholder)
      const updatedSettings = {
        tmdb_api_key: apiSettings.tmdb_api_key === '••••••••••••••••' ? originalApiSettings.tmdb_api_key : apiSettings.tmdb_api_key,
        jellyfin_url: apiSettings.jellyfin_url,
        jellyfin_api_key: apiSettings.jellyfin_api_key === '••••••••••••••••' ? originalApiSettings.jellyfin_api_key : apiSettings.jellyfin_api_key,
        comicvine_api_key: apiSettings.comicvine_api_key === '••••••••••••••••' ? originalApiSettings.comicvine_api_key : apiSettings.comicvine_api_key,
        allow_registration: allowRegistration,
      };

      await api.put('/api/settings/apis', updatedSettings);
      toast.success('API settings updated successfully');

      // Reload to show updated placeholders
      const response = await api.get('/api/settings/apis');
      setOriginalApiSettings(response.data);
      setApiSettings({
        tmdb_api_key: response.data.tmdb_api_key ? '••••••••••••••••' : '',
        jellyfin_url: response.data.jellyfin_url || '',
        jellyfin_api_key: response.data.jellyfin_api_key ? '••••••••••••••••' : '',
        comicvine_api_key: response.data.comicvine_api_key ? '••••••••••••••••' : '',
      });
      if (response.data.allow_registration !== undefined) {
        setAllowRegistration(response.data.allow_registration);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update API settings');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin()) {
    return null;
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="text-gray-600 dark:text-gray-400 mt-4">Loading API settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <FiKey className="w-8 h-8 text-primary-600 dark:text-primary-400" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            API Settings
            <span className="text-xs font-normal text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <FiShield className="w-3 h-3" />
              Admin Only
            </span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Shared, system-wide integrations and access settings
          </p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleApiSettingsUpdate} className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Configure API keys for enhanced features like movie metadata lookup (TMDB) and media server integration (Jellyfin).
              These settings are shared across all users and are optional but enable additional functionality.
            </p>
          </div>

          <div>
            <label className="label">TMDB API Key</label>
            <div className="relative">
              <input
                type="password"
                value={apiSettings.tmdb_api_key}
                onChange={(e) => setApiSettings({ ...apiSettings, tmdb_api_key: e.target.value })}
                className="input pr-10"
                placeholder="Your TMDB API key for movie/TV metadata"
              />
              {originalApiSettings.tmdb_api_key && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-green-600 dark:text-green-400">
                  <FiCheck className="w-4 h-4" />
                  <span className="text-xs font-medium">Set</span>
                </div>
              )}
            </div>
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
            <div className="relative">
              <input
                type="password"
                value={apiSettings.jellyfin_api_key}
                onChange={(e) => setApiSettings({ ...apiSettings, jellyfin_api_key: e.target.value })}
                className="input pr-10"
                placeholder="Your Jellyfin API key"
              />
              {originalApiSettings.jellyfin_api_key && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-green-600 dark:text-green-400">
                  <FiCheck className="w-4 h-4" />
                  <span className="text-xs font-medium">Set</span>
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              Generate an API key in your Jellyfin Dashboard → API Keys section
            </p>
          </div>

          <div>
            <label className="label">Comic Vine API Key</label>
            <div className="relative">
              <input
                type="password"
                value={apiSettings.comicvine_api_key}
                onChange={(e) => setApiSettings({ ...apiSettings, comicvine_api_key: e.target.value })}
                className="input pr-10"
                placeholder="Your Comic Vine API key"
              />
              {originalApiSettings.comicvine_api_key && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-green-600 dark:text-green-400">
                  <FiCheck className="w-4 h-4" />
                  <span className="text-xs font-medium">Set</span>
                </div>
              )}
            </div>
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

          {/* User Registration Toggle */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allowRegistration}
                onChange={(e) => setAllowRegistration(e.target.checked)}
                className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <div>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  Allow New User Registration
                </span>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  When disabled, new users cannot create accounts. Only administrators can create new users.
                </p>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary disabled:opacity-50"
          >
            <FiSave className="inline mr-2" />
            {saving ? 'Saving...' : 'Save API Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}
