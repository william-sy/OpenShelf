import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useItemStore } from '../store/itemStore';
import { FiBook, FiSearch, FiFilter, FiPlus, FiImage } from 'react-icons/fi';

export default function ItemList() {
  const { items, loading, filter, setFilter, fetchItems } = useItemStore();
  const [searchInput, setSearchInput] = useState(filter.search);

  useEffect(() => {
    fetchItems();
  }, [filter, fetchItems]);

  const handleSearch = (e) => {
    e.preventDefault();
    setFilter({ search: searchInput });
  };

  const handleTypeFilter = (type) => {
    setFilter({ type: type === filter.type ? '' : type });
  };

  const types = [
    { value: '', label: 'All' },
    { value: 'book', label: 'Books' },
    { value: 'comic', label: 'Comics' },
    { value: 'cd', label: 'CDs' },
    { value: 'vinyl', label: 'Vinyl' },
    { value: 'dvd', label: 'DVDs' },
    { value: 'bluray', label: 'Blu-ray' },
    { value: 'ebook', label: 'Ebooks' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Library</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{items.length} items in your collection</p>
        </div>
        <Link to="/items/add" className="btn btn-primary">
          <FiPlus className="inline mr-2" />
          Add Item
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by title, author, or ISBN..."
                className="input pl-10"
              />
            </div>
          </form>

          {/* Type Filter */}
          <div className="flex items-center space-x-2">
            <FiFilter className="text-gray-400" />
            {types.map((type) => (
              <button
                key={type.value}
                onClick={() => handleTypeFilter(type.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter.type === type.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Loading items...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center py-12">
          <FiBook className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
            No items found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {filter.search || filter.type
              ? 'Try adjusting your filters'
              : 'Start adding items to your library'}
          </p>
          {!filter.search && !filter.type && (
            <Link to="/items/add" className="btn btn-primary inline-block">
              <FiPlus className="inline mr-2" />
              Add Your First Item
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map((item) => (
            <Link
              key={item.id}
              to={`/items/${item.id}`}
              className="card hover:shadow-lg transition-shadow p-4"
            >
              {item.cover_url ? (
                <img
                  src={item.cover_url}
                  alt={item.title}
                  className="w-full h-48 object-cover rounded-lg mb-3"
                />
              ) : (
                <div className="w-full h-48 bg-gray-100 dark:bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
                  <FiImage className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                </div>
              )}
              <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2 mb-1">
                {item.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mb-2">
                {item.authors?.join(', ') || 'Unknown'}
              </p>
              <span className="inline-block px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs rounded">
                {item.type}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
