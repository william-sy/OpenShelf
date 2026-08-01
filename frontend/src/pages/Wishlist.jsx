import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useItemStore } from '../store/itemStore';
import { useAuthStore } from '../store/authStore';
import { FiPlus, FiHeart, FiFilter, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getImageUrl } from '../utils/imageUrl';
import { MEDIA_TYPE_ORDER, getMediaTypeMeta } from '../utils/mediaType';

export default function Wishlist() {
  const { items, fetchItems, loading, updateItem } = useItemStore();
  const { canModifyItems } = useAuthStore();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    const filtered = items.filter(item => item.wishlist);
    if (selectedType !== 'all') {
      setWishlistItems(filtered.filter(item => item.type === selectedType));
    } else {
      setWishlistItems(filtered);
    }
  }, [items, selectedType]);

  const types = MEDIA_TYPE_ORDER.filter((type) =>
    items.some((item) => item.wishlist && item.type === type)
  );

  const handleMarkAcquired = async (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await updateItem(item.id, { ...item, wishlist: false });
      toast.success(`Marked "${item.title}" as acquired`);
    } catch (error) {
      toast.error('Failed to update item');
    }
  };

  const getItemsByType = () => {
    const grouped = {};
    wishlistItems.forEach(item => {
      if (!grouped[item.type]) {
        grouped[item.type] = [];
      }
      grouped[item.type].push(item);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <FiHeart className="text-pink-500 fill-current" />
            My Wishlist
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} you want to add to your collection
          </p>
        </div>
        <Link to="/items/add" className="btn btn-primary">
          <FiPlus className="inline mr-2" />
          Add Item
        </Link>
      </div>

      {/* Type Filter - dropdown rather than a flat chip wall, consistent
          with the Library page's filter */}
      {types.length > 1 && (
        <div className="relative inline-flex items-center">
          <FiFilter className="absolute left-3 text-gray-400 pointer-events-none w-4 h-4" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            aria-label="Filter wishlist by format"
            className="input pl-9 pr-8 py-2 w-auto text-sm font-medium"
          >
            <option value="all">All formats ({items.filter(item => item.wishlist).length})</option>
            {types.map((type) => (
              <option key={type} value={type}>
                {getMediaTypeMeta(type).label} ({items.filter(item => item.wishlist && item.type === type).length})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Wishlist Items */}
      {wishlistItems.length === 0 ? (
        <div className="card text-center py-12">
          <FiHeart className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Your wishlist is empty
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Add items you want to acquire to keep track of your collection goals
          </p>
          <Link to="/items/add" className="btn btn-primary inline-flex items-center">
            <FiPlus className="mr-2" />
            Add Your First Wishlist Item
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistItems.map(item => {
            const meta = getMediaTypeMeta(item.type);
            const Icon = meta.icon;
            return (
              <Link
                key={item.id}
                to={`/items/${item.id}`}
                className="card hover:shadow-lg transition-shadow group"
              >
                <div className="relative">
                  {item.cover_url ? (
                    <img
                      src={getImageUrl(item.cover_url)}
                      alt={item.title}
                      className="w-full h-64 object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-t-lg flex items-center justify-center">
                      <Icon className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    {canModifyItems() ? (
                      <button
                        type="button"
                        onClick={(e) => handleMarkAcquired(e, item)}
                        className="bg-pink-500 hover:bg-green-600 text-white p-2 rounded-full shadow-lg transition-colors group/badge relative"
                        title="Mark as acquired (remove from wishlist)"
                        aria-label="Mark as acquired"
                      >
                        <FiHeart className="w-4 h-4 fill-current group-hover/badge:hidden" />
                        <FiCheck className="w-4 h-4 hidden group-hover/badge:block" />
                      </button>
                    ) : (
                      <div className="bg-pink-500 text-white p-2 rounded-full shadow-lg">
                        <FiHeart className="w-4 h-4 fill-current" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex flex-wrap gap-1 mb-2">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${meta.chip}`}>
                      {meta.label}
                    </span>
                    {item.tags?.find(tag => tag.startsWith('Series: ')) && (
                      <span className="inline-block px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded-full">
                        {item.tags.find(tag => tag.startsWith('Series: ')).replace('Series: ', '')}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  {item.subtitle && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-1">
                      {item.subtitle}
                    </p>
                  )}
                  {item.creators && item.creators.length > 0 && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                      {item.creators[0].name}
                      {item.creators.length > 1 && ` +${item.creators.length - 1}`}
                    </p>
                  )}
                  {item.publisher && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {item.publisher}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Summary by Type */}
      {wishlistItems.length > 0 && selectedType === 'all' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Wishlist Summary
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(getItemsByType()).map(([type, typeItems]) => {
              const meta = getMediaTypeMeta(type);
              const Icon = meta.icon;
              return (
                <div key={type} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Icon className={`w-8 h-8 mx-auto mb-2 ${meta.text}`} />
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {typeItems.length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{meta.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
