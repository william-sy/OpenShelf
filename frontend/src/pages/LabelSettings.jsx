import { useState, useEffect } from 'react';
import { FiSave, FiPrinter } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import ItemLabel from '../components/ItemLabel';

export default function LabelSettings() {
  const [settings, setSettings] = useState({
    baseUrl: '',
    labelWidth: 210,
    labelHeight: 297,
    orientation: 'portrait',
    qrSize: 180,
    coverSize: 60,
    fontSize: 100,
    showTitle: true,
    showType: true,
    showCreators: true,
    showCover: true,
    showIsbn: false,
    showPublisher: false,
    showYear: false,
    showLocation: false,
    showUrl: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Sample item for preview
  const sampleItem = {
    id: 1,
    title: 'The Great Gatsby',
    type: 'book',
    creators: [{ name: 'F. Scott Fitzgerald' }],
    cover_url: 'https://covers.openlibrary.org/b/id/8235855-M.jpg',
    isbn: '9780743273565',
    publisher: 'Scribner',
    publication_year: 1925,
    location: 'Shelf A3',
  };

  // Load settings from API on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/api/settings/labels');
      setSettings({
        ...response.data,
        baseUrl: response.data.baseUrl || window.location.origin
      });
    } catch (error) {
      console.error('Error loading label settings:', error);
      // Set default baseUrl if loading fails
      setSettings(prev => ({
        ...prev,
        baseUrl: window.location.origin
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate base URL
    if (!settings.baseUrl) {
      toast.error('Base URL is required');
      return;
    }

    try {
      new URL(settings.baseUrl);
    } catch {
      toast.error('Please enter a valid URL (e.g., https://openshelf.example.com)');
      return;
    }

    setSaving(true);
    try {
      await api.put('/api/settings/labels', settings);
      toast.success('Label settings saved!');
    } catch (error) {
      console.error('Error saving label settings:', error);
      toast.error('Failed to save label settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="text-gray-600 dark:text-gray-400 mt-4">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FiPrinter className="w-8 h-8 text-primary-600 dark:text-primary-400" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Label Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure QR code labels for your thermal printer
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Form */}
        <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Base URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Base URL *
          </label>
          <input
            type="url"
            name="baseUrl"
            value={settings.baseUrl}
            onChange={handleChange}
            placeholder="https://openshelf.example.com"
            className="input w-full"
            required
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            The URL where your OpenShelf instance is accessible. QR codes will link to this address.
          </p>
        </div>

        {/* Label Dimensions */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Label Dimensions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Width (mm)
              </label>
              <input
                type="number"
                name="labelWidth"
                value={settings.labelWidth}
                onChange={handleChange}
                min="20"
                max="500"
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Height (mm)
              </label>
              <input
                type="number"
                name="labelHeight"
                value={settings.labelHeight}
                onChange={handleChange}
                min="20"
                max="500"
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Orientation
              </label>
              <select
                name="orientation"
                value={settings.orientation}
                onChange={handleChange}
                className="input w-full"
                required
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Standard UPS label size: 210 × 297mm (A4). Adjust to match your thermal printer's label size.
          </p>
        </div>

        {/* Element Sizes */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Element Sizes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                QR Code Size (px)
              </label>
              <input
                type="number"
                name="qrSize"
                value={settings.qrSize}
                onChange={handleChange}
                min="50"
                max="400"
                step="10"
                className="input w-full"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Recommended: 120-200px for small labels, 180-250px for large labels
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cover Image Size (px)
              </label>
              <input
                type="number"
                name="coverSize"
                value={settings.coverSize}
                onChange={handleChange}
                min="30"
                max="200"
                step="10"
                className="input w-full"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Recommended: 40-60px for small labels, 60-100px for large labels
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Base Font Size (px)
              </label>
              <input
                type="number"
                name="fontSize"
                value={settings.fontSize}
                onChange={handleChange}
                min="6"
                max="24"
                step="1"
                className="input w-full"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Base font size - titles and info will scale proportionally. Recommended: 8-10px for small labels, 12-14px for large labels
              </p>
            </div>
          </div>
        </div>

        {/* Display Options */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            What to Show on Label
          </h3>
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="showCover"
                checked={settings.showCover}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Show cover image
              </span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="showTitle"
                checked={settings.showTitle}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Show title
              </span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="showType"
                checked={settings.showType}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Show item type
              </span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="showCreators"
                checked={settings.showCreators}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Show creators/authors
              </span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="showIsbn"
                checked={settings.showIsbn}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Show ISBN
              </span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="showPublisher"
                checked={settings.showPublisher}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Show publisher
              </span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="showYear"
                checked={settings.showYear}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Show year
              </span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="showLocation"
                checked={settings.showLocation}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Show location
              </span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="showUrl"
                checked={settings.showUrl}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Show URL at bottom
              </span>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={saving}
          >
            <FiSave className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>

        {/* Live Preview */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Label Preview
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            This is how your label will look when printed. Changes update in real-time.
          </p>
          
          <div 
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg overflow-auto bg-gray-50 dark:bg-gray-800 p-4 flex items-center justify-center"
            style={{ 
              minHeight: '400px',
              maxHeight: '600px',
            }}
          >
            <div 
              style={{ 
                transform: `scale(${Math.min(1, 300 / Math.max(settings.labelWidth, settings.labelHeight))})`,
                transformOrigin: 'center',
              }}
            >
              <ItemLabel item={sampleItem} settings={settings} />
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 space-y-1">
            <p>• Label size: {settings.labelWidth} × {settings.labelHeight} mm</p>
            <p>• Preview is scaled to fit - actual print will be full size</p>
            <p>• Sample book shown for demonstration</p>
          </div>
        </div>
      </div>
    </div>
  );
}
