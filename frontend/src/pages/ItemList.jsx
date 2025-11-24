import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useItemStore } from '../store/itemStore';
import { useAuthStore } from '../store/authStore';
import { FiBook, FiSearch, FiFilter, FiPlus, FiImage, FiHeart, FiDownload, FiUpload, FiLock, FiStar, FiPrinter, FiCheckSquare, FiSquare, FiBookOpen } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api, { API_URL } from '../services/api';
import ItemLabel from '../components/ItemLabel';

// Helper to convert relative API URLs to absolute URLs
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/api/')) return `${API_URL}${url}`;
  if (url.startsWith('/')) return `${API_URL}${url}`;
  return url;
};

export default function ItemList() {
  const { items, loading, filter, setFilter, fetchItems } = useItemStore();
  const { isAdmin, canModifyItems } = useAuthStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState(filter.search);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const lastUrlType = useRef(null); // Start as null so first check always runs
  const [selectedItems, setSelectedItems] = useState([]);
  const [showMultiPrintModal, setShowMultiPrintModal] = useState(false);
  const [labelSettings, setLabelSettings] = useState(null);
  const [combineLabels, setCombineLabels] = useState(false);

  // Sync filter from URL params when URL changes
  useEffect(() => {
    const typeParam = searchParams.get('type') || '';
    // Only update if URL actually changed (not if filter changed internally)
    if (lastUrlType.current === null || typeParam !== lastUrlType.current) {
      lastUrlType.current = typeParam;
      setFilter({ type: typeParam });
    }
  }, [searchParams, setFilter]);

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

  const handleFavoriteFilter = (value) => {
    setFilter({ favorite: filter.favorite === value ? null : value });
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

  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const selectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(item => item.id));
    }
  };

  const handleMultiPrint = async () => {
    if (selectedItems.length === 0) {
      toast.error('Please select at least one item to print');
      return;
    }

    try {
      const response = await api.get('/api/settings/labels');
      const settings = response.data;
      
      if (!settings.baseUrl) {
        toast.error('Please configure label settings first');
        navigate('/label-settings');
        return;
      }

      setLabelSettings(settings);
      setShowMultiPrintModal(true);
    } catch (error) {
      toast.error('Failed to load label settings');
    }
  };

  const toggleFavorite = async (e, itemId) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const item = items.find(i => i.id === itemId);
      const newFavoriteStatus = !item.favorite;
      
      await api.put(`/api/items/${itemId}`, {
        ...item,
        favorite: newFavoriteStatus
      });
      
      toast.success(newFavoriteStatus ? 'Added to favorites' : 'Removed from favorites');
      fetchItems(); // Refresh the list
    } catch (error) {
      toast.error('Failed to update favorite status');
    }
  };

  const handleOpenReader = (e, itemId) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/items/${itemId}/read`);
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
            {!canModifyItems() && (
              <span className="ml-3 text-sm inline-flex items-center gap-1 text-yellow-600 dark:text-yellow-500">
                <FiLock className="text-xs" />
                Read-only access
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {selectedItems.length > 0 && (
            <button
              onClick={handleMultiPrint}
              className="btn btn-primary flex items-center gap-2"
            >
              <FiPrinter />
              Print {selectedItems.length} Label{selectedItems.length > 1 ? 's' : ''}
            </button>
          )}
          <button
            onClick={selectAll}
            className="btn btn-secondary flex items-center gap-2"
          >
            {selectedItems.length === items.length ? <FiCheckSquare /> : <FiSquare />}
            {selectedItems.length === items.length ? 'Deselect All' : 'Select All'}
          </button>
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
          {canModifyItems() && (
            <>
              {isAdmin() && (
                <button 
                  onClick={() => setShowImportModal(true)}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <FiUpload />
                  Import
                </button>
              )}
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
            onClick={() => handleFavoriteFilter(true)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter.favorite === true
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <FiHeart className={filter.favorite === true ? 'fill-current' : ''} />
            Favorites Only
          </button>
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
            <div key={item.id} className="card hover:shadow-lg transition-shadow p-4 relative">
              <Link to={`/items/${item.id}`} className="block">
                {item.cover_url ? (
                  <img
                    src={getImageUrl(item.cover_url)}
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
                {item.creators?.map(c => c.name).join(', ') || item.authors?.join(', ') || 'Unknown'}
              </p>
              {(item.rating > 0 || Boolean(item.favorite)) && (
                <div className="flex items-center gap-2 mb-2">
                  {item.rating > 0 && (
                    <div className="flex items-center gap-1">
                      {[...Array(item.rating)].map((_, i) => (
                        <FiStar key={i} className="w-3 h-3 text-yellow-500 fill-current" />
                      ))}
                    </div>
                  )}
                  {item.favorite ? (
                    <FiHeart className="w-3 h-3 text-red-500 fill-current" title="Favorite" />
                  ) : null}
                </div>
              )}
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
              
              {/* Quick Actions - Bottom Right Corner */}
              <div className="absolute bottom-2 right-2 z-10 flex gap-2">
                {/* Read Ebook Button - Only for ebooks with files */}
                {item.type === 'ebook' && item.file_path && (
                  <div 
                    onClick={(e) => handleOpenReader(e, item.id)}
                    className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    title="Open reader"
                  >
                    <FiBookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                )}

                {/* Favorite Button */}
                <div 
                  onClick={(e) => toggleFavorite(e, item.id)}
                  className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  title={item.favorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <FiHeart className={`w-4 h-4 ${
                    item.favorite 
                      ? 'text-red-600 dark:text-red-400 fill-current' 
                      : 'text-gray-400'
                  }`} />
                </div>

                {/* Print Selection Button */}
                <div 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleItemSelection(item.id);
                  }}
                  className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  title={selectedItems.includes(item.id) ? 'Deselect for printing' : 'Select for printing'}
                >
                  <FiPrinter className={`w-4 h-4 ${
                    selectedItems.includes(item.id) 
                      ? 'text-primary-600 dark:text-primary-400' 
                      : 'text-gray-400'
                  }`} />
                </div>
              </div>
            </div>
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

      {/* Multi-Print Modal */}
      {showMultiPrintModal && labelSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-6xl max-h-[90vh] overflow-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Print {selectedItems.length} Labels
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Preview your labels below. Click "Print Labels" when ready.
              <br />
              <strong>Note:</strong> Make sure to enable "Print backgrounds" in your browser's print dialog.
            </p>

            {/* Combine Labels Option */}
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={combineLabels}
                  onChange={(e) => setCombineLabels(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    Combine all labels on one page
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Stack labels vertically on a single page (useful for 10×15cm sheets with multiple 3cm labels)
                  </div>
                </div>
              </label>
            </div>

            {/* Preview of all labels */}
            {combineLabels ? (
              // Combined preview: All labels stacked vertically
              <div className="mb-6 border border-gray-300 dark:border-gray-600 rounded p-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Combined Label Preview (all on one page)
                </h3>
                <div className="border border-gray-200 dark:border-gray-700 rounded p-2 bg-white dark:bg-gray-900 overflow-auto">
                  <div style={{ 
                    zoom: 0.4,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0'
                  }}>
                    {selectedItems.map(itemId => {
                      const item = items.find(i => i.id === itemId);
                      if (!item) return null;
                      return (
                        <div key={itemId}>
                          <ItemLabel item={item} settings={labelSettings} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              // Separate preview: Each label in its own box
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Label Preview (each on separate page)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedItems.map(itemId => {
                    const item = items.find(i => i.id === itemId);
                    if (!item) return null;
                    return (
                      <div key={itemId} className="border border-gray-300 dark:border-gray-600 rounded p-2 overflow-hidden">
                        <div style={{ 
                          zoom: 0.5
                        }}>
                          <ItemLabel item={item} settings={labelSettings} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  window.print();
                }}
                className="btn btn-primary flex items-center gap-2"
              >
                <FiPrinter />
                Print Labels
              </button>
              <button
                onClick={() => {
                  setShowMultiPrintModal(false);
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden print area for multi-label - rendered directly to body via Portal */}
      {showMultiPrintModal && labelSettings && createPortal(
        <div id="print-labels" style={{ 
          display: 'none',
          pageBreakAfter: 'avoid'
        }}>
          {combineLabels ? (
            // Combined: All labels stacked vertically
            <div style={{ pageBreakAfter: 'avoid' }}>
              {selectedItems.map((itemId, index) => {
                const item = items.find(i => i.id === itemId);
                if (!item) return null;
                const isLast = index === selectedItems.length - 1;
                return (
                  <div key={itemId} style={{ pageBreakAfter: isLast ? 'avoid' : 'auto' }}>
                    <ItemLabel item={item} settings={labelSettings} />
                  </div>
                );
              })}
            </div>
          ) : (
            // Separate: Each label on its own page
            selectedItems.map((itemId, index) => {
              const item = items.find(i => i.id === itemId);
              if (!item) return null;
              return (
                <div key={itemId} style={{ 
                  pageBreakAfter: index < selectedItems.length - 1 ? 'always' : 'avoid',
                  pageBreakBefore: index > 0 ? 'always' : 'auto',
                  margin: 0,
                  padding: 0,
                  minHeight: '100vh'
                }}>
                  <ItemLabel item={item} settings={labelSettings} />
                </div>
              );
            })
          )}
        </div>,
        document.body
      )}

      {/* Print styles */}
      {showMultiPrintModal && labelSettings && (
        <style>
          {`
            @media print {
              @page {
                margin: 0;
              }
              
              @page:blank {
                display: none;
              }
              
              * {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                height: auto !important;
                overflow: visible !important;
              }
              
              /* Hide everything at body level except print-labels */
              body > *:not(#print-labels) {
                display: none !important;
              }
              
              /* Show print labels */
              #print-labels {
                display: block !important;
                margin: 0 !important;
                padding: 0 !important;
                page-break-after: avoid !important;
              }
              
              #print-labels > div {
                page-break-after: avoid !important;
              }
              
              .label-item {
                page-break-inside: avoid !important;
              }
              
              .label-item:last-child {
                page-break-after: avoid !important;
              }
            }
          `}
        </style>
      )}
    </div>
  );
}
