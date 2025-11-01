import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiBook, FiBookOpen, FiClock, FiCheckCircle, FiTrendingUp, FiCalendar } from 'react-icons/fi';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function ReadingStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/reading-status/stats/overview');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching reading stats:', error);
      toast.error('Failed to load reading statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Failed to load statistics</p>
      </div>
    );
  }

  // Format books per month data for chart
  const booksPerMonthData = stats.booksPerMonth.map(item => ({
    month: item.month,
    books: item.count
  }));

  // Format pages per week data for chart
  const pagesPerWeekData = stats.pagesPerWeek.map(item => ({
    week: item.week,
    pages: item.total_pages || 0,
    books: item.books_count
  }));

  // Status breakdown for pie chart
  const statusData = [
    { name: 'Want to Read', value: stats.wantToRead.count, color: '#f59e0b' },
    { name: 'Currently Reading', value: stats.currentlyReading.count, color: '#3b82f6' },
    { name: 'Read', value: stats.totalRead.count, color: '#10b981' }
  ].filter(item => item.value > 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Reading Statistics</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Want to Read</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.wantToRead.count}
              </p>
            </div>
            <FiClock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Currently Reading</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.currentlyReading.count}
              </p>
              {stats.currentlyReading.totalPages > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {stats.currentlyReading.totalPages} pages total
                </p>
              )}
            </div>
            <FiBookOpen className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Books Read</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.totalRead.count}
              </p>
              {stats.totalRead.totalPages > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {stats.totalRead.totalPages.toLocaleString()} pages total
                </p>
              )}
            </div>
            <FiCheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Reading Velocity</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.readingVelocity.avgPagesPerDay > 0
                  ? Math.round(stats.readingVelocity.avgPagesPerDay)
                  : '—'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                pages/day average
              </p>
            </div>
            <FiTrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Books Per Month */}
        {booksPerMonthData.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Books Completed per Month
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={booksPerMonthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="books" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Reading Status Distribution */}
        {statusData.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Reading Status Distribution
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Pages Per Week */}
      {pagesPerWeekData.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Pages Read per Week (Last 8 Weeks)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={pagesPerWeekData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="pages" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Reading Velocity Details */}
      {stats.readingVelocity.avgDaysToComplete > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Reading Velocity Insights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Average Pages/Day</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {Math.round(stats.readingVelocity.avgPagesPerDay)}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Average Days to Complete</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {Math.round(stats.readingVelocity.avgDaysToComplete)}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Estimated Books/Year</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {Math.round(365 / stats.readingVelocity.avgDaysToComplete)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {stats.recentActivity.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Recent Activity
          </h2>
          <div className="space-y-3">
            {stats.recentActivity.map((activity) => (
              <Link
                key={activity.id}
                to={`/items/${activity.item_id}`}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                {activity.cover_url ? (
                  <img
                    src={activity.cover_url}
                    alt={activity.title}
                    className="w-12 h-16 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                    <FiBook className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {activity.status === 'want_to_read' && (
                      <span className="inline-flex items-center gap-1">
                        <FiClock className="w-3 h-3" />
                        Want to Read
                      </span>
                    )}
                    {activity.status === 'reading' && (
                      <span className="inline-flex items-center gap-1">
                        <FiBookOpen className="w-3 h-3" />
                        Currently Reading
                      </span>
                    )}
                    {activity.status === 'read' && (
                      <span className="inline-flex items-center gap-1">
                        <FiCheckCircle className="w-3 h-3" />
                        Read
                      </span>
                    )}
                    {activity.end_date && (
                      <span className="ml-2">• {activity.end_date}</span>
                    )}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {stats.totalRead.count === 0 &&
        stats.currentlyReading.count === 0 &&
        stats.wantToRead.count === 0 && (
          <div className="card text-center py-12">
            <FiBook className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
              No Reading Activity Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start tracking your reading by setting status on your books!
            </p>
            <Link to="/items" className="btn btn-primary inline-flex items-center gap-2">
              <FiBook />
              Go to Library
            </Link>
          </div>
        )}
    </div>
  );
}
