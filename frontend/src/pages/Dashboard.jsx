import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useItemStore } from '../store/itemStore';
import { useAuthStore } from '../store/authStore';
import { FiBook, FiDisc, FiImage, FiPlus, FiFilm, FiFileText } from 'react-icons/fi';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { items, fetchItems } = useItemStore();

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const stats = {
    total: items.length,
    books: items.filter((i) => i.type === 'book').length,
    comics: items.filter((i) => i.type === 'comic').length,
    cds: items.filter((i) => i.type === 'cd').length,
    vinyl: items.filter((i) => i.type === 'vinyl').length,
    dvds: items.filter((i) => i.type === 'dvd').length,
    blurays: items.filter((i) => i.type === 'bluray').length,
    ebooks: items.filter((i) => i.type === 'ebook').length,
  };

  const recentItems = items.slice(0, 5);

  const statCards = [
    { label: 'Total Items', value: stats.total, icon: FiImage, color: 'bg-blue-500' },
    { label: 'Books', value: stats.books, icon: FiBook, color: 'bg-green-500' },
    { label: 'Comics', value: stats.comics, icon: FiImage, color: 'bg-purple-500' },
    { label: 'CDs', value: stats.cds, icon: FiDisc, color: 'bg-orange-500' },
    { label: 'Vinyl', value: stats.vinyl, icon: FiDisc, color: 'bg-pink-500' },
    { label: 'DVDs', value: stats.dvds, icon: FiFilm, color: 'bg-red-500' },
    { label: 'Blu-rays', value: stats.blurays, icon: FiFilm, color: 'bg-indigo-500' },
    { label: 'Ebooks', value: stats.ebooks, icon: FiFileText, color: 'bg-teal-500' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100">
          Welcome back, {user?.display_name || user?.username}! 👋
        </h1>
        <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 mt-2">
          Here's an overview of your library collection
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="card">
            <div className="flex flex-col items-center text-center">
              <div className={`${stat.color} p-3 rounded-lg mb-3`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100">
                {stat.value}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400 mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/items/add"
            className="flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
          >
            <FiPlus className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100 dark:text-gray-100">Add Item</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">Manually or via ISBN</p>
            </div>
          </Link>

          <Link
            to="/items?type=book"
            className="flex items-center space-x-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
          >
            <FiBook className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100 dark:text-gray-100">Browse Books</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">View your book collection</p>
            </div>
          </Link>

          <Link
            to="/items"
            className="flex items-center space-x-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
          >
            <FiImage className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100 dark:text-gray-100">View All</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">Browse entire library</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Items */}
      {recentItems.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100">Recently Added</h2>
            <Link to="/items" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {recentItems.map((item) => (
              <Link
                key={item.id}
                to={`/items/${item.id}`}
                className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {item.cover_url ? (
                  <img
                    src={item.cover_url}
                    alt={item.title}
                    className="w-12 h-16 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                    <FiBook className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 dark:text-gray-100 truncate">{item.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400 truncate">
                    {item.authors?.join(', ') || 'Unknown author'}
                  </p>
                </div>
                <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs rounded">
                  {item.type}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {items.length === 0 && (
        <div className="card text-center py-12">
          <FiBook className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 dark:text-gray-100 mb-2">
            Your library is empty
          </h3>
          <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 mb-6">
            Start building your collection by adding your first item
          </p>
          <Link to="/items/add" className="btn btn-primary inline-block">
            <FiPlus className="inline mr-2" />
            Add Your First Item
          </Link>
        </div>
      )}
    </div>
  );
}
