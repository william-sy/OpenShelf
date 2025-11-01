import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useItemStore } from '../store/itemStore';
import { useAuthStore } from '../store/authStore';
import { FiBook, FiSearch, FiFilter, FiPlus, FiImage, FiHeart, FiDownload, FiUpload, FiLock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function ItemList() {
  const { items, loading, filter, setFilter, fetchItems } = useItemStore();
  const { isAdmin } = useAuthStore();
  const [searchInput, setSearchInput] = useState(filter.search);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [filter, fetchItems]);

  const handleSearch = (e) => {
    e.preventDefault();
    setFilter({ search: searchInput });
  };

  const handleTagClick = (tag) => {
    // Add tag to search if not already included
    if (!searchInput.includes(tag)) {
      const newSearch = searchInput ? `${searchInput} ${tag}` : tag;
      setSearchInput(newSearch);
      setFilter({ search: newSearch });
    }
  };

  const handleTypeFilter = (type) => {
    setFilter({ type: type === filter.type ? '' : type });
  };

  const handleWishlistFilter = (value) => {
    setFilter({ wishlist: filter.wishlist === value ? null : value });
  };

  const handleExport = async (format) => {
    try {
      const response = await api.get(`/api/items/export?format=${format}`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `openshelf-export.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(`Collection exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export collection');
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error('Please select a file to import');
      return;
    }

    setImporting(true);
    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const response = await api.post('/api/items/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success(
        `Imported ${response.data.imported} items successfully${
          response.data.skipped > 0 ? ` (${response.data.skipped} skipped)` : ''
        }`
      );
      setShowImportModal(false);
      setImportFile(null);
      fetchItems();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to import items');
    } finally {
      setImporting(false);
    }
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
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {items.length} items in your collection
            {!isAdmin() && (
              <span className="ml-3 text-sm inline-flex items-center gap-1 text-yellow-600 dark:text-yellow-500">
                <FiLock className="text-xs" />
                Read-only access
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative group">
            <button className="btn btn-secondary flex items-center gap-2">
              <FiDownload />
              Export
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => handleExport('json')}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-t-lg text-gray-900 dark:text-gray-100"
              >
                Export as JSON
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-b-lg text-gray-900 dark:text-gray-100"
              >
                Export as CSV
              </button>
            </div>
          </div>
          {isAdmin() && (
            <>
              <button 
                onClick={() => setShowImportModal(true)}
                className="btn btn-secondary flex items-center gap-2"
              >
                <FiUpload />
                Import
              </button>
              <Link to="/items/add" className="btn btn-primary flex items-center gap-2">
                <FiPlus />
                Add Item
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="card space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search library... (click tags below to add)"
                className="input pl-10"
              />
            </div>
          </form>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleWishlistFilter(true)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter.wishlist === true
                ? 'bg-pink-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <FiHeart className={filter.wishlist === true ? 'fill-current' : ''} />
            Wishlist Only
          </button>
          <button
            onClick={() => handleWishlistFilter(false)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter.wishlist === false
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Owned Only
          </button>
        </div>

        {/* Type Filter */}
        <div className="flex flex-wrap items-center gap-2">
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
              <div className="flex flex-wrap gap-1">
                <span className="inline-block px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs rounded">
                  {item.type}
                </span>
                {item.tags?.map((tag, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.preventDefault();
                      handleTagClick(tag);
                    }}
                    className={`inline-block px-2 py-1 text-xs rounded transition-colors hover:opacity-80 ${
                      tag.startsWith('Series: ')
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                    title="Click to add to search"
                  >
                    {tag.startsWith('Series: ') ? tag.replace('Series: ', '') : tag}
                  </button>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Import Items
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Upload a JSON or CSV file to import items into your library. The file should contain your exported collection data.
            </p>

            <div className="mb-6">
              <label className="label">Select File</label>
              <input
                type="file"
                accept=".json,.csv"
                onChange={(e) => setImportFile(e.target.files[0])}
                className="block w-full text-sm text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 focus:outline-none"
              />
              {importFile && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Selected: {importFile.name}
                </p>
              )}
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> Imported items will be added to your library. Existing items won't be duplicated if they have the same ISBN.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleImport}
                disabled={!importFile || importing}
                className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? 'Importing...' : 'Import'}
              </button>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                }}
                className="btn btn-secondary"
                disabled={importing}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
