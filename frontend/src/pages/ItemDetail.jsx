import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useItemStore } from '../store/itemStore';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiArrowLeft, FiCalendar, FiBook, FiMapPin, FiStar } from 'react-icons/fi';

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const getItemById = useItemStore((state) => state.getItemById);
  const { deleteItem, fetchItems } = useItemStore();
  const [item, setItem] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchItems().then(() => {
      const foundItem = getItemById(id);
      if (foundItem) {
        setItem(foundItem);
      } else {
        toast.error('Item not found');
        navigate('/items');
      }
    });
  }, [id, fetchItems, getItemById, navigate]);

  const handleDelete = async () => {
    try {
      await deleteItem(parseInt(id));
      toast.success('Item deleted successfully');
      navigate('/items');
    } catch (error) {
      toast.error('Failed to delete item');
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
              <span className="inline-block px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-sm rounded-full capitalize mb-2">
                {item.type}
              </span>
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
