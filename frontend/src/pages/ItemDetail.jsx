import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useItemStore } from '../store/itemStore';
import { useAuthStore } from '../store/authStore';
import { useCurrencyStore } from '../store/currencyStore';
import useReadingStatusStore from '../store/readingStatusStore';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiArrowLeft, FiCalendar, FiBook, FiMapPin, FiStar, FiHeart, FiBookOpen, FiCheckCircle, FiClock, FiLock } from 'react-icons/fi';

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const getItemById = useItemStore((state) => state.getItemById);
  const { formatPrice } = useCurrencyStore();
  const { isAdmin } = useAuthStore();
  const { deleteItem, updateItem, fetchItems } = useItemStore();
  const { fetchReadingStatus, updateReadingStatus, deleteReadingStatus, getReadingStatus } = useReadingStatusStore();
  const [item, setItem] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [readingStatus, setReadingStatus] = useState(null);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

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
                src={item.cover_url}
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
                    <p key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium capitalize">{creator.role}:</span> {creator.name}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Rating */}
            {item.rating && (
              <div className="flex items-center gap-2">
                <FiStar className="text-yellow-500 fill-current" />
                <span className="text-lg text-gray-900 dark:text-gray-100">
                  {item.rating}/5
                </span>
              </div>
            )}

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

            {/* Reading Status */}
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
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleWishlistToggle}
                className={`btn ${item.wishlist ? 'btn-secondary' : 'btn-primary'} flex items-center gap-2`}
              >
                <FiHeart className={`inline ${item.wishlist ? 'fill-current' : ''}`} />
                {item.wishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
              </button>
              {isAdmin() ? (
                <>
                  <Link to={`/items/${id}/edit`} className="btn btn-primary flex-1">
                    <FiEdit2 className="inline mr-2" />
                    Edit
                  </Link>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="btn btn-danger"
                  >
                    <FiTrash2 className="inline mr-2" />
                    Delete
                  </button>
                </>
              ) : (
                <div className="flex-1 flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm px-4">
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
    </div>
  );
}
