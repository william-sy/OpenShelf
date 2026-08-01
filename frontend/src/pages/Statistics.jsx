import { useEffect, useState } from 'react';
import {
  BarChart, Bar, PieChart, Pie, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { FiTrendingUp, FiDollarSign, FiPackage, FiHeart, FiAward, FiStar, FiAlertCircle } from 'react-icons/fi';
import { useCurrencyStore } from '../store/currencyStore';
import { useThemeStore } from '../store/themeStore';
import { getMediaTypeMeta } from '../utils/mediaType';
import api from '../services/api';

// Single accent used for one-series charts (rating/condition/timeline) -
// the app's own primary token, not an arbitrary hex pulled from nowhere.
const PRIMARY_CHART_COLOR = '#0284c7';

export default function Statistics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { formatPrice } = useCurrencyStore();
  const { isDark } = useThemeStore();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/items/stats/detailed');
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setError(err.response?.data?.error || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  // Theme-aware chart chrome - previously hardcoded to dark-theme hex values
  // regardless of the app's actual light/dark mode.
  const chartTheme = {
    grid: isDark ? '#374151' : '#e5e7eb',
    axis: isDark ? '#9ca3af' : '#6b7280',
    tooltipBg: isDark ? '#1f2937' : '#ffffff',
    tooltipBorder: isDark ? '#374151' : '#e5e7eb',
    tooltipText: isDark ? '#f3f4f6' : '#111827',
  };
  const tooltipStyle = {
    backgroundColor: chartTheme.tooltipBg,
    border: `1px solid ${chartTheme.tooltipBorder}`,
    borderRadius: '0.5rem',
    color: chartTheme.tooltipText,
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="text-gray-600 dark:text-gray-400 mt-4">Loading statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-900 dark:text-gray-100 font-medium mb-1">Couldn't load statistics</p>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button onClick={fetchStats} className="btn btn-primary">Try again</button>
      </div>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <div className="text-center py-12">
        <FiPackage className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
          No statistics yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Add items to your collection to see stats here.
        </p>
      </div>
    );
  }

  const typeData = Object.entries(stats.byType).map(([type, value]) => ({
    type,
    name: getMediaTypeMeta(type).label,
    value,
    color: getMediaTypeMeta(type).chart,
  }));

  const ratingData = Object.entries(stats.byRating).map(([name, value]) => ({
    name: `${name} Stars`,
    value
  }));

  const conditionData = Object.entries(stats.byCondition).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <FiTrendingUp className="text-primary-600 dark:text-primary-400" />
          Collection Statistics
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Insights and analytics for your library
        </p>
      </div>

      {/* Key Metrics */}
      <div>
        <h2 className="sr-only">Key Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {stats.total}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                <FiPackage className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Favorites</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {stats.favoriteCount}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <FiStar className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Average Rating</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {stats.averageRating > 0 ? `${stats.averageRating} ★` : 'N/A'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {stats.ratedItemsCount} rated items
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <FiStar className="w-6 h-6 text-yellow-600 dark:text-yellow-400 fill-current" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Wishlist Items</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {stats.wishlistCount}
                </p>
              </div>
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
                <FiHeart className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {formatPrice(stats.totalValue)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <FiDollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Item Types</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {Object.keys(stats.byType).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                <FiAward className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Items by Type */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Items by Type
          </h2>
          <p className="sr-only">
            {typeData.map((d) => `${d.name}: ${d.value} items`).join('. ')}
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                dataKey="value"
              >
                {typeData.map((entry) => (
                  <Cell key={entry.type} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Items by Rating */}
        {ratingData.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Items by Rating
            </h2>
            <p className="sr-only">
              {ratingData.map((d) => `${d.name}: ${d.value} items`).join('. ')}
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ratingData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="name" stroke={chartTheme.axis} />
                <YAxis stroke={chartTheme.axis} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill={PRIMARY_CHART_COLOR} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Acquisition Timeline */}
        {stats.timeline.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Acquisition Timeline
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-500 -mt-3 mb-4">
              Items added per year, by date added to your library.
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="year" stroke={chartTheme.axis} />
                <YAxis stroke={chartTheme.axis} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={PRIMARY_CHART_COLOR}
                  strokeWidth={2}
                  name="Items Added"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Items by Condition */}
        {conditionData.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Items by Condition
            </h2>
            <p className="sr-only">
              {conditionData.map((d) => `${d.name}: ${d.value} items`).join('. ')}
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conditionData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="name" stroke={chartTheme.axis} />
                <YAxis stroke={chartTheme.axis} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill={PRIMARY_CHART_COLOR} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Creators */}
        {stats.topCreators.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Top Creators
            </h2>
            <div className="space-y-3">
              {stats.topCreators.map((creator, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-sm font-semibold text-primary-600 dark:text-primary-400">
                      {index + 1}
                    </div>
                    <span className="text-gray-900 dark:text-gray-100">{creator.name}</span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {creator.count} {creator.count === 1 ? 'item' : 'items'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Publishers */}
        {stats.topPublishers.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Top Publishers
            </h2>
            <div className="space-y-3">
              {stats.topPublishers.map((publisher, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-sm font-semibold text-green-600 dark:text-green-400">
                      {index + 1}
                    </div>
                    <span className="text-gray-900 dark:text-gray-100">{publisher.name}</span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {publisher.count} {publisher.count === 1 ? 'item' : 'items'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
