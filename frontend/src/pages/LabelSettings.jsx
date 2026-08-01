import { useState, useEffect } from 'react';
import { FiSave, FiPrinter, FiRotateCcw } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import ItemLabel from '../components/ItemLabel';

// Common physical label sizes, each a self-consistent bundle (dimensions +
// QR/cover/font sizes scaled together) rather than just width/height -
// switching presets shouldn't leave a tiny thermal label with a QR code
// sized for a full A4 sheet. The old hardcoded default (210x297mm) was
// framed as "Standard" even though the page's own header promises settings
// "for your thermal printer" - real thermal label stock is nowhere near
// A4-sized, so a first-timer accepting the default got a broken print with
// no explanation why. It's kept here only as the explicit "Full sheet"
// option, not the implied default.
const SIZE_PRESETS = {
  smallThermal: {
    label: 'Small thermal label (40 × 30mm)',
    labelWidth: 40, labelHeight: 30, qrSize: 70, coverSize: 26, fontSize: 6,
  },
  wideThermal: {
    label: 'Wide thermal label (62 × 29mm)',
    labelWidth: 62, labelHeight: 29, qrSize: 65, coverSize: 24, fontSize: 6,
  },
  fullSheet: {
    label: 'Full sheet / A4 (210 × 297mm, laser/inkjet)',
    labelWidth: 210, labelHeight: 297, qrSize: 180, coverSize: 60, fontSize: 12,
  },
};

const DEFAULT_SETTINGS = {
  baseUrl: '',
  labelWidth: SIZE_PRESETS.fullSheet.labelWidth,
  labelHeight: SIZE_PRESETS.fullSheet.labelHeight,
  qrSize: SIZE_PRESETS.fullSheet.qrSize,
  coverSize: SIZE_PRESETS.fullSheet.coverSize,
  fontSize: SIZE_PRESETS.fullSheet.fontSize,
  orientation: 'portrait',
  imageDpi: 302,
  textAlign: 'left',
  showSpine: false,
  spineWidth: 10,
  mirrorLayout: false,
  showTitle: true,
  showType: true,
  showCreators: true,
  showCover: true,
  showIsbn: false,
  showPublisher: false,
  showYear: false,
  showLocation: false,
  showUrl: true,
};

export default function LabelSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [savedSettings, setSavedSettings] = useState(null);
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
      const data = response.data;
      const loaded = {
        baseUrl: data.baseUrl || window.location.origin,
        labelWidth: Number(data.labelWidth) || DEFAULT_SETTINGS.labelWidth,
        labelHeight: Number(data.labelHeight) || DEFAULT_SETTINGS.labelHeight,
        orientation: data.orientation || 'portrait',
        qrSize: Number(data.qrSize) || DEFAULT_SETTINGS.qrSize,
        coverSize: Number(data.coverSize) || DEFAULT_SETTINGS.coverSize,
        fontSize: Number(data.fontSize) || DEFAULT_SETTINGS.fontSize,
        imageDpi: Number(data.imageDpi) || 302,
        textAlign: data.textAlign || 'left',
        showSpine: Boolean(data.showSpine),
        spineWidth: Number(data.spineWidth) || 10,
        mirrorLayout: Boolean(data.mirrorLayout),
        showTitle: data.showTitle !== undefined ? Boolean(data.showTitle) : true,
        showType: data.showType !== undefined ? Boolean(data.showType) : true,
        showCreators: data.showCreators !== undefined ? Boolean(data.showCreators) : true,
        showCover: data.showCover !== undefined ? Boolean(data.showCover) : true,
        showIsbn: Boolean(data.showIsbn),
        showPublisher: Boolean(data.showPublisher),
        showYear: Boolean(data.showYear),
        showLocation: Boolean(data.showLocation),
        showUrl: data.showUrl !== undefined ? Boolean(data.showUrl) : true,
      };
      setSettings(loaded);
      setSavedSettings(loaded);
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
      setSavedSettings(settings);
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
    let finalValue = value;
    
    // Convert number inputs to actual numbers
    if (type === 'number') {
      finalValue = value === '' ? '' : Number(value);
    } else if (type === 'checkbox') {
      finalValue = checked;
    }
    
    setSettings(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const applyPreset = (presetKey) => {
    const preset = SIZE_PRESETS[presetKey];
    if (!preset) return;
    setSettings(prev => ({
      ...prev,
      labelWidth: preset.labelWidth,
      labelHeight: preset.labelHeight,
      qrSize: preset.qrSize,
      coverSize: preset.coverSize,
      fontSize: preset.fontSize,
    }));
  };

  const handleResetDefaults = () => {
    if (!window.confirm('Reset all label settings to defaults? This discards unsaved changes.')) return;
    setSettings({ ...DEFAULT_SETTINGS, baseUrl: settings.baseUrl });
    toast.success('Reset to defaults - click Save to apply');
  };

  const handleRevertToSaved = () => {
    if (!savedSettings) return;
    setSettings(savedSettings);
    toast.success('Reverted to last saved settings');
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

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quick preset
            </label>
            <select
              onChange={(e) => e.target.value && applyPreset(e.target.value)}
              defaultValue=""
              className="input w-full"
            >
              <option value="" disabled>Choose a common label size...</option>
              {Object.entries(SIZE_PRESETS).map(([key, preset]) => (
                <option key={key} value={key}>{preset.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Sets width, height, QR size, cover size, and font size together. You can still fine-tune any value below.
            </p>
          </div>

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
            Use a preset above, or enter your label roll/sheet's exact dimensions here. 210 × 297mm is a full A4 sheet (laser/inkjet) - most thermal label rolls are much smaller.
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

        {/* Layout & Print Options */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Layout & Print Options
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Image DPI (Quality)
              </label>
              <input
                type="number"
                name="imageDpi"
                value={settings.imageDpi}
                onChange={handleChange}
                min="72"
                max="600"
                step="10"
                className="input w-full"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Higher DPI = better quality but larger file. Recommended: 300 for print, 150 for screen
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Text Alignment
              </label>
              <select
                name="textAlign"
                value={settings.textAlign}
                onChange={handleChange}
                className="input w-full"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Alignment for title and item information
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Spine Width (mm)
              </label>
              <input
                type="number"
                name="spineWidth"
                value={settings.spineWidth}
                onChange={handleChange}
                min="0"
                max="50"
                step="1"
                className="input w-full"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Book spine thickness for wrap-around labels. Set to 0 if not needed
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="showSpine"
                checked={settings.showSpine}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Show spine indicator (for wrap-around labels)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="mirrorLayout"
                checked={settings.mirrorLayout}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Mirror layout (QR on right, info on left - for back cover with QR on front)
              </span>
            </label>
          </div>
        </div>

        {/* Display Options - grouped into 3 subsections instead of one flat
            8-item list, each exposed as a real <fieldset>/<legend> so the
            grouping is available to assistive tech, not just visual proximity */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-5">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            What to Show on Label
          </h3>

          <fieldset>
            <legend className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-500 mb-2">
              Core identity
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="showCover"
                  checked={settings.showCover}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Show cover image</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="showTitle"
                  checked={settings.showTitle}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Show title</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="showType"
                  checked={settings.showType}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Show item type</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="showCreators"
                  checked={settings.showCreators}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Show creators/authors</span>
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-500 mb-2">
              Bibliographic metadata
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="showIsbn"
                  checked={settings.showIsbn}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Show ISBN</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="showPublisher"
                  checked={settings.showPublisher}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Show publisher</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="showYear"
                  checked={settings.showYear}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Show year</span>
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-500 mb-2">
              Footer
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="showLocation"
                  checked={settings.showLocation}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Show location</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="showUrl"
                  checked={settings.showUrl}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Show URL at bottom</span>
              </label>
            </div>
          </fieldset>
        </div>

        {/* Save Button */}
        <div className="flex justify-between items-center pt-4 flex-wrap gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="btn btn-secondary flex items-center gap-2"
            >
              <FiRotateCcw className="w-4 h-4" />
              Reset to Defaults
            </button>
            {savedSettings && (
              <button
                type="button"
                onClick={handleRevertToSaved}
                className="btn btn-secondary flex items-center gap-2"
              >
                Revert to Last Saved
              </button>
            )}
          </div>
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
