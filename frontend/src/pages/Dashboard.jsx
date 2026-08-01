import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useItemStore } from '../store/itemStore';
import { useAuthStore } from '../store/authStore';
import { FiBook, FiImage, FiPlus, FiAlertCircle, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { getImageUrl } from '../utils/imageUrl';
import { MEDIA_TYPE_ORDER, getMediaTypeMeta } from '../utils/mediaType';

export default function Dashboard() {
  const { user, canModifyItems } = useAuthStore();
  const { allItems, allItemsLoading, allItemsError, fetchAllItems } = useItemStore();
  const [showAllTypes, setShowAllTypes] = useState(false);

  useEffect(() => {
    fetchAllItems();
  }, [fetchAllItems]);

  const typeCounts = MEDIA_TYPE_ORDER.reduce((acc, type) => {
    acc[type] = allItems.filter((i) => i.type === type).length;
    return acc;
  }, {});

  const populatedTypes = MEDIA_TYPE_ORDER.filter((type) => typeCounts[type] > 0);
  const emptyTypes = MEDIA_TYPE_ORDER.filter((type) => typeCounts[type] === 0);
  const visibleTypes = showAllTypes ? MEDIA_TYPE_ORDER : populatedTypes;

  const recentItems = allItems.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Welcome back, {user?.display_name || user?.username}!{' '}
          <span aria-hidden="true">👋</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Here's an overview of your library collection
        </p>
      </div>

      {allItemsLoading ? (
        <div className="card text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Loading your library...</p>
        </div>
      ) : allItemsError ? (
        <div className="card text-center py-12">
          <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Couldn't load your library
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{allItemsError}</p>
          <button onClick={() => fetchAllItems()} className="btn btn-primary">
            Try again
          </button>
        </div>
      ) : allItems.length === 0 ? (
        <div className="card text-center py-12">
          <FiBook className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
            Your library is empty
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start building your collection by adding your first item
          </p>
          <Link to="/items/add" className="btn btn-primary inline-block">
            <FiPlus className="inline mr-2" />
            Add Your First Item
          </Link>
        </div>
      ) : (
        <>
          {/* Stats Grid - only populated formats + Total shown by default, avoids
              a wall of zero-count tiles for households collecting 2-3 formats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <Link
              to="/items"
              className="card hover:shadow-lg transition-shadow cursor-pointer ring-1 ring-primary-200 dark:ring-primary-800"
            >
              <div className="flex flex-col items-center text-center">
                <div className="bg-primary-600 p-3 rounded-lg mb-3">
                  <FiImage className="w-6 h-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{allItems.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Items</p>
              </div>
            </Link>
            {visibleTypes.map((type) => {
              const meta = getMediaTypeMeta(type);
              return (
                <Link
                  key={type}
                  to={`/items?type=${type}`}
                  className="card hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`${meta.solid} p-3 rounded-lg mb-3`}>
                      <meta.icon className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {typeCounts[type]}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{meta.label}</p>
                  </div>
                </Link>
              );
            })}
          </div>
          {emptyTypes.length > 0 && (
            <button
              onClick={() => setShowAllTypes((v) => !v)}
              className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1"
            >
              {showAllTypes ? (
                <>
                  <FiChevronUp /> Show only formats you own
                </>
              ) : (
                <>
                  <FiChevronDown /> Show all {MEDIA_TYPE_ORDER.length} formats
                </>
              )}
            </button>
          )}
        </>
      )}

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {canModifyItems() && (
            <Link
              to="/items/add"
              className="btn btn-primary flex items-center justify-start space-x-3 !py-4 !px-4 h-auto"
            >
              <FiPlus className="w-6 h-6 flex-shrink-0" />
              <div className="text-left">
                <p className="font-medium">Add Item</p>
                <p className="text-sm opacity-90">Manually or via ISBN</p>
              </div>
            </Link>
          )}

          <Link
            to="/items?type=book"
            className="flex items-center space-x-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
          >
            <FiBook className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Browse Books</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">View your book collection</p>
            </div>
          </Link>

          <Link
            to="/items"
            className="flex items-center space-x-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
          >
            <FiImage className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">View All</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Browse entire library</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Items */}
      {recentItems.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Recently Added</h2>
            <Link to="/items" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {recentItems.map((item) => {
              const meta = getMediaTypeMeta(item.type);
              return (
                <Link
                  key={item.id}
                  to={`/items/${item.id}`}
                  className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {item.cover_url ? (
                    <img
                      src={getImageUrl(item.cover_url)}
                      alt={item.title}
                      className="w-12 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                      <FiBook className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{item.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {item.authors?.join(', ') || 'Unknown author'}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${meta.chip}`}>
                    {meta.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
