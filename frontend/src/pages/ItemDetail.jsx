import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useItemStore } from '../store/itemStore';
import { useAuthStore } from '../store/authStore';
import { useCurrencyStore } from '../store/currencyStore';
import useReadingStatusStore from '../store/readingStatusStore';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiArrowLeft, FiCalendar, FiBook, FiMapPin, FiStar, FiHeart, FiBookOpen, FiCheckCircle, FiClock, FiLock, FiCopy, FiRefreshCw, FiFile, FiDownload, FiPrinter } from 'react-icons/fi';
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

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const getItemById = useItemStore((state) => state.getItemById);
  const { formatPrice } = useCurrencyStore();
  const { isAdmin, canModifyItems } = useAuthStore();
  const { deleteItem, updateItem, fetchItems } = useItemStore();
  const { fetchReadingStatus, updateReadingStatus, deleteReadingStatus, getReadingStatus } = useReadingStatusStore();
  const [item, setItem] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [readingStatus, setReadingStatus] = useState(null);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [labelSettings, setLabelSettings] = useState(null);

  useEffect(() => {
    fetchItems().then(() => {
      const foundItem = getItemById(id);
      if (foundItem) {
        setItem(foundItem);
        // Fetch reading status
        fetchReadingStatus(id).then((status) => {
          setReadingStatus(status.status ? status : null);
        });
      } else {
        toast.error('Item not found');
        navigate('/items');
      }
    });
  }, [id, fetchItems, getItemById, fetchReadingStatus, navigate]);

  const handleReadingStatusChange = async (status, startDate = null, endDate = null) => {
    try {
      const updated = await updateReadingStatus(parseInt(id), status, startDate, endDate);
      setReadingStatus(updated);
      setShowStatusPicker(false);
      toast.success('Reading status updated');
    } catch (error) {
      toast.error('Failed to update reading status');
    }
  };

  const handleRemoveReadingStatus = async () => {
    try {
      await deleteReadingStatus(parseInt(id));
      setReadingStatus(null);
      toast.success('Reading status removed');
    } catch (error) {
      toast.error('Failed to remove reading status');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteItem(parseInt(id));
      toast.success('Item deleted successfully');
      navigate('/items');
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const handleDuplicate = () => {
    // Navigate to add item page with item data as state
    navigate('/items/add', { 
      state: { 
        duplicateFrom: {
          ...item,
          // Clear unique fields that shouldn't be duplicated
          id: undefined,
          created_at: undefined,
          updated_at: undefined,
          // Suggest user updates these
          notes: item.notes ? `[Copy] ${item.notes}` : '',
          condition: '', // User should set condition for the new copy
          purchase_date: '', // User should set purchase date for new copy
          purchase_price: '', // User should set price for new copy
          location: '', // User should set location for new copy
        }
      }
    });
  };

  const handleWishlistToggle = async () => {
    try {
      const updatedItem = { ...item, wishlist: !item.wishlist };
      await updateItem(parseInt(id), updatedItem);
      setItem(updatedItem);
      toast.success(updatedItem.wishlist ? 'Added to wishlist' : 'Removed from wishlist');
    } catch (error) {
      toast.error('Failed to update wishlist');
    }
  };

  const handleRatingChange = async (rating) => {
    try {
      const updatedItem = { ...item, rating };
      await updateItem(parseInt(id), updatedItem);
      setItem(updatedItem);
      toast.success(rating === 0 ? 'Rating removed' : `Rated ${rating} stars`);
    } catch (error) {
      toast.error('Failed to update rating');
    }
  };

  const handleFavoriteToggle = async () => {
    try {
      const updatedItem = { ...item, favorite: !item.favorite };
      await updateItem(parseInt(id), updatedItem);
      setItem(updatedItem);
      toast.success(updatedItem.favorite ? 'Added to favorites' : 'Removed from favorites');
    } catch (error) {
      toast.error('Failed to update favorite');
    }
  };

  const handleJellyfinResync = async () => {
    if (!item.jellyfin_id) return;
    
    try {
      toast.loading('Resyncing with Jellyfin...', { id: 'resync' });
      
      // Fetch fresh metadata from Jellyfin
      const response = await api.get(`/api/lookup/jellyfin/resync/${item.jellyfin_id}`, {
        params: { type: item.type }
      });
      
      const freshData = response.data;
      
      // Prepare updated item data
      const updatedItemData = {
        title: freshData.title,
        subtitle: freshData.subtitle,
        description: freshData.description,
        creators: freshData.creators,
        metadata: freshData.metadata,
        jellyfin_url: freshData.jellyfin_url,
      };
      
      // Download new cover image if available
      if (freshData.cover_url_proxy) {
        updatedItemData.cover_url = freshData.cover_url_proxy;
      }
      
      // Update the item
      await updateItem(parseInt(id), updatedItemData);
      
      // Refresh the page to show updated data
      const refreshedItem = await getItemById(parseInt(id));
      setItem(refreshedItem);
      
      toast.success('Successfully resynced with Jellyfin!', { id: 'resync' });
    } catch (error) {
      console.error('Resync error:', error);
      toast.error(error.response?.data?.message || 'Failed to resync with Jellyfin', { id: 'resync' });
    }
  };

  const handlePrintLabel = async () => {
    try {
      // Load label settings from API
      const response = await api.get('/api/settings/labels');
      const settings = response.data;
      
      // Check if base URL is configured
      if (!settings.baseUrl) {
        toast.error('Please configure label settings first (Profile → Label Settings)');
        navigate('/label-settings');
        return;
      }

      setLabelSettings(settings);
      setShowPrintPreview(true);
      
      // Don't auto-open print dialog - let user see preview first
    } catch (error) {
      console.error('Error loading label settings:', error);
      toast.error('Failed to load label settings');
    }
  };

  if (!item) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Link to="/items" className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
        <FiArrowLeft className="mr-2" />
        Back to Library
      </Link>

      <div className="card">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover Image */}
          <div className="md:w-1/3">
            {item.cover_url ? (
              <img
                src={getImageUrl(item.cover_url)}
                alt={item.title}
                className="w-full rounded-lg shadow-lg"
              />
            ) : (
              <div className="w-full aspect-[2/3] bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <FiBook className="w-16 h-16 text-gray-400 dark:text-gray-500" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="md:w-2/3 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-sm rounded-full capitalize">
                  {item.type}
                </span>
                {item.wishlist ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 text-sm rounded-full">
                    <FiHeart className="w-3 h-3 fill-current" />
                    Wishlist
                  </span>
                ) : null}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{item.title}</h1>
              {item.subtitle && (
                <p className="text-xl text-gray-600 dark:text-gray-400 mt-1">{item.subtitle}</p>
              )}
              {item.creators && item.creators.length > 0 && (
                <div className="mt-3 space-y-1">
                  {item.creators.map((creator, idx) => (
                    creator.name && (
                      <p key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                        {creator.role && <span className="font-medium capitalize">{creator.role}: </span>}
                        {creator.name}
                      </p>
                    )
                  ))}
                </div>
              )}
            </div>

            {/* Rating and Favorite */}
            <div className="flex items-center gap-6">
              {/* Star Rating */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Rating:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRatingChange(star)}
                      className="focus:outline-none transition-colors"
                      disabled={!canModifyItems()}
                    >
                      <FiStar
                        className={`w-5 h-5 ${
                          star <= (item.rating || 0)
                            ? 'text-yellow-500 fill-current'
                            : 'text-gray-300 dark:text-gray-600'
                        } ${canModifyItems() ? 'hover:text-yellow-400 cursor-pointer' : 'cursor-default'}`}
                      />
                    </button>
                  ))}
                  {item.rating > 0 && canModifyItems() && (
                    <button
                      onClick={() => handleRatingChange(0)}
                      className="ml-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Favorite Toggle */}
              <button
                onClick={handleFavoriteToggle}
                className={`flex items-center gap-2 px-3 py-1 rounded-full transition-colors ${
                  item.favorite
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                disabled={!canModifyItems()}
              >
                <FiHeart className={`w-4 h-4 ${item.favorite ? 'fill-current' : ''}`} />
                <span className="text-sm">{item.favorite ? 'Favorited' : 'Favorite'}</span>
              </button>
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-200 dark:border-gray-700">
              {item.isbn && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">ISBN</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{item.isbn}</p>
                </div>
              )}
              {item.barcode && item.barcode !== item.isbn && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Barcode</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{item.barcode}</p>
                </div>
              )}
              {item.publisher && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Publisher</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{item.publisher}</p>
                </div>
              )}
              {item.publish_date && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Published</p>
                  <p className="font-medium flex items-center gap-1 text-gray-900 dark:text-gray-100">
                    <FiCalendar className="w-4 h-4" />
                    {item.publish_date}
                  </p>
                </div>
              )}
              {item.page_count && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pages</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{item.page_count}</p>
                </div>
              )}
              {item.file_path && item.type === 'ebook' && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">File</p>
                  <p className="font-medium flex items-center gap-1 text-gray-900 dark:text-gray-100 break-all">
                    <FiFile className="w-4 h-4 flex-shrink-0" />
                    <span className="break-all">{item.file_path.split('/').pop().split('_').slice(3).join('_') || 'Ebook file attached'}</span>
                  </p>
                </div>
              )}
              {item.condition && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Condition</p>
                  <p className="font-medium capitalize text-gray-900 dark:text-gray-100">{item.condition}</p>
                </div>
              )}
              {item.location && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
                  <p className="font-medium flex items-center gap-1 text-gray-900 dark:text-gray-100">
                    <FiMapPin className="w-4 h-4" />
                    {item.location}
                  </p>
                </div>
              )}
              {item.spine_width && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Spine Width</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {item.spine_width} mm
                  </p>
                </div>
              )}
              {item.purchase_date && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Purchase Date</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {item.purchase_date}
                  </p>
                </div>
              )}
              {item.purchase_price && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Purchase Price</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {formatPrice(parseFloat(item.purchase_price))}
                  </p>
                </div>
              )}
            </div>

            {/* Reading Status - Only for books, comics, and ebooks */}
            {['book', 'comic', 'ebook'].includes(item?.type) && (
              <div className="py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Reading Status</h3>
                {readingStatus && (
                  <button
                    onClick={handleRemoveReadingStatus}
                    className="text-xs text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                  >
                    Remove
                  </button>
                )}
              </div>
              
              {readingStatus ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {readingStatus.status === 'want_to_read' && (
                      <>
                        <FiClock className="text-yellow-500" />
                        <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-sm font-medium">
                          Want to Read
                        </span>
                      </>
                    )}
                    {readingStatus.status === 'reading' && (
                      <>
                        <FiBookOpen className="text-blue-500" />
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium">
                          Currently Reading
                        </span>
                      </>
                    )}
                    {readingStatus.status === 'read' && (
                      <>
                        <FiCheckCircle className="text-green-500" />
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                          Read
                        </span>
                      </>
                    )}
                    <button
                      onClick={() => setShowStatusPicker(!showStatusPicker)}
                      className="text-xs text-primary-600 dark:text-primary-400 hover:underline ml-auto"
                    >
                      Change
                    </button>
                  </div>
                  
                  {(readingStatus.start_date || readingStatus.end_date) && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      {readingStatus.start_date && (
                        <div className="flex items-center gap-2">
                          <FiCalendar className="w-4 h-4" />
                          <span>Started: {readingStatus.start_date}</span>
                        </div>
                      )}
                      {readingStatus.end_date && (
                        <div className="flex items-center gap-2">
                          <FiCalendar className="w-4 h-4" />
                          <span>Finished: {readingStatus.end_date}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {showStatusPicker && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-2">
                      <button
                        onClick={() => handleReadingStatusChange('want_to_read')}
                        className="w-full text-left px-3 py-2 rounded hover:bg-yellow-100 dark:hover:bg-yellow-900/30 text-sm"
                      >
                        <FiClock className="inline mr-2 text-yellow-500" />
                        Want to Read
                      </button>
                      <button
                        onClick={() => handleReadingStatusChange('reading')}
                        className="w-full text-left px-3 py-2 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-sm"
                      >
                        <FiBookOpen className="inline mr-2 text-blue-500" />
                        Currently Reading
                      </button>
                      <button
                        onClick={() => handleReadingStatusChange('read')}
                        className="w-full text-left px-3 py-2 rounded hover:bg-green-100 dark:hover:bg-green-900/30 text-sm"
                      >
                        <FiCheckCircle className="inline mr-2 text-green-500" />
                        Read
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowStatusPicker(!showStatusPicker)}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  + Set reading status
                </button>
              )}
              
              {!readingStatus && showStatusPicker && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-2">
                  <button
                    onClick={() => handleReadingStatusChange('want_to_read')}
                    className="w-full text-left px-3 py-2 rounded hover:bg-yellow-100 dark:hover:bg-yellow-900/30 text-sm"
                  >
                    <FiClock className="inline mr-2 text-yellow-500" />
                    Want to Read
                  </button>
                  <button
                    onClick={() => handleReadingStatusChange('reading')}
                    className="w-full text-left px-3 py-2 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-sm"
                  >
                    <FiBookOpen className="inline mr-2 text-blue-500" />
                    Currently Reading
                  </button>
                  <button
                    onClick={() => handleReadingStatusChange('read')}
                    className="w-full text-left px-3 py-2 rounded hover:bg-green-100 dark:hover:bg-green-900/30 text-sm"
                  >
                    <FiCheckCircle className="inline mr-2 text-green-500" />
                    Read
                  </button>
                </div>
              )}
              </div>
            )}

            {/* Track Listing - Only for CDs and Vinyl with track data */}
            {['cd', 'vinyl'].includes(item?.type) && item.metadata?.tracks && item.metadata.tracks.length > 0 && (
              <div className="py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Track Listing ({item.metadata.track_count} tracks
                    {item.metadata.total_duration && ` • ${Math.floor(item.metadata.total_duration / 60)}:${String(item.metadata.total_duration % 60).padStart(2, '0')}`})
                  </h3>
                </div>
                <div className="space-y-1">
                  {item.metadata.tracks.map((track, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded text-sm"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-gray-500 dark:text-gray-400 w-8 text-right">
                          {track.number || index + 1}.
                        </span>
                        <span className="text-gray-900 dark:text-gray-100">
                          {track.title}
                        </span>
                      </div>
                      {track.duration && (
                        <span className="text-gray-500 dark:text-gray-400 text-xs">
                          {Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, '0')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4">
              {canModifyItems() ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <button
                    onClick={handleWishlistToggle}
                    className={`btn ${item.wishlist ? 'btn-secondary' : 'btn-primary'} flex items-center justify-center gap-2`}
                  >
                    <FiHeart className={`inline ${item.wishlist ? 'fill-current' : ''}`} />
                    <span className="hidden sm:inline">{item.wishlist ? 'Remove from' : 'Add to'} Wishlist</span>
                    <span className="sm:hidden">Wishlist</span>
                  </button>
                  {item.file_path && item.type === 'ebook' && (
                    <>
                      <Link
                        to={`/items/${id}/read`}
                        className="btn btn-primary flex items-center justify-center gap-2"
                        title="Read this ebook"
                      >
                        <FiBookOpen className="inline" />
                        <span className="hidden sm:inline">Read</span>
                      </Link>
                      <a
                        href={`${API_URL}${item.file_path}`}
                        download
                        className="btn btn-secondary flex items-center justify-center gap-2"
                        title="Download ebook file"
                      >
                        <FiDownload className="inline" />
                        <span className="hidden sm:inline">Download</span>
                      </a>
                    </>
                  )}
                  {item.jellyfin_id && (
                    <button
                      onClick={handleJellyfinResync}
                      className="btn btn-secondary flex items-center justify-center gap-2"
                      title="Update metadata from Jellyfin"
                    >
                      <FiRefreshCw className="inline" />
                      <span className="hidden sm:inline">Resync</span>
                    </button>
                  )}
                  <button
                    onClick={handlePrintLabel}
                    className="btn btn-secondary flex items-center justify-center gap-2"
                    title="Print QR code label for this item"
                  >
                    <FiPrinter className="inline" />
                    <span className="hidden sm:inline">Print Label</span>
                  </button>
                  <button
                    onClick={handleDuplicate}
                    className="btn btn-secondary flex items-center justify-center gap-2"
                    title="Create a copy of this item (useful for multiple editions)"
                  >
                    <FiCopy className="inline" />
                    <span className="hidden sm:inline">Duplicate</span>
                  </button>
                  <Link to={`/items/${id}/edit`} className="btn btn-primary flex items-center justify-center gap-2">
                    <FiEdit2 className="inline" />
                    <span className="hidden sm:inline">Edit</span>
                  </Link>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="btn btn-danger flex items-center justify-center gap-2"
                  >
                    <FiTrash2 className="inline" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <FiLock />
                  <span>Read-only access - Contact an admin to edit this item</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {item.description && (
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Description</h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{item.description}</p>
          </div>
        )}

        {/* Personal Notes */}
        {item.notes && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Personal Notes</h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{item.notes}</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Delete Item?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete "{item.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="btn btn-danger flex-1"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal - Shows on screen before printing */}
      {showPrintPreview && labelSettings && (
        <>
          {/* On-screen preview modal */}
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Label Preview
                </h3>
                <button
                  onClick={() => setShowPrintPreview(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              
              <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-auto bg-gray-50 dark:bg-gray-700 p-4 mb-4 flex items-center justify-center">
                <div style={{ zoom: 0.8 }}>
                  <ItemLabel item={item} settings={labelSettings} />
                </div>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                <p>• Label size: {labelSettings.labelWidth} × {labelSettings.labelHeight} mm</p>
                <p>• Preview scaled to fit screen - actual print will be full size</p>
                <p>• Make sure to enable "Print backgrounds" in your browser's print dialog</p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    window.print();
                    setTimeout(() => setShowPrintPreview(false), 500);
                  }}
                  className="btn btn-primary flex-1"
                >
                  Print Label
                </button>
                <button
                  onClick={() => setShowPrintPreview(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

          {/* Print content using Portal - renders directly to body */}
          {createPortal(
            <div id="print-label">
              <ItemLabel item={item} settings={labelSettings} />
            </div>,
            document.body
          )}
        </>
      )}

      {/* CSS for print mode */}
      <style>{`
        /* Show only the print label when printing */
        @media print {
          /* Hide all body children except our print content */
          body > *:not(#print-label) {
            display: none !important;
          }
          
          /* Show and position the label */
          #print-label {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            margin: 0;
            padding: 0;
          }
          
          /* Configure page */
          @page {
            margin: 0;
            padding: 0;
          }
          
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
        }
        
        /* Hide print content on screen */
        #print-label {
          display: none;
        }
      `}</style>
    </div>
  );
}
